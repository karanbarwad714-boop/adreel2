// Shared helpers for the Adreel Academy server functions (Vercel). Secrets come ONLY from Environment Variables.
const crypto = require('crypto');

const env = (k, d = '') => (process.env[k] || d).trim();

function needEnv(names) {
  const missing = names.filter(n => !env(n));
  if (missing.length) throw new Error('Missing environment variables: ' + missing.join(', '));
}

async function sb(path, opts = {}) {
  const url = env('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/' + path;
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(url, {
    ...opts,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (typeof data === 'string' ? data : JSON.stringify(data)));
  return data;
}

// PayU "reverse hash": sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
// If PayU sends additionalCharges, it is put in front of the string.
function payuHashOk(p, salt, key) {
  const given = String(p.hash || '').toLowerCase();
  if (!given) return false;
  const core = [salt, p.status, '', '', '', '', '', p.udf5, p.udf4, p.udf3, p.udf2, p.udf1, p.email, p.firstname, p.productinfo, p.amount, p.txnid, key]
    .map(v => (v == null ? '' : String(v))).join('|');
  const strings = [core];
  if (p.additionalCharges) strings.push(String(p.additionalCharges) + '|' + core);
  return strings.some(s => {
    const h = crypto.createHash('sha512').update(s).digest('hex');
    return h.length === given.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(given));
  });
}

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  const s = Buffer.isBuffer(b) ? b.toString('utf8') : String(b || '');
  if (!s) return {};
  try { return JSON.parse(s); } catch (e) { return Object.fromEntries(new URLSearchParams(s)); }
}

async function sendCodeEmail({ to, name, code }) {
  const apiKey = env('BREVO_API_KEY');
  const fromEmail = env('MAIL_FROM_EMAIL');
  if (!apiKey || !fromEmail) return { skipped: true };
  const site = env('SITE_URL', 'https://adreel2.vercel.app').replace(/\/$/, '');
  const link = site + '/#course';
  const hi = name ? 'Hi ' + String(name).replace(/[<>&]/g, '') + ',' : 'Hi,';
  const html = '<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;line-height:1.6">' +
    '<h2>Thank you for purchasing Adreel Academy!</h2><p>' + hi + '</p>' +
    '<p>Your payment was received. Your personal course access code is:</p>' +
    '<p style="font-size:22px;font-weight:bold;letter-spacing:1px;background:#f3f3f3;padding:14px;text-align:center">' + code + '</p>' +
    '<p><a href="' + link + '">Open the course page</a> and enter this code.<br>Keep it private - it is for you only.</p>' +
    '<p>Need help? Reply to this email.</p></div>';
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: fromEmail, name: env('MAIL_FROM_NAME', 'Adreel Academy') },
      to: [{ email: to, name: name || undefined }],
      subject: 'Your Adreel Academy access code',
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error('Brevo ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return { sent: true };
}

module.exports = { env, needEnv, sb, payuHashOk, parseBody, sendCodeEmail };
