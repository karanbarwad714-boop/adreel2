// PayU server-to-server notification. Gives the buyer an access code ONLY after PayU's own hash is verified.
const { env, needEnv, sb, payuHashOk, parseBody, sendCodeEmail, sendMetaPurchase } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  try {
    needEnv(['PAYU_KEY', 'PAYU_SALT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const p = parseBody(req);

    if (String(p.status || '').toLowerCase() !== 'success') return res.status(200).json({ ok: true, ignored: 'not a successful payment' });
    if (p.key && String(p.key) !== env('PAYU_KEY')) return res.status(400).json({ ok: false, error: 'wrong merchant key' });
    if (!payuHashOk(p, env('PAYU_SALT'), env('PAYU_KEY'))) {
      console.warn('PayU webhook hash mismatch for txnid', p.txnid);
      return res.status(400).json({ ok: false, error: 'hash mismatch' });
    }
    const amount = Number(p.amount);
    const min = Number(env('PRICE_MIN', '499'));
    if (!(amount >= min)) {
      console.warn('PayU webhook amount too low', p.txnid, p.amount);
      return res.status(200).json({ ok: true, ignored: 'amount below price' });
    }
    if (!p.txnid) return res.status(400).json({ ok: false, error: 'no txnid' });

    const raw = { ...p }; delete raw.hash;
    const code = await sb('rpc/assign_order_code', {
      method: 'POST',
      body: JSON.stringify({
        p_txnid: String(p.txnid), p_mihpayid: String(p.mihpayid || ''), p_email: String(p.email || '').toLowerCase(),
        p_phone: String(p.phone || ''), p_firstname: String(p.firstname || ''), p_amount: amount, p_raw: raw,
      }),
    });

    if (code && p.email) {
      const rows = await sb('orders?txnid=eq.' + encodeURIComponent(p.txnid) + '&select=emailed_at');
      if (rows && rows[0] && !rows[0].emailed_at) {
        try {
          const r = await sendCodeEmail({ to: p.email, name: p.firstname, code });
          if (r.sent) await sb('orders?txnid=eq.' + encodeURIComponent(p.txnid), { method: 'PATCH', body: JSON.stringify({ emailed_at: new Date().toISOString(), email_error: null }) });
        } catch (e) {
          console.error('email failed', e.message);
          await sb('orders?txnid=eq.' + encodeURIComponent(p.txnid), { method: 'PATCH', body: JSON.stringify({ email_error: e.message.slice(0, 300) }) });
        }
      }
    }
    try { await sendMetaPurchase({ txnid: String(p.txnid), email: p.email, phone: p.phone, firstname: p.firstname, amount }); }
    catch (e) { console.error('meta capi failed', e.message); }
    return res.status(200).json({ ok: true, assigned: !!code });
  } catch (e) {
    console.error('payu-webhook error', e.message);
    return res.status(500).json({ ok: false, error: 'server error' }); // PayU can retry
  }
};
