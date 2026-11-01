// Starts a PayU checkout. The price and the hash are made here on the server; the browser never sees the Salt.
const { env, needEnv, parseBody, payuRequestHash } = require('./_lib');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  try {
    needEnv(['PAYU_KEY', 'PAYU_SALT']);
    const b = parseBody(req);
    const firstname = String(b.name || '').replace(/[^\p{L}\p{N} .'-]/gu, '').trim().slice(0, 60);
    const email = String(b.email || '').trim().toLowerCase().slice(0, 80);
    const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
    if (!firstname) return res.status(400).json({ ok: false, error: 'Enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Enter a valid email. Your access code is sent there.' });
    if (phone.length !== 10) return res.status(400).json({ ok: false, error: 'Enter a 10 digit mobile number.' });

    const site = env('SITE_URL', 'https://adreel2.vercel.app').replace(/\/$/, '');
    const f = {
      key: env('PAYU_KEY'),
      txnid: 'AR' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex'),
      amount: Number(env('PRICE', '499')).toFixed(2),
      productinfo: 'Adreel Academy',
      firstname, email, phone,
      surl: site + '/api/payu-return', furl: site + '/api/payu-return',
    };
    f.hash = payuRequestHash(f, env('PAYU_KEY'), env('PAYU_SALT'));
    return res.status(200).json({ ok: true, action: env('PAYU_BASE_URL', 'https://secure.payu.in/_payment'), fields: f });
  } catch (e) {
    console.error('payu-start error', e.message);
    return res.status(500).json({ ok: false, error: 'Could not start the payment. Please try again.' });
  }
};
