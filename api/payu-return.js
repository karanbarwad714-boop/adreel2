// PayU sends the customer's browser back here (surl / furl). Nothing is trusted until the hash is verified on the server.
const { env, needEnv, payuHashOk, parseBody, fulfil, orderToken, logPayment } = require('./_lib');

module.exports = async (req, res) => {
  const site = env('SITE_URL', 'https://adreel2.vercel.app').replace(/\/$/, '');
  const go = url => { res.statusCode = 303; res.setHeader('Location', url); res.setHeader('Cache-Control', 'no-store'); res.end(); };
  if (req.method !== 'POST') return go(site + '/');
  try {
    needEnv(['PAYU_KEY', 'PAYU_SALT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    const p = parseBody(req);
    const verified = payuHashOk(p, env('PAYU_SALT'), env('PAYU_KEY')) && (!p.key || String(p.key) === env('PAYU_KEY'));
    if (!verified) { console.warn('PayU return hash mismatch', p.txnid); await logPayment('hash_mismatch', p, 'Return hash did not verify'); return go(site + '/#payment-failed'); }
    if (String(p.status || '').toLowerCase() !== 'success') { await logPayment('not_success', p, p.error_Message || p.field9 || 'Payment not successful'); return go(site + '/#payment-failed'); }
    if (!(Number(p.amount) >= Number(env('PRICE_MIN', '499'))) || !p.txnid) { await logPayment('amount_too_low', p, 'Amount below PRICE_MIN'); return go(site + '/#payment-failed'); }
    await fulfil(p);
    return go(site + '/?o=' + encodeURIComponent(p.txnid) + '&k=' + orderToken(p.txnid) + '#thank-you');
  } catch (e) {
    console.error('payu-return error', e.message);
    try { await logPayment('server_error', {}, 'return: ' + e.message); } catch (x) {}
    return go(site + '/#payment-failed');
  }
};
