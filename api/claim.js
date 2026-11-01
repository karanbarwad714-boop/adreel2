// Thank You page asks: "I paid with this email / phone - what is my code?" Answers only for a payment PayU confirmed.
const { env, needEnv, sb, parseBody, sendCodeEmail } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  try {
    needEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const b = parseBody(req);
    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
    const okEmail = /^[^\s@,()*]+@[^\s@,()*]+\.[^\s@,()*]+$/.test(email);
    if (!okEmail && phone.length < 10) return res.status(400).json({ ok: false, error: 'Enter the email or mobile number you used on the PayU page.' });

    const filter = okEmail ? 'email=eq.' + encodeURIComponent(email) : 'phone=like.' + encodeURIComponent('*' + phone);
    const rows = await sb('orders?' + filter + '&order=id.desc&limit=1&select=txnid,access_code,firstname,email,emailed_at');
    if (!rows || !rows.length) return res.status(404).json({ ok: false, pending: true, error: 'Payment not confirmed yet. It can take a minute - try again shortly.' });

    let o = rows[0];
    if (!o.access_code) {
      return res.status(200).json({ ok: true, code: null, message: 'Payment confirmed. Your code is being prepared - we will email it within a few hours.' });
    }
    // Backup: if the email was never sent, try now.
    if (!o.emailed_at && o.email) {
      try {
        const r = await sendCodeEmail({ to: o.email, name: o.firstname, code: o.access_code });
        if (r.sent) await sb('orders?txnid=eq.' + encodeURIComponent(o.txnid), { method: 'PATCH', body: JSON.stringify({ emailed_at: new Date().toISOString() }) });
      } catch (e) { console.error('claim email failed', e.message); }
    }
    return res.status(200).json({ ok: true, code: o.access_code, name: o.firstname || '' });
  } catch (e) {
    console.error('claim error', e.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
};
