// ============================================================
// "BECOME A STAFF" — application flow
// ============================================================
// 1. User taps "Become a Staff" on the main menu
// 2. Shares their own contact -> sends full name -> sends a short note
// 3. The request goes to the OWNER(S) with Approve / Reject buttons
// 4. Only after the owner approves does the user become staff, and a
//    "Staff Panel" button shows up in their main menu (no /command needed)
//
// Approved applicants get the 'products' permission only; every product they
// submit still needs owner approval (see adminPanel.js).

const { Markup } = require('telegraf');
const ui = require('./ui');

function setupStaffApply(bot, fb, userState, { mdEscape, sendMainMenu, sendMainMenuToUser, fampay, sendZapUpiPaymentLink }) {
  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // re-apply wait after a rejection
  const ownerIds = () => (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

  const contactKb = Markup.keyboard([[Markup.button.contactRequest('📱 Share My Contact')], ['❌ Cancel']]).oneTime().resize();
  const cancelKb = Markup.keyboard([['❌ Cancel']]).resize();

  // ---------- user: start application ----------
  bot.action('menu_becomestaff', async (ctx) => {
    const uid = String(ctx.from.id);
    const cfg = await fb.getStaffSettings();

    if (fb.isAdmin(uid)) return ctx.answerCbQuery('Aap owner ho — staff banne ki zaroorat nahi.', { show_alert: true });
    if (!cfg.applyEnabled) return ctx.answerCbQuery('Abhi staff applications band hain. Baad mein try karo.', { show_alert: true });
    if (await fb.isStaff(uid)) return ctx.answerCbQuery('Aap pehle se staff ho. Menu mein "Staff Panel" button use karo.', { show_alert: true });

    const last = await fb.getLatestStaffRequestForUser(uid);
    if (last && last.status === 'pending') {
      return ctx.answerCbQuery('⏳ Aapki request owner ke paas pending hai. Confirm hote hi aapko message aayega.', { show_alert: true });
    }
    if (last && last.status === 'rejected' && last.decidedAt && Date.now() - last.decidedAt < COOLDOWN_MS) {
      const hrs = Math.ceil((COOLDOWN_MS - (Date.now() - last.decidedAt)) / 3600000);
      return ctx.answerCbQuery(`Pichli request reject hui thi. ${hrs} ghante baad dobara apply kar sakte ho.`, { show_alert: true });
    }

    await ctx.answerCbQuery();
    userState[uid] = { step: 'staffapply_contact', data: {} };
    const feeLine = cfg.applyFee > 0
      ? `💰 Application fee: *₹${cfg.applyFee}*${cfg.refundOnReject ? ' _(reject hone par wallet mein refund)_' : ''}\n\n`
      : '';
    await ctx.reply(
      `${ui.banner('🧑‍💼 BECOME A STAFF', '✦ APPLY NOW ✦')}\n\n${feeLine}Step 1/3 — Neeche wale button se apna *contact share* karo.`,
      { parse_mode: 'Markdown', ...contactKb }
    );
  });

  // ---------- user: contact shared ----------
  bot.on('contact', async (ctx, next) => {
    const uid = String(ctx.from.id);
    const st = userState[uid];
    if (!st || st.step !== 'staffapply_contact') return next();

    const c = ctx.message.contact;
    if (String(c.user_id) !== uid) {
      await ctx.reply('⚠️ Apna khud ka contact share karo — neeche wale button ka use karo.', contactKb);
      return;
    }
    st.data.phone = c.phone_number;
    st.step = 'staffapply_name';
    await ctx.reply('✅ Contact mil gaya.\n\nStep 2/3 — Apna *poora naam* likho:', { parse_mode: 'Markdown', ...cancelKb });
  });

  // ---------- user: text steps (called from bot.js text handler) ----------
  async function handleText(ctx) {
    const uid = String(ctx.from.id);
    const st = userState[uid];
    if (!st || !st.step || !st.step.startsWith('staffapply_')) return false;

    const text = ctx.message.text.trim();

    if (/^(❌\s*)?cancel$/i.test(text)) {
      delete userState[uid];
      await ctx.reply('❌ Staff request cancel kar di.', Markup.removeKeyboard());
      await sendMainMenu(ctx);
      return true;
    }

    if (st.step === 'staffapply_contact') {
      await ctx.reply('📱 Text nahi — neeche wale *Share My Contact* button par tap karo.', { parse_mode: 'Markdown', ...contactKb });
      return true;
    }

    if (st.step === 'staffapply_name') {
      if (text.length < 2 || text.length > 60) {
        await ctx.reply('⚠️ Naam 2 se 60 characters ke beech likho.');
        return true;
      }
      st.data.fullName = text;
      st.step = 'staffapply_note';
      await ctx.reply('Step 3/3 — Aap staff kyun banna chahte ho aur kaun se products add karoge? (chhota sa message likho)', cancelKb);
      return true;
    }

    if (st.step === 'staffapply_note') {
      if (text.length < 5 || text.length > 500) {
        await ctx.reply('⚠️ Message 5 se 500 characters ke beech likho.');
        return true;
      }
      const data = st.data;
      data.note = text;
      data.username = ctx.from.username || '';
      data.tgName = ctx.from.first_name || '';
      const cfg = await fb.getStaffSettings();

      if (cfg.applyFee > 0) {
        st.step = 'staffapply_pay';
        await ctx.reply('✅ Details mil gayi.', Markup.removeKeyboard());
        const bal = await fb.getWalletBalance(uid);
        await ctx.reply(
          `💰 *Application Fee: ₹${cfg.applyFee}*\n\nRequest owner ko bhejne ke liye fee pay karni hogi${cfg.refundOnReject ? ' (reject hui to wallet mein wapas aa jayegi)' : ''}.\n\n👛 Aapka wallet: ₹${bal}`,
          { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
            [Markup.button.callback(`👛 Wallet se ₹${cfg.applyFee} pay karo`, 'staffapply_paywallet')],
            [Markup.button.callback('💳 UPI se pay karo', 'staffapply_payupi')],
            [Markup.button.callback('❌ Cancel', 'staffapply_cancelpay')]
          ]) }
        );
        return true;
      }

      delete userState[uid];
      await ctx.reply('✅ Request bhej di ja rahi hai...', Markup.removeKeyboard());
      await submitRequest(ctx.from.id, data, null);
      await sendMainMenu(ctx);
      return true;
    }

    return false;
  }

  // ---------- fee payment ----------
  async function stateForPay(ctx) {
    const st = userState[String(ctx.from.id)];
    if (!st || st.step !== 'staffapply_pay') {
      await ctx.answerCbQuery('Session expire ho gaya — dobara "Become a Staff" dabao.', { show_alert: true });
      return null;
    }
    return st;
  }

  bot.action('staffapply_cancelpay', async (ctx) => {
    delete userState[String(ctx.from.id)];
    await ctx.answerCbQuery('Cancel kar diya');
    await ctx.reply('❌ Staff request cancel kar di.');
    await sendMainMenu(ctx);
  });

  bot.action('staffapply_paywallet', async (ctx) => {
    const uid = String(ctx.from.id);
    const st = await stateForPay(ctx); if (!st) return;
    const cfg = await fb.getStaffSettings();
    const bal = await fb.getWalletBalance(uid);
    if (bal < cfg.applyFee) {
      return ctx.answerCbQuery(`Wallet balance kam hai (₹${bal}). Pehle Add Money karo ya UPI se pay karo.`, { show_alert: true });
    }
    try { await fb.debitWallet(uid, cfg.applyFee, 'staff_fee'); }
    catch (e) { return ctx.answerCbQuery('Wallet balance kam hai.', { show_alert: true }); }
    await ctx.answerCbQuery('✅ Paid');
    const data = st.data; delete userState[uid];
    await submitRequest(ctx.from.id, data, { feePaid: cfg.applyFee, feeMethod: 'wallet' });
    await sendMainMenu(ctx);
  });

  bot.action('staffapply_payupi', async (ctx) => {
    const uid = String(ctx.from.id);
    const st = await stateForPay(ctx); if (!st) return;
    const cfg = await fb.getStaffSettings();
    await ctx.answerCbQuery('Payment link ban raha hai...');

    const paymentSettings = await fb.getPaymentSettings();
    const order = await fb.createOrder({
      userId: uid,
      productId: 'STAFF_FEE',
      productName: 'Staff Application Fee',
      amount: cfg.applyFee,
      paymentMethod: 'fampay',
      isStaffFee: true,
      // Everything needed to finish the application is stored ON the order, so it
      // still works if the bot restarts while the user is paying.
      staffApplication: st.data
    });
    const qr = await fampay.generateQr(paymentSettings.upiId, cfg.applyFee, paymentSettings);
    if (!qr.success) {
      await fb.updateOrderStatus(order.id, 'failed');
      return ctx.reply('❌ Payment link nahi ban paya. Thodi der baad try karo ya wallet se pay karo.');
    }
    await fb.updateOrderStatus(order.id, 'pending', { famOrderId: qr.orderId });
    delete userState[uid];
    await sendZapUpiPaymentLink(ctx, order, qr, 'Staff Application Fee', cfg.applyFee);
  });

  // Creates the request + tells everyone. fee = { feePaid, feeMethod, feeOrderId } or null
  async function submitRequest(userId, data, fee) {
    const uid = String(userId);
    const u = await fb.getUser(uid);
    const req = await fb.createStaffRequest({
      userId: uid,
      username: data.username || (u && u.username) || '',
      tgName: data.tgName || (u && u.name) || '',
      phone: data.phone,
      fullName: data.fullName,
      note: data.note,
      ...(fee || {})
    });
    try {
      await bot.telegram.sendMessage(uid,
        `${ui.banner('✅ REQUEST SENT', '✦ WAITING FOR OWNER ✦')}\n\nOwner aapki request check karega.\nConfirm hote hi aapko message milega aur main menu mein *🛠 Staff Panel* ka button aa jayega.`,
        { parse_mode: 'Markdown' });
    } catch (e) {}
    await notifyOwners(req);
    return req;
  }

  // Called from bot.js once a staff-fee UPI payment is confirmed
  async function completeAfterPayment(order) {
    const data = order.staffApplication;
    if (!data) return;
    await submitRequest(order.userId, data, { feePaid: order.amount, feeMethod: 'upi', feeOrderId: order.id });
    try { await sendMainMenuToUser(order.userId); } catch (e) {}
  }

  // ---------- owner: request card ----------
  function requestCard(req) {
    const feeInfo = req.feePaid ? `Fee paid: ₹${req.feePaid} (${req.feeMethod || 'wallet'})` : null;
    const text = ui.staffRequestCard(req, feeInfo);
    const kb = Markup.inlineKeyboard([[
      Markup.button.callback('✅ Approve', `staffreq_approve_${req.id}`),
      Markup.button.callback('❌ Reject', `staffreq_reject_${req.id}`)
    ]]);
    return { text, kb };
  }

  async function notifyOwners(req) {
    const { text, kb } = requestCard(req);
    for (const owner of ownerIds()) {
      try { await bot.telegram.sendMessage(owner, text, { parse_mode: 'Markdown', ...kb }); }
      catch (e) { console.error('Staff request notify failed for owner', owner, e.message); }
    }
  }

  // owner: re-send all pending requests (from Staff menu)
  bot.action('admin_staffreqs', async (ctx) => {
    if (!fb.isAdmin(ctx.from.id)) return;
    const pending = await fb.getPendingStaffRequests();
    if (pending.length === 0) return ctx.answerCbQuery('Koi pending request nahi hai.', { show_alert: true });
    await ctx.answerCbQuery();
    for (const req of pending) {
      const { text, kb } = requestCard(req);
      try { await ctx.reply(text, { parse_mode: 'Markdown', ...kb }); } catch (e) {}
    }
  });

  // ---------- owner: approve / reject ----------
  bot.action(/^staffreq_approve_(.+)$/, async (ctx) => {
    if (!fb.isAdmin(ctx.from.id)) return; // owners only
    const id = ctx.match[1];
    // Atomic: only the first owner who taps wins
    const req = await fb.decideStaffRequest(id, 'approved', ctx.from.id);
    if (!req) return ctx.answerCbQuery('Yeh request pehle hi handle ho chuki hai.', { show_alert: true });

    const existing = await fb.getStaff(req.userId);
    const cfg = await fb.getStaffSettings();
    await fb.addStaff(req.userId, existing ? existing.permissions : (cfg.defaultPerms && cfg.defaultPerms.length ? cfg.defaultPerms : ['products']), {
      fullName: req.fullName, phone: req.phone, username: req.username
    });

    await ctx.answerCbQuery('✅ Approved');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await ctx.reply(`✅ *${mdEscape(req.fullName)}* ab staff hai.`, { parse_mode: 'Markdown' });

    try {
      await bot.telegram.sendMessage(req.userId, ui.staffWelcome(), { parse_mode: 'Markdown' });
      await sendMainMenuToUser(req.userId);
    } catch (e) { console.error('Could not notify new staff', req.userId, e.message); }
  });

  bot.action(/^staffreq_reject_(.+)$/, async (ctx) => {
    if (!fb.isAdmin(ctx.from.id)) return;
    const req = await fb.decideStaffRequest(ctx.match[1], 'rejected', ctx.from.id);
    if (!req) return ctx.answerCbQuery('Yeh request pehle hi handle ho chuki hai.', { show_alert: true });

    await ctx.answerCbQuery('❌ Rejected');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    const cfg = await fb.getStaffSettings();
    let refunded = 0;
    if (req.feePaid > 0 && cfg.refundOnReject) {
      await fb.creditWallet(req.userId, req.feePaid, 'staff_fee_refund');
      refunded = req.feePaid;
    }
    await ctx.reply(`❌ *${mdEscape(req.fullName)}* ki request reject kar di.${refunded ? `\n💰 ₹${refunded} unke wallet mein refund ho gaye.` : ''}`, { parse_mode: 'Markdown' });
    try {
      await bot.telegram.sendMessage(req.userId, `❌ Aapki staff request owner ne abhi approve nahi ki.${refunded ? `\n\n💰 Aapki fee ₹${refunded} wallet mein wapas kar di gayi hai.` : ''}\n\nAap 24 ghante baad dobara apply kar sakte ho.`);
    } catch (e) {}
  });

  return { handleText, completeAfterPayment };
}

module.exports = { setupStaffApply };
