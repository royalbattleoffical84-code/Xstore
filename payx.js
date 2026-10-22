// ============================================================
// PayX PAYMENT GATEWAY ADAPTER
// ============================================================
// Connects the bot to your own PayX gateway (Render backend + px_live_ key).
// It plugs into fampay.js, so every payment in the bot (products, wallet top-up,
// VIP, staff/feature fees, mini app) works through PayX once you switch to it.
//
// Because every PayX deployment can expose slightly different paths, this adapter
// can AUTO-DETECT them: Admin Panel → Bot Settings → Payment Settings →
// "🧪 Test & Activate PayX". It tries the common endpoints / auth styles, creates a
// ₹1 test order, finds the matching status endpoint and saves what worked.
//
// Credentials (never put the key in GitHub — the repo is public):
//   Render env:  PAYX_URL, PAYX_API_KEY        (or enter them in the Admin Panel)

const axios = require('axios');

const PREFIX = 'px:';   // marks PayX order ids so polling goes to the right gateway

const CREATE_PATHS = [
  '/api/v1/orders', '/api/orders', '/api/v1/payments', '/api/payments', '/api/v1/payment',
  '/api/create-order', '/api/v1/create-order', '/api/order/create', '/api/payment/create', '/create-order', '/orders'
];
const STATUS_GET_PATHS = [
  '/api/v1/orders/:id', '/api/orders/:id', '/api/v1/payments/:id', '/api/payments/:id',
  '/api/order-status/:id', '/api/v1/order-status/:id', '/api/order/status/:id', '/api/payment/status/:id', '/orders/:id'
];
const STATUS_POST_PATHS = ['/api/order-status', '/api/v1/order-status', '/api/payment/status', '/api/check-status'];
const AUTH_MODES = ['combo', 'x-api-key', 'bearer', 'x-payx-key', 'body'];
const DEFAULT_CFG = { createPath: '/api/v1/orders', authMode: 'combo', bodyVariant: 2, statusPath: '/api/v1/orders/:id', statusMethod: 'GET', statusId: 'remote' };

// ---------- helpers ----------
const normalizeBase = (u) => String(u || '').trim().replace(/\/+$/, '');

function resolve(settings = {}) {
  return {
    url: normalizeBase(settings.payxUrl || process.env.PAYX_URL || ''),
    key: String(settings.payxKey || process.env.PAYX_API_KEY || '').trim(),
    cfg: { ...DEFAULT_CFG, ...(settings.payxCfg || {}) }
  };
}

function headersFor(mode, key) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (mode === 'combo') { h['X-API-Key'] = key; h.Authorization = `Bearer ${key}`; }
  else if (mode === 'x-api-key') h['X-API-Key'] = key;
  else if (mode === 'bearer') h.Authorization = `Bearer ${key}`;
  else if (mode === 'x-payx-key') h['X-PayX-Key'] = key;
  return h;
}

function bodyFor(variant, amount, ourId, mode, key, remark) {
  const variants = [
    { amount, order_id: ourId },
    { amount, orderId: ourId },
    { amount, currency: 'INR', order_id: ourId, orderId: ourId, remark: remark || 'Order' }
  ];
  const b = { ...(variants[variant] || variants[2]) };
  if (mode === 'body') { b.api_key = key; b.apiKey = key; }
  return b;
}

// never throws: { status, data, netError }
async function http(method, url, { headers, data, timeout = 15000 } = {}) {
  try {
    const opts = { headers, timeout, validateStatus: () => true };
    const r = method === 'GET' ? await axios.get(url, opts) : await axios.post(url, data, opts);
    return { status: r.status, data: r.data };
  } catch (e) {
    return { status: 0, data: null, netError: e.code || e.message || 'network error' };
  }
}

// breadth-first search so shallow keys win
function deepFind(obj, keys, test) {
  const want = keys.map(k => k.toLowerCase());
  const queue = [obj];
  for (let depth = 0; depth < 5 && queue.length; depth++) {
    const next = [];
    for (const o of queue) {
      if (!o || typeof o !== 'object') continue;
      for (const k of Object.keys(o)) {
        if (want.includes(k.toLowerCase()) && test(o[k])) return o[k];
      }
      for (const k of Object.keys(o)) if (o[k] && typeof o[k] === 'object') next.push(o[k]);
    }
    queue.splice(0, queue.length, ...next);
  }
  return null;
}
const URL_KEYS = ['payment_url', 'paymentUrl', 'checkout_url', 'checkoutUrl', 'pay_url', 'payUrl', 'payment_link', 'paymentLink', 'hosted_url', 'hostedUrl', 'checkout', 'link', 'url'];
const ID_KEYS = ['order_id', 'orderId', 'payment_id', 'paymentId', 'transaction_id', 'transactionId', 'txn_id', 'txnId', 'id'];
const pickUrl = (o) => deepFind(o, URL_KEYS, v => typeof v === 'string' && /^https?:\/\//i.test(v));
const pickId = (o) => { const v = deepFind(o, ID_KEYS, v => (typeof v === 'string' || typeof v === 'number') && String(v).length > 0); return v === null ? null : String(v); };

const PAID = ['paid', 'success', 'successful', 'completed', 'complete', 'captured', 'verified', 'settled', 'done', 'credited'];
const FAILED = ['failed', 'failure', 'expired', 'cancelled', 'canceled', 'declined', 'rejected', 'error', 'timeout', 'timed_out'];
const normStatus = (v) => { const s = String(v || '').toLowerCase(); return PAID.includes(s) ? 'success' : FAILED.includes(s) ? 'failed' : 'pending'; };

// Many APIs wrap the real status as { status:"success", data:{ status:"pending" } } — prefer the inner one.
function pickStatus(o) {
  if (!o || typeof o !== 'object') return null;
  const inner = [o.data, o.order, o.payment, o.result, o.transaction].find(x => x && typeof x === 'object');
  const keys = ['status', 'payment_status', 'paymentStatus', 'order_status', 'orderStatus', 'state'];
  if (inner) { const v = deepFind(inner, keys, x => typeof x === 'string'); if (v) return v; }
  for (const k of ['payment_status', 'paymentStatus', 'order_status', 'orderStatus', 'state']) if (typeof o[k] === 'string') return o[k];
  if (typeof o.status === 'string') {
    const s = o.status.toLowerCase();
    if (inner && ['success', 'ok'].includes(s)) return null;      // just an envelope
    return o.status;
  }
  return null;
}
const pickAmount = (o) => deepFind(o, ['amount', 'pay_amount', 'payAmount', 'total'], v => typeof v === 'number' || (typeof v === 'string' && v !== '' && !isNaN(v)));
const apiError = (r) => {
  const d = r && r.data;
  if (!d || typeof d !== 'object') return typeof d === 'string' ? d.slice(0, 120) : '';
  return String(d.message || d.error || d.msg || (d.success === false ? 'success=false' : '')).slice(0, 160);
};
const looksLikeSuccess = (r) => r.status >= 200 && r.status < 300 && r.data && typeof r.data === 'object'
  && r.data.success !== false && !['error', 'failed'].includes(String(r.data.status || '').toLowerCase()) && !r.data.error;

// ---------- create order ----------
async function createWith(url, key, cfg, amount, ourId, remark, timeout) {
  const headers = headersFor(cfg.authMode, key);
  const body = bodyFor(cfg.bodyVariant, amount, ourId, cfg.authMode, key, remark);
  return http('POST', url + cfg.createPath, { headers, data: body, timeout });
}

async function generateQr(amount, settings = {}) {
  const { url, key, cfg } = resolve(settings);
  if (!url || !key) return { success: false, error: 'PayX URL / API key set nahi hai' };
  const ourId = settings.orderId || `ord_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const r = await createWith(url, key, cfg, amount, ourId, settings.remark, 30000);
  if (r.netError) { console.error('PayX create failed:', r.netError); return { success: false, error: 'PayX server se connect nahi ho paya' }; }
  if (!looksLikeSuccess(r)) { console.error('PayX create rejected:', r.status, apiError(r)); return { success: false, error: apiError(r) || `PayX error ${r.status}` }; }

  const remoteId = pickId(r.data);
  const pollId = cfg.statusId === 'ours' ? ourId : (remoteId || ourId);
  const paymentUrl = pickUrl(r.data) || `${url}/#/pay/${remoteId || ourId}`;   // hosted checkout fallback
  return { success: true, orderId: PREFIX + pollId, famTxnId: remoteId || null, paymentUrl, qrImageUrl: null, amount };
}

// ---------- status ----------
async function checkVerificationStatus(prefixedId, settings = {}) {
  const { url, key, cfg } = resolve(settings);
  if (!url || !key) return null;
  const id = String(prefixedId).startsWith(PREFIX) ? String(prefixedId).slice(PREFIX.length) : String(prefixedId);
  const headers = headersFor(cfg.authMode, key);
  const r = cfg.statusMethod === 'POST'
    ? await http('POST', url + cfg.statusPath, { headers, data: { order_id: id, orderId: id, ...(cfg.authMode === 'body' ? { api_key: key, apiKey: key } : {}) }, timeout: 15000 })
    : await http('GET', url + cfg.statusPath.replace(':id', encodeURIComponent(id)), { headers, timeout: 15000 });
  if (r.netError) return null;                       // keep polling
  if (r.status === 404) return { status: 'pending', verified: false };
  if (r.status < 200 || r.status >= 300) { console.error('PayX status error:', r.status, apiError(r)); return null; }
  const raw = pickStatus(r.data);
  if (raw === null) return { status: 'pending', verified: false };
  const status = normStatus(raw);
  const utr = deepFind(r.data, ['utr', 'rrn', 'reference', 'upi_ref'], v => typeof v === 'string' || typeof v === 'number');
  return { status, verified: status === 'success', amount: pickAmount(r.data), utr: utr ? String(utr) : undefined, txnId: pickId(r.data) || id };
}

// ---------- auto-detect (used by the admin "Test & Activate" button) ----------
async function discover(settings = {}) {
  const { url, key } = resolve(settings);
  const notes = [];
  if (!url) return { ok: false, notes: ['PayX URL set nahi hai'] };
  if (!key) return { ok: false, notes: ['PayX API key set nahi hai'] };
  const ourId = `test_${Date.now()}`;
  const known = settings.payxCfg && settings.payxCfg.createPath ? [settings.payxCfg.createPath] : [];
  const paths = [...known, ...CREATE_PATHS.filter(p => !known.includes(p))];

  let found = null, first = true;
  for (const path of paths) {
    const tryOnce = async (mode, variant, timeout) => {
      const cfg = { createPath: path, authMode: mode, bodyVariant: variant };
      const r = await createWith(url, key, cfg, 1, ourId + Math.floor(Math.random() * 1000), 'PayX connection test', timeout);
      return { cfg, r };
    };
    let t = await tryOnce('combo', 2, first ? 45000 : 12000);   // first call may wake a sleeping Render server
    if (first && t.r.netError) t = await tryOnce('combo', 2, 45000);
    first = false;
    if (t.r.netError) return { ok: false, notes: [`Server se connect nahi ho paya (${t.r.netError}). URL check karo / server chal raha hai?`] };

    if (looksLikeSuccess(t.r)) { found = t; break; }
    const st = t.r.status;
    if (st === 401 || st === 403) {
      for (const mode of AUTH_MODES.filter(m => m !== 'combo')) {
        const t2 = await tryOnce(mode, 2, 12000);
        if (looksLikeSuccess(t2.r)) { found = t2; break; }
      }
      if (found) break;
      notes.push(`${path} → ${st} (API key reject hui${apiError(t.r) ? ': ' + apiError(t.r) : ''})`);
    } else if (st === 400 || st === 422) {
      for (const v of [0, 1]) {
        const t2 = await tryOnce('combo', v, 12000);
        if (looksLikeSuccess(t2.r)) { found = t2; break; }
      }
      if (found) break;
      notes.push(`${path} → ${st} (body reject: ${apiError(t.r) || 'unknown'})`);
    } else if (st !== 404 && st !== 405) {
      notes.push(`${path} → ${st}${apiError(t.r) ? ' ' + apiError(t.r) : ''}`);
    }
  }
  if (!found) {
    if (!notes.length) notes.push('Koi bhi common endpoint nahi mila (sab 404). PayX ka asli create-order path batao.');
    return { ok: false, notes };
  }

  const cfg = { ...found.cfg };
  const resp = found.r.data;
  const remoteId = pickId(resp);
  const sample = { path: cfg.createPath, auth: cfg.authMode, id: remoteId, url: pickUrl(resp), amount: pickAmount(resp) };

  // find the matching status endpoint
  const ids = [['remote', remoteId], ['ours', null]];
  let statusFound = null;
  const probeIds = [];
  if (remoteId) probeIds.push(['remote', remoteId]);
  const headers = headersFor(cfg.authMode, key);
  for (const [which, id] of probeIds) {
    for (const p of STATUS_GET_PATHS) {
      const r = await http('GET', url + p.replace(':id', encodeURIComponent(id)), { headers, timeout: 12000 });
      if (r.status >= 200 && r.status < 300 && pickStatus(r.data) !== null) { statusFound = { statusPath: p, statusMethod: 'GET', statusId: which }; break; }
    }
    if (statusFound) break;
    for (const p of STATUS_POST_PATHS) {
      const r = await http('POST', url + p, { headers, data: { order_id: id, orderId: id, ...(cfg.authMode === 'body' ? { api_key: key, apiKey: key } : {}) }, timeout: 12000 });
      if (r.status >= 200 && r.status < 300 && pickStatus(r.data) !== null) { statusFound = { statusPath: p, statusMethod: 'POST', statusId: which }; break; }
    }
    if (statusFound) break;
  }
  if (!statusFound) {
    notes.push('Order ban gaya lekin status endpoint nahi mila — bina status check ke payment verify nahi ho sakti.');
    return { ok: false, notes, sample };
  }
  return { ok: true, cfg: { ...cfg, ...statusFound }, sample, notes };
}

module.exports = { generateQr, checkVerificationStatus, discover, PREFIX, normalizeBase, _internal: { pickUrl, pickId, pickStatus, normStatus } };
