// Setup check. Shows only yes/no and counts, never a key or a value. Open https://<your-site>/api/health
const { env, sb } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const names = ['PAYU_KEY', 'PAYU_SALT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'META_PIXEL_ID', 'PRICE', 'SITE_URL'];
  const out = { env: {}, optional: {}, database: {}, payuMode: env('PAYU_BASE_URL').includes('test.payu.in') ? 'TEST (test.payu.in)' : 'LIVE (secure.payu.in)' };
  names.forEach(n => { out.env[n] = !!env(n); });
  ['PAYU_BASE_URL', 'META_CAPI_TOKEN', 'META_TEST_EVENT_CODE', 'BREVO_API_KEY', 'MAIL_FROM_EMAIL'].forEach(n => { out.optional[n] = !!env(n); });
  if (env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY')) {
    const t = async (name, fn) => { try { out.database[name] = await fn(); } catch (e) { out.database[name] = 'ERROR: ' + String(e.message).slice(0, 140); } };
    await t('orders_table', async () => { await sb('orders?select=id&limit=1'); return 'ok'; });
    await t('access_codes_table', async () => { await sb('access_codes?select=id&limit=1'); return 'ok'; });
    await t('free_codes', async () => { const r = await sb('access_codes?select=id&assigned_to=is.null&limit=1000'); return r.length; });
    await t('assign_function', async () => { await sb('rpc/assign_order_code', { method: 'POST', body: JSON.stringify({ p_txnid: '', p_mihpayid: '', p_email: '', p_phone: '', p_firstname: '', p_amount: 0, p_raw: {} }) }).catch(e => { if (/does not exist|PGRST202|404/i.test(e.message)) throw e; }); return 'ok'; });
  } else out.database.note = 'Supabase variables missing';
  out.ready = Object.values(out.env).every(Boolean) && out.database.orders_table === 'ok' && out.database.access_codes_table === 'ok' && out.database.assign_function === 'ok' && out.database.free_codes > 0;
  res.status(200).json(out);
};
