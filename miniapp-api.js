// ============================================================
// TELEGRAM MINI APP API  (plugs into the existing bot.js server)
// ============================================================
// Adds:
//   GET  /app                 -> serves miniapp.html (the Mini App itself)
//   *    /api/mini/...        -> JSON API used by the Mini App
//
// Security: every /api/mini call (except product images) must carry the
// Telegram `initData` string in the `X-Init-Data` header. It is verified with
// an HMAC using BOT_TOKEN, so nobody can fake another user's id.
// Prices/stock/ownership are ALWAYS decided here on the server.
// ============================================================

const crypto = require('crypto');
const path = require('path');
const axios = require('axios');

function setupMiniApp(app, bot, fb, fampay, hooks = {}) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const MINIAPP_URL =
    process.env.MINIAPP_URL ||
    (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/app` : 'https://xstore-za0x.onrender.com/app');

  // ---------- helpers ----------
  const adminIds = () => (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const strip = (t) => String(t || '').replace(/[*_`]/g, '');

  let cachedBotUsername = process.env.BOT_USERNAME || '';
  async function getBotUsername() {
    if (cachedBotUsername) return cachedBotUsername;
    try {
      const me = await bot.telegram.getMe();
      cachedBotUsername = me.username || '';
    } catch (e) { /* ignore */ }
    return cachedBotUsername;
  }

  function verifyInitData(initData) {
    if (!initData || !BOT_TOKEN) return null;
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');
    const dcs = [...params.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calc = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
    try {
      const a = Buffer.from(calc, 'hex');
      const b = Buffer.from(hash, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    } catch (e) { return null; }

    const authDate = parseInt(params.get('auth_date') || '0', 10);
    if (!authDate || Date.now() / 1000 - authDate > 7 * 24 * 3600) return null; // 7 days max

    let user;
    try { user = JSON.parse(params.get('user') || 'null'); } catch (e) { return null; }
    if (!user || !user.id) return null;
    return { user, startParam: params.get('start_param') || '' };
  }

  const wrap = (fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (err) {
      console.error('MiniApp API error:', req.method, req.path, err);
      if (!res.headersSent) res.status(500).json({ ok: false, code: 'SERVER', error: 'Server error' });
    }
  };

  // channel membership cache (60s) so we don't hammer Telegram
  const memberCache = new Map();
  async function isMember(userId, username) {
    const key = `${userId}:${username}`;
    const hit = memberCache.get(key);
    if (hit && Date.now() - hit.t < 60000) return hit.v;
    let v = true;
    try {
      const handle = username.startsWith('@') ? username : `@${username}`;
      const m = await bot.telegram.getChatMember(handle, userId);
      v = ['member', 'administrator', 'creator'].includes(m.status);
    } catch (e) { v = true; } // misconfigured channel -> fail open (same as bot)
    memberCache.set(key, { v, t: Date.now() });
    return v;
  }

  // ---------- CORS (auth is header-based, no cookies) ----------
  app.use('/api/mini', (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Init-Data, X-Lang');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // ---------- serve the Mini App ----------
  app.get('/app', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(__dirname, 'miniapp.html'));
  });

  // ---------- product images (public, proxied so file_ids work) ----------
  function productImages(p) {
    if (Array.isArray(p.imageFileIds) && p.imageFileIds.length) return p.imageFileIds;
    if (Array.isArray(p.imageUrls) && p.imageUrls.length) return p.imageUrls;
    if (p.imageFileId) return [p.imageFileId];
    if (p.imageUrl) return [p.imageUrl];
    return [];
  }

  app.get('/api/mini/img/:id/:i', wrap(async (req, res) => {
    const p = await fb.getProduct(req.params.id);
    if (!p || !p.active) return res.sendStatus(404);
    const src = productImages(p)[parseInt(req.params.i, 10) || 0];
    if (!src) return res.sendStatus(404);
    if (/^https?:\/\//i.test(src)) return res.redirect(src);
    const link = await bot.telegram.getFileLink(src);
    const r = await axios.get(link.href, { responseType: 'stream', timeout: 15000 });
    const ct = r.headers['content-type'];
    res.set('Content-Type', ct && ct.startsWith('image/') ? ct : 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    r.data.pipe(res);
  }));

  // ---------- auth middleware for everything else ----------
  async function auth(req, res, next) {
    try {
      const v = verifyInitData(req.get('X-Init-Data'));
      if (!v) return res.status(401).json({ ok: false, code: 'AUTH', error: 'Open inside Telegram' });

      const uid = String(v.user.id);
      req.tg = { id: uid, user: v.user, startParam: v.startParam };
      const lh = String(req.get('X-Lang') || 'en');
      req.lang = ['en', 'hi', 'hg'].includes(lh) ? lh : 'en';

      const sp = v.startParam || '';
      const refCode = sp.startsWith('REF') ? sp : null;
      await fb.createUserIfNotExists(uid, v.user, refCode);

      if (await fb.isUserBanned(uid)) {
        return res.status(403).json({ ok: false, code: 'BANNED', error: 'Blocked' });
      }

      const settings = await fb.getBotSettings();
      const isAdmin = fb.isAdmin(uid);
      req.isAdmin = isAdmin;
      if (settings.maintenanceMode && !isAdmin) {
        return res.status(503).json({ ok: false, code: 'MAINTENANCE', error: 'Maintenance', message: settings.maintenanceMessage || '' });
      }

      const required = (settings.channels || []).filter(c => c.required && c.username);
      if (required.length && !isAdmin) {
        const missing = [];
        for (const ch of required) if (!(await isMember(uid, ch.username))) missing.push({ username: ch.username, label: ch.label || ch.username });
        if (missing.length) {
          return res.status(403).json({ ok: false, code: 'JOIN_REQUIRED', error: 'Join required channels', channels: missing });
        }
      }
      next();
    } catch (err) {
      console.error('MiniApp auth error:', err);
      res.status(500).json({ ok: false, code: 'SERVER', error: 'Server error' });
    }
  }
  app.use('/api/mini', (req, res, next) => (req.path.startsWith('/img/') ? next() : auth(req, res, next)));

  // ---------- shaping ----------
  async function publicProduct(id, p) {
    const { avg, count } = await fb.getProductAvgRating(id);
    const stock = p.stock === undefined ? -1 : p.stock;
    return {
      id,
      name: p.name,
      description: p.description || '',
      price: p.price || 0,
      category: p.category || 'Other',
      stock,
      soldOut: stock !== -1 && stock <= 0,
      views: p.views || 0,
      createdAt: p.createdAt || 0,
      images: productImages(p).map((_, i) => `/api/mini/img/${id}/${i}`),
      rating: Number(avg) || 0,
      reviewCount: count,
      customButtonText: p.customButtonText || '',
      customButtonUrl: p.customButtonUrl || '',
      deliveryType: p.deliveryType || ''
    };
  }

  async function userSnapshot(uid) {
    const analytics = (await fb.getUserAnalytics(uid)) || {};
    const isVip = await fb.isUserVip(uid);
    const botUsername = await getBotUsername();
    return {
      id: uid,
      name: analytics.name || '',
      username: analytics.username || '',
      balance: analytics.walletBalance || 0,
      isVip,
      vipDaysLeft: isVip ? await fb.getVipDaysLeft(uid) : 0,
      referralCode: analytics.referralCode || '',
      referralLink: botUsername && analytics.referralCode ? `https://t.me/${botUsername}?start=${analytics.referralCode}` : '',
      referredCount: analytics.referredCount || 0,
      totalOrders: analytics.completedOrders || 0,
      totalSpent: analytics.totalSpent || 0,
      checkedInToday: analytics.lastCheckInDate === new Date().toDateString(),
      streak: analytics.checkInStreak || 0,
      joinedAt: analytics.joinedAt || 0
    };
  }

  // ---------- delivery (via the bot chat) ----------
  const ui = require('./ui');
  const DM = {
    none: {
      en: "⚠️ Delivery content isn't set. Please contact support, it will be fixed soon.",
      hi: '⚠️ डिलीवरी कंटेंट सेट नहीं है। सपोर्ट से संपर्क करें, जल्द ठीक कर दिया जाएगा।',
      hg: '⚠️ Delivery content set nahi hai. Support se contact karo, jald hi resolve hoga.'
    }
  };

  async function deliver(userId, product, orderId, lang) {
    const L = ['en', 'hi', 'hg'].includes(lang) ? lang : 'en';
    try {
      if (product.deliveryType === 'file' && product.fileId) {
        await bot.telegram.sendDocument(userId, product.fileId, { caption: ui.deliveredPlain(product.name, null, L) });
      } else if (product.deliveryType === 'link' && product.deliveryLink) {
        await bot.telegram.sendMessage(userId, ui.deliveredPlain(product.name, product.deliveryLink, L));
      } else {
        await bot.telegram.sendMessage(userId, DM.none[L]);
        return { delivered: false, reason: 'no_content' };
      }
      if (orderId) await fb.updateOrderStatus(orderId, 'delivered', { deliveredAt: Date.now() });
      return { delivered: true };
    } catch (err) {
      console.error('MiniApp delivery error:', err.message);
      for (const a of adminIds()) {
        try { await bot.telegram.sendMessage(a, `🚨 Delivery Failed (Mini App)\n\nOrder: ${orderId || 'N/A'}\nProduct: ${product.name}\nUser: ${userId}\nError: ${err.message}`); } catch (e) {}
      }
      return { delivered: false, reason: 'send_failed' };
    }
  }

  const snapshotOf = (p) => ({
    deliveryType: p.deliveryType,
    fileId: p.fileId || null,
    deliveryLink: p.deliveryLink || null
  });

  async function priceWithCoupon(product, code) {
    let final = product.price;
    let couponUsed = null;
    let discount = 0;
    if (code) {
      const c = await fb.validateCoupon(String(code).trim(), product.price);
      if (c.valid) { discount = c.discount; final = Math.max(0, product.price - c.discount); couponUsed = String(code).trim().toUpperCase(); }
    }
    return { final, couponUsed, discount };
  }

  // ============================================================
  // ROUTES
  // ============================================================

  app.get('/api/mini/bootstrap', wrap(async (req, res) => {
    const uid = req.tg.id;
    const [user, allProducts, bs, pro, ci, ref, pay] = await Promise.all([
      userSnapshot(uid),
      fb.getAllProducts(true),
      fb.getBotSettings(),
      fb.getProPlanSettings(),
      fb.getCheckInSettings(),
      fb.getReferralSettings(),
      fb.getPaymentSettings()
    ]);

    const products = await Promise.all(Object.entries(allProducts).map(([id, p]) => publicProduct(id, p)));
    products.sort((a, b) => b.createdAt - a.createdAt);
    const categories = [...new Set(products.map(p => p.category))];

    res.json({
      ok: true,
      user,
      isAdmin: !!req.isAdmin,
      startParam: req.tg.startParam,
      botUsername: await getBotUsername(),
      products,
      categories,
      settings: {
        supportTelegram: bs.supportTelegram || '',
        supportWhatsapp: bs.supportWhatsapp || '',
        customButtons: (bs.menuCustomButtons || []).filter(b => b.text && b.url),
        referral: { bonusAmount: ref.bonusAmount, bonusType: ref.bonusType },
        checkIn: { active: ci.active !== false, rewardAmount: ci.rewardAmount },
        pro: { price: pro.price, durationDays: pro.durationDays, description: pro.description || '', active: pro.active !== false },
        terms: strip(pay.termsAndConditions || '')
      }
    });
  }));

  app.get('/api/mini/product/:id', wrap(async (req, res) => {
    const uid = req.tg.id;
    const p = await fb.getProduct(req.params.id);
    if (!p || !p.active) return res.status(404).json({ ok: false, code: 'NOT_AVAILABLE', error: 'Product not available' });
    fb.incrementProductViews(req.params.id).catch(() => {});

    const reviewsObj = await fb.getProductReviews(req.params.id);
    const reviews = Object.values(reviewsObj)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map(r => ({ name: r.userName || 'User', rating: r.rating, comment: r.comment, createdAt: r.createdAt, mine: String(r.userId) === uid }));
    const owned = await fb.hasUserBoughtProduct(uid, req.params.id);
    const bought = owned ? await fb.getBoughtOrder(uid, req.params.id) : null;
    const base = await publicProduct(req.params.id, p);

    res.json({
      ok: true,
      product: base,
      reviews,
      owned,
      orderId: bought ? bought.id : null,
      canReview: owned && !reviews.some(r => r.mine)
    });
  }));

  app.post('/api/mini/coupon', wrap(async (req, res) => {
    const { code, productId } = req.body || {};
    const p = await fb.getProduct(productId);
    if (!p || !p.active) return res.json({ ok: false, code: 'NOT_AVAILABLE', error: 'Product not available' });
    if (!code) return res.json({ ok: false, code: 'NO_CODE', error: 'Enter a coupon code' });
    const c = await fb.validateCoupon(String(code).trim(), p.price);
    if (!c.valid) {
      const r = String(c.reason || '');
      const ccode = r.startsWith('Coupon expired') ? 'COUPON_EXPIRED' : r.includes('usage limit') ? 'COUPON_LIMIT' : r.startsWith('Minimum order') ? 'COUPON_MIN' : 'COUPON_INVALID';
      const m = r.match(/(\d+)/);
      return res.json({ ok: false, code: ccode, min: m ? parseInt(m[1], 10) : undefined, error: r || 'Invalid coupon' });
    }
    res.json({ ok: true, code: String(code).trim().toUpperCase(), discount: c.discount, final: Math.max(0, p.price - c.discount) });
  }));

  // ---- buy a product ----
  const inflight = new Set();
  app.post('/api/mini/buy', wrap(async (req, res) => {
    const uid = req.tg.id;
    const { productId, method, coupon } = req.body || {};
    const lockKey = `${uid}:${productId}`;
    if (inflight.has(lockKey)) return res.json({ ok: false, code: 'IN_PROGRESS', error: 'Request in progress' });
    inflight.add(lockKey);

    try {
      const product = await fb.getProduct(productId);
      if (!product || !product.active) return res.json({ ok: false, code: 'NOT_AVAILABLE', error: 'Product not available' });

      if (await fb.hasUserBoughtProduct(uid, productId)) {
        return res.json({ ok: true, status: 'owned' });
      }
      if (product.stock !== undefined && product.stock !== -1 && product.stock <= 0) {
        return res.json({ ok: false, code: 'OUT_OF_STOCK', error: 'Out of stock' });
      }

      const isFree = product.price === 0;
      const isVip = !isFree && await fb.isUserVip(uid);
      const { final, couponUsed } = (isFree || isVip) ? { final: 0, couponUsed: null } : await priceWithCoupon(product, coupon);

      // ---- instant paths: free / VIP / 100% coupon / wallet ----
      const instant = isFree || isVip || final === 0 || method === 'wallet';
      if (instant) {
        let paymentMethod = isFree ? 'free' : isVip ? 'vip_free' : final === 0 ? 'coupon_free' : 'wallet';

        if (paymentMethod === 'wallet') {
          const bal = await fb.getWalletBalance(uid);
          if (bal < final) return res.json({ ok: false, code: 'LOW_BALANCE', error: 'Low wallet balance', balance: bal, need: final });
          try { await fb.debitWallet(uid, final, 'purchase'); }
          catch (e) { return res.json({ ok: false, code: 'LOW_BALANCE', error: 'Low wallet balance', balance: await fb.getWalletBalance(uid), need: final }); }
        }

        const order = await fb.createOrder({
          userId: uid,
          productId,
          productName: product.name,
          amount: final,
          originalAmount: product.price,
          couponUsed,
          paymentMethod,
          source: 'miniapp',
          productSnapshot: snapshotOf(product)
        });
        await fb.updateOrderStatus(order.id, 'paid');
        if (couponUsed) await fb.incrementCouponUsage(couponUsed);
        if (paymentMethod === 'wallet' || paymentMethod === 'coupon_free') await fb.processReferralBonus(uid, final);
        await fb.decrementStock(productId);
        if (hooks.checkAndAlertLowStock) hooks.checkAndAlertLowStock(productId).catch(() => {});

        const d = await deliver(uid, product, order.id, req.lang);
        return res.json({
          ok: true,
          status: 'done',
          orderId: order.id,
          delivered: d.delivered,
          deliveryType: product.deliveryType,
          link: product.deliveryType === 'link' ? product.deliveryLink : null,
          balance: await fb.getWalletBalance(uid)
        });
      }

      // ---- UPI via ZapUPI ----
      const paymentSettings = await fb.getPaymentSettings();
      const order = await fb.createOrder({
        userId: uid,
        productId,
        productName: product.name,
        amount: final,
        originalAmount: product.price,
        couponUsed,
        paymentMethod: 'fampay',
        source: 'miniapp',
        productSnapshot: snapshotOf(product)
      });
      const qr = await fampay.generateQr(paymentSettings.upiId, final, paymentSettings);
      if (!qr.success) {
        await fb.updateOrderStatus(order.id, 'failed');
        console.error('MiniApp ZapUPI order failed:', qr.error);
        return res.json({ ok: false, code: 'PAY_LINK', error: 'Payment link failed' });
      }
      await fb.updateOrderStatus(order.id, 'pending', { famOrderId: qr.orderId });
      return res.json({ ok: true, status: 'pending', orderId: order.id, paymentUrl: qr.paymentUrl, amount: final });
    } finally {
      inflight.delete(lockKey);
    }
  }));

  // ---- wallet top-up ----
  app.post('/api/mini/topup', wrap(async (req, res) => {
    const uid = req.tg.id;
    const amount = parseInt(req.body && req.body.amount, 10);
    if (isNaN(amount) || amount < 10 || amount > 50000) return res.json({ ok: false, code: 'TOPUP_RANGE', error: 'Amount out of range' });

    const paymentSettings = await fb.getPaymentSettings();
    const order = await fb.createOrder({
      userId: uid, productId: 'WALLET_TOPUP', productName: 'Wallet Top-up',
      amount, paymentMethod: 'fampay', isWalletTopup: true, source: 'miniapp'
    });
    const qr = await fampay.generateQr(paymentSettings.upiId, amount, paymentSettings);
    if (!qr.success) {
      await fb.updateOrderStatus(order.id, 'failed');
      return res.json({ ok: false, code: 'PAY_LINK', error: 'Payment link failed' });
    }
    await fb.updateOrderStatus(order.id, 'pending', { famOrderId: qr.orderId });
    res.json({ ok: true, orderId: order.id, paymentUrl: qr.paymentUrl, amount });
  }));

  // ---- Pro plan ----
  app.post('/api/mini/pro', wrap(async (req, res) => {
    const uid = req.tg.id;
    const settings = await fb.getProPlanSettings();
    if (settings.active === false) return res.json({ ok: false, code: 'PRO_OFF', error: 'Pro plan off' });

    const paymentSettings = await fb.getPaymentSettings();
    const order = await fb.createOrder({
      userId: uid, productId: 'PRO_PLAN', productName: `Pro Plan (${settings.durationDays} days)`,
      amount: settings.price, paymentMethod: 'fampay', isProPlan: true, proPlanDuration: settings.durationDays, source: 'miniapp'
    });
    const qr = await fampay.generateQr(paymentSettings.upiId, settings.price, paymentSettings);
    if (!qr.success) {
      await fb.updateOrderStatus(order.id, 'failed');
      return res.json({ ok: false, code: 'PAY_LINK', error: 'Payment link failed' });
    }
    await fb.updateOrderStatus(order.id, 'pending', { famOrderId: qr.orderId });
    res.json({ ok: true, orderId: order.id, paymentUrl: qr.paymentUrl, amount: settings.price });
  }));

  // ---- order status (the app polls this after the user pays) ----
  app.get('/api/mini/order/:id', wrap(async (req, res) => {
    let order = await fb.getOrder(req.params.id);
    if (!order || String(order.userId) !== req.tg.id) return res.status(404).json({ ok: false, code: 'ORDER_NOT_FOUND', error: 'Order not found' });

    if (order.status === 'pending' && hooks.checkAndProcessOrder) {
      try { await hooks.checkAndProcessOrder(order.id); } catch (e) { console.error('MiniApp status check error:', e.message); }
      order = await fb.getOrder(req.params.id);
    }

    const kind = order.isWalletTopup ? 'topup' : order.isProPlan ? 'pro' : 'product';
    let link = null;
    if (kind === 'product' && (order.status === 'paid' || order.status === 'delivered')) {
      const p = await fb.getProduct(order.productId);
      if (p && p.deliveryType === 'link') link = p.deliveryLink || null;
    }
    res.json({ ok: true, status: order.status, kind, amount: order.amount, name: order.productName, link, user: await userSnapshot(req.tg.id) });
  }));

  app.post('/api/mini/order/:id/cancel', wrap(async (req, res) => {
    const order = await fb.getOrder(req.params.id);
    if (!order || String(order.userId) !== req.tg.id) return res.status(404).json({ ok: false, code: 'ORDER_NOT_FOUND', error: 'Order not found' });
    if (order.status === 'pending') await fb.updateOrderStatus(order.id, 'failed', { cancelledByUser: true });
    res.json({ ok: true });
  }));

  // ---- my orders / purchases ----
  app.get('/api/mini/orders', wrap(async (req, res) => {
    const uid = req.tg.id;
    const orders = Object.values(await fb.getUserOrders(uid)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 60);
    const out = [];
    for (const o of orders) {
      const kind = o.isWalletTopup ? 'topup' : o.isProPlan ? 'pro' : 'product';
      const owned = o.status === 'paid' || o.status === 'delivered';
      let link = null, productExists = false, deliveryType = '';
      if (kind === 'product') {
        const p = await fb.getProduct(o.productId);
        productExists = !!p;
        deliveryType = (p && p.deliveryType) || (o.productSnapshot && o.productSnapshot.deliveryType) || '';
        if (owned) link = (p && p.deliveryType === 'link' ? p.deliveryLink : null) || (o.productSnapshot && o.productSnapshot.deliveryLink) || null;
      }
      out.push({
        id: o.id, kind, productId: o.productId, name: o.productName, amount: o.amount, status: o.status,
        createdAt: o.createdAt, method: o.paymentMethod, refundStatus: o.refundStatus || '',
        deliveryType, link, productExists
      });
    }
    res.json({ ok: true, orders: out });
  }));

  app.post('/api/mini/redeliver', wrap(async (req, res) => {
    const order = await fb.getOrder((req.body || {}).orderId);
    if (!order || String(order.userId) !== req.tg.id) return res.json({ ok: false, code: 'ORDER_NOT_FOUND', error: 'Order not found' });
    if (!(order.status === 'paid' || order.status === 'delivered') || order.isWalletTopup || order.isProPlan) {
      return res.json({ ok: false, code: 'NOT_DOWNLOADABLE', error: 'Not downloadable' });
    }
    const live = await fb.getProduct(order.productId);
    const p = live || { name: order.productName, ...(order.productSnapshot || {}) };
    const d = await deliver(req.tg.id, p, null, req.lang);
    if (!d.delivered) return res.json({ ok: false, code: 'SEND_FAILED', error: 'Could not send' });
    res.json({ ok: true });
  }));

  // ---- wallet ----
  app.get('/api/mini/wallet', wrap(async (req, res) => {
    const txns = (await fb.getUserWalletTransactions(req.tg.id)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);
    res.json({ ok: true, balance: await fb.getWalletBalance(req.tg.id), transactions: txns });
  }));

  // ---- daily check-in ----
  app.post('/api/mini/checkin', wrap(async (req, res) => {
    const r = await fb.performCheckIn(req.tg.id);
    res.json({ ok: true, ...r, balance: await fb.getWalletBalance(req.tg.id) });
  }));

  // ---- leaderboard ----
  app.get('/api/mini/leaderboard', wrap(async (req, res) => {
    const [buyers, referrers] = await Promise.all([fb.getTopBuyers(10), fb.getTopReferrers(10)]);
    res.json({
      ok: true,
      buyers: buyers.map(b => ({ name: b.name, totalSpent: b.totalSpent, me: b.telegramId === req.tg.id })),
      referrers: referrers.map(r => ({ name: r.name, referralCount: r.referralCount, me: r.telegramId === req.tg.id }))
    });
  }));

  // ---- reviews ----
  app.post('/api/mini/review', wrap(async (req, res) => {
    const uid = req.tg.id;
    const { productId } = req.body || {};
    const rating = parseInt((req.body || {}).rating, 10);
    const comment = String((req.body || {}).comment || '').slice(0, 300);
    if (!(rating >= 1 && rating <= 5)) return res.json({ ok: false, code: 'BAD_RATING', error: 'Bad rating' });
    if (!(await fb.hasUserBoughtProduct(uid, productId))) return res.json({ ok: false, code: 'NOT_BOUGHT', error: 'Not bought' });
    const existing = Object.values(await fb.getProductReviews(productId)).some(r => String(r.userId) === uid);
    if (existing) return res.json({ ok: false, code: 'ALREADY_REVIEWED', error: 'Already reviewed' });
    await fb.addReview(productId, uid, req.tg.user.first_name || 'User', rating, comment);
    res.json({ ok: true });
  }));

  // ---- refund request ----
  app.post('/api/mini/refund', wrap(async (req, res) => {
    const { orderId } = req.body || {};
    const reason = String((req.body || {}).reason || '').slice(0, 300);
    const order = await fb.getOrder(orderId);
    if (!order || String(order.userId) !== req.tg.id) return res.json({ ok: false, code: 'ORDER_NOT_FOUND', error: 'Order not found' });
    if (!(order.status === 'paid' || order.status === 'delivered') || !(order.amount > 0) || order.isWalletTopup || order.isProPlan) {
      return res.json({ ok: false, code: 'REFUND_NOT_ALLOWED', error: 'Refund not allowed' });
    }
    if (order.refundStatus) return res.json({ ok: false, code: 'REFUND_EXISTS', error: 'Refund exists' });
    await fb.requestRefund(orderId, reason);
    for (const a of adminIds()) {
      try { await bot.telegram.sendMessage(a, `💸 Refund Request (Mini App)\n\nOrder: ${orderId}\nProduct: ${order.productName}\nAmount: ₹${order.amount}\nUser: ${req.tg.id}\nReason: ${reason || '-'}`); } catch (e) {}
    }
    res.json({ ok: true });
  }));

  // ---- bot menu button -> opens the Mini App ----
  if (MINIAPP_URL && BOT_TOKEN) {
    setTimeout(() => {
      bot.telegram.setChatMenuButton({
        menuButton: { type: 'web_app', text: process.env.MINIAPP_BUTTON_TEXT || '🛍 ORVIX STORE', web_app: { url: MINIAPP_URL } }
      }).then(() => console.log('🛍 Mini App menu button set →', MINIAPP_URL))
        .catch(e => console.error('Menu button set failed:', e.message));
    }, 3000);
  }

  console.log('🛍 Mini App API ready at /app and /api/mini');
}

module.exports = { setupMiniApp };
