// PayU server-to-server notification. Gives the buyer an access code ONLY after PayU's own hash is verified.
const { env, needEnv, sb, payuHashOk, parseBody, fulfil } = require('./_lib');

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

    const code = await fulfil(p);
    return res.status(200).json({ ok: true, assigned: !!code });
  } catch (e) {
    console.error('payu-webhook error', e.message);
    return res.status(500).json({ ok: false, error: 'server error' }); // PayU can retry
  }
};
