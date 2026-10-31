require('dotenv').config();
const axios = require('axios');

/* =====================================================================
   PayX gateway adapter  (replaces the old ZapUPI integration)
   The file name + exported functions are unchanged, so bot.js / miniapp-api.js /
   features.js / staffApply.js work as before without any other edit.

   PayX server API (see server.js):
     POST /api/v1/orders       header X-PayX-Key   body { amount, reference, note?, redirectUrl? }
        -> 201 { success, order: { id, status, amount, payableAmount, checkoutUrl, ... } }
     GET  /api/v1/orders/:id   header X-PayX-Key
        -> { success, order: { id, status: created|pending|success|failed|expired, amount, payableAmount, paidAt } }

   Config (admin panel -> Payment Settings, or .env):
     apiKey  = your PayX *live* key  (px_live_...)   [.env: PAYX_API_KEY]
     baseUrl = your PayX server URL                   [.env: PAYX_BASE_URL]
   ===================================================================== */

const DEFAULT_BASE_URL = (process.env.PAYX_BASE_URL || 'https://payx-q1nn.onrender.com').replace(/\/$/, '');
const DEFAULT_API_KEY = process.env.PAYX_API_KEY || '';
const REDIRECT_URL = process.env.PAYX_REDIRECT_URL || '';   // optional: where PayX sends the customer after paying (https only)

// Old values saved by the previous ZapUPI/FamPay setup must never be used with PayX.
const OLD_HOSTS = /zapupi\.com|railway\.app/i;

function resolveBase(settings = {}) {
  const b = String(settings.baseUrl || '').trim();
  return (b && !OLD_HOSTS.test(b) ? b : DEFAULT_BASE_URL).replace(/\/$/, '');
}
function resolveKey(settings = {}) {
  const k = String(settings.apiKey || '').trim();
  return /^px_(live|test)_/.test(k) ? k : DEFAULT_API_KEY;   // ignore a leftover ZapUPI key
}
function client(settings = {}) {
  return axios.create({
    baseURL: resolveBase(settings),
    timeout: 20000,
    headers: { 'Content-Type': 'application/json', 'X-PayX-Key': resolveKey(settings) }
  });
}
const errMsg = (err) => err.response?.data?.error?.message || err.response?.data?.message || err.message;

/**
 * Creates a PayX order. The customer opens `paymentUrl` (PayX hosted checkout) and pays there.
 * Returned `orderId` is the PayX order id — callers store it as order.famOrderId and poll with it.
 * `upiId` is unused (PayX decides the UPI ID); kept for call-site compatibility.
 */
async function generateQr(upiId, amount, settings = {}) {
  try {
    if (!resolveKey(settings)) {
      return { success: false, error: 'PayX API key set nahi hai. Admin → Payment Settings me PayX key daalo.' };
    }
    const reference = settings.orderId || `ord_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const body = { amount: Number(amount), reference };
    if (settings.remark) body.note = String(settings.remark).slice(0, 200);
    const redirect = settings.redirectUrl || REDIRECT_URL;
    if (redirect) body.redirectUrl = redirect;

    const { data } = await client(settings).post('/api/v1/orders', body);
    if (!data || !data.success || !data.order) {
      return { success: false, error: data?.error?.message || 'Order creation failed' };
    }
    return {
      success: true,
      orderId: data.order.id,                 // PayX order id (PX...)
      famTxnId: data.order.id,
      paymentUrl: data.order.checkoutUrl,
      payAmount: data.order.payableAmount,    // what the customer really pays (amount + PayX service charge)
      qrImageUrl: null,
      amount
    };
  } catch (err) {
    console.error('PayX create-order failed:', err.response?.data || err.message);
    return { success: false, error: errMsg(err) };
  }
}

/**
 * Polls PayX for the live status of an order.
 * Returns { status: 'pending' | 'success' | 'failed', verified, amount, payAmount, paidAt } or null on network error.
 * PayX 'created'/'pending' -> 'pending';  'failed'/'expired' -> 'failed'.
 */
async function checkVerificationStatus(orderId, settings = {}) {
  try {
    const { data } = await client(settings).get('/api/v1/orders/' + encodeURIComponent(orderId));
    const o = data && data.order;
    if (!o) return null;
    const s = String(o.status || '').toLowerCase();
    const status = s === 'success' ? 'success' : (s === 'failed' || s === 'expired') ? 'failed' : 'pending';
    return { status, verified: status === 'success', amount: o.amount, payAmount: o.payableAmount, paidAt: o.paidAt, txnId: o.id };
  } catch (err) {
    if (err.response?.status === 404) return { status: 'pending', verified: false };   // not visible yet -> keep polling
    console.error('PayX order-status check failed:', err.response?.data || err.message);
    return null;
  }
}

/** PayX has no manual-UTR step for hosted checkout; kept as a no-op so old callers don't crash. */
async function submitUtr({ orderId }) {
  return { success: true, txnId: orderId, status: 'pending', verified: false };
}

/** Not offered by PayX's merchant API; admin-panel callers degrade gracefully. */
async function getPaymentHistory() {
  return null;
}

module.exports = { generateQr, submitUtr, checkVerificationStatus, getPaymentHistory };
