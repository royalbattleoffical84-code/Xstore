require('dotenv').config();
const axios = require('axios');

/**
 * ORVIX PAY adapter.
 *
 * API documented by the merchant dashboard:
 *   POST https://codertufan.bond/api/create-order
 *   POST https://codertufan.bond/api/order-status
 *
 * ORVIX_PAY_TOKEN must be set in the Node server environment.
 * Never put the token in miniapp/browser code or in the bot's editable settings.
 *
 * Existing callers still import this module as `fampay.js`; the exported
 * function names are retained to avoid breaking the store's payment flows.
 */

const BASE_URL = (process.env.ORVIX_PAY_BASE_URL || 'https://codertufan.bond/api').replace(/\/+$/, '');
const TOKEN = String(process.env.ORVIX_PAY_TOKEN || '').trim();
const REDIRECT_URL = String(process.env.ORVIX_PAY_REDIRECT_URL || '').trim();

const http = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
  maxRedirects: 0
});

function form(data) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null && String(v) !== '') p.append(k, String(v));
  }
  return p;
}

function apiError(data, fallback) {
  return data?.error?.message || data?.error?.code || data?.message || fallback;
}

/**
 * Create exactly once. We deliberately do not auto-retry an ambiguous create
 * timeout: the gateway may have created the order even if the response was
 * lost. order_id is the store's stable reference to help reconcile duplicates.
 */
async function generateQr(_upiId, amount, settings = {}) {
  if (!TOKEN) {
    return { success: false, error: 'ORVIX_PAY_TOKEN missing. Add it to the Node host environment and restart the app.' };
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { success: false, error: 'Invalid payment amount.' };
  }

  const localOrderId = String(settings.orderId || `ORVIX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const payload = {
    api_token: TOKEN,
    amount: numericAmount.toFixed(2),
    order_id: localOrderId
  };
  const redirectUrl = settings.redirectUrl || REDIRECT_URL;
  if (redirectUrl) payload.redirect_url = redirectUrl;

  try {
    const response = await http.post(`${BASE_URL}/create-order`, form(payload));
    const data = response.data || {};
    const order = data.order || {};
    const gatewayOrderId = order.order_id || data.order_id;
    const paymentUrl = order.payment_url || data.payment_url;

    if (response.status < 200 || response.status >= 300 || data.success !== true || !gatewayOrderId || !paymentUrl) {
      return { success: false, error: apiError(data, 'ORVIX PAY order creation failed.') };
    }

    return {
      success: true,
      orderId: String(gatewayOrderId),
      famTxnId: String(gatewayOrderId),
      paymentUrl: String(paymentUrl),
      payAmount: Number(order.amount ?? numericAmount),
      amount: numericAmount,
      merchantOrderId: localOrderId,
      environment: order.environment || data.environment || null
    };
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error('ORVIX PAY create-order error:', status || '', data || err.message);
    // A timeout/network failure can be ambiguous. Do not issue another create
    // request automatically; avoid accidental duplicate payment orders.
    return {
      success: false,
      error: status ? apiError(data, `ORVIX PAY returned HTTP ${status}.`) :
        'ORVIX PAY network/timeout error. Check the gateway dashboard before retrying to avoid duplicate orders.'
    };
  }
}

/**
 * Status lookup is read-only and safe to retry. Only the gateway's verified
 * "success" status is returned as success. Pending/failed/expired/refunded
 * remain non-fulfillable.
 */
async function checkVerificationStatus(gatewayOrderId) {
  if (!TOKEN || !gatewayOrderId) return null;
  const payload = form({ api_token: TOKEN, order_id: String(gatewayOrderId) });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await http.post(`${BASE_URL}/order-status`, payload);
      const data = response.data || {};
      const order = data.order || {};
      if (data.success !== true || !order.status) {
        console.error('ORVIX PAY order-status response:', data);
        return null;
      }

      const raw = String(order.status).toLowerCase();
      const status = raw === 'success' ? 'success'
        : ['failed', 'expired', 'refunded', 'cancelled'].includes(raw) ? 'failed'
        : 'pending';

      return {
        status,
        verified: status === 'success',
        amount: order.amount == null ? null : Number(order.amount),
        payAmount: order.payable_amount == null ? null : Number(order.payable_amount),
        paidAt: order.paid_at || order.paidAt || null,
        txnId: order.transaction_id || order.txn_id || order.order_id || String(gatewayOrderId),
        environment: order.environment || null,
        rawStatus: raw
      };
    } catch (err) {
      console.error('ORVIX PAY order-status attempt failed:', err.response?.data || err.message);
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  return null; // caller keeps order pending; never fulfill on a status API error
}

async function submitUtr({ orderId }) {
  return { success: true, txnId: orderId, status: 'pending', verified: false };
}

async function getPaymentHistory() {
  return null;
}

module.exports = { generateQr, submitUtr, checkVerificationStatus, getPaymentHistory };
