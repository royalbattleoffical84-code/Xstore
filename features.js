// ============================================================
// CUSTOM FEATURES — build "Become a Staff"-style features from the Admin Panel
// ============================================================
// The owner creates a feature (button name, intro, questions, optional contact,
// optional fee, reward on approval). It appears as a button in every user's main
// menu. Users answer the questions (and pay the fee if any), the owner gets the
// application with Approve / Reject buttons, and on approval the reward is
// applied automatically (wallet credit / VIP days / just a message).
//
// Owner UI:  Admin Panel → 🧩 Features

const { Markup } = require('telegraf');
const ui = require('./ui');

function setupFeatures(bot, fb, userState, adminState, { mdEscape, sendMainMenu, sendMainMenuToUser, fampay, sendZapUpiPaymentLink }) {
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const MAX_QUESTIONS = 8;
  const ownerIds = () => (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const isOwner = (ctx) => fb.isAdmin(ctx.from.id);

  const contactKb = Markup.keyboard([[Markup.button.contactRequest('📱 Share My Contact')], ['❌ Cancel']]).oneTime().resize();
  const cancelKb = Markup.keyboard([['❌ Cancel']]).resize();
  const yesNoKb = Markup.keyboard([['yes', 'no']]).oneTime().resize();
  const isCancel = (t) => /^(❌\s*)?cancel$/i.test(t);

  const rewardLabel = (r) => {
    if (!r || r.type === 'none' || !r.type) return 'Koi reward nahi (sirf message)';
    if (r.type === 'wallet') return `₹${r.amount} wallet credit`;
    if (r.type === 'vip') return `${r.amount} din VIP`;
    return '-';
  };

  // =====================================================================
  // USER SIDE
  // =====================================================================
  bot.action(/^feat_(.+)$/, async (ctx) => {
    const uid = String(ctx.from.id);
    const f = await fb.getFeature(ctx.match[1]);
    if (!f || !f.enabled) return ctx.answerCbQuery('Yeh feature abhi available nahi hai.', { show_alert: true });
    if (fb.isAdmin(uid)) return ctx.answerCbQuery('Aap owner ho — yeh users ke liye hai.', { show_alert: true });

    const last = await fb.getLatestFeatureRequestForUser(uid, f.id);
    if (last && last.status === 'pending') return ctx.answerCbQuery('⏳ Aapki request owner ke paas pending hai.', { show_alert: true });
    if (last && last.status === 'approved') return ctx.answerCbQuery('✅ Aapki request pehle hi approve ho chuki hai.', { show_alert: true });
    if (last && last.status === 'rejected' && last.decidedAt && Date.now() - last.decidedAt < COOLDOWN_MS) {
      const hrs = Math.ceil((COOLDOWN_MS - (Date.now() - last.decidedAt)) / 3600000);
      return ctx.answerCbQuery(`Pichli request reject hui thi. ${hrs} ghante baad dobara try karo.`, { show_alert: true });
    }

    await ctx.answerCbQuery();
    const data = { featureId: f.id, answers: [], idx: 0 };
    const feeLine = f.fee > 0 ? `💰 Fee: *₹${f.fee}*${f.refundOnReject ? ' _(reject hone par refund)_' : ''}\n\n` : '';
    const head = `${ui.banner(f.title.slice(0, 30), '✦ APPLY NOW ✦')}\n\n${mdEscape(f.intro)}\n\n${feeLine}`;

    if (f.askContact) {
      userState[uid] = { step: 'feat_contact', data };
      return ctx.reply(`${head}Step 1 — Neeche wale button se apna *contact share* karo.`, { parse_mode: 'Markdown', ...contactKb });
    }
    userState[uid] = { step: 'feat_q', data };
    return askQuestion(ctx, f, data, head);
  });

  async function askQuestion(ctx, f, data, head = '') {
    const q = f.questions[data.idx];
    await ctx.reply(`${head}❓ *Question ${data.idx + 1}/${f.questions.length}*\n\n${mdEscape(q)}`, { parse_mode: 'Markdown', ...cancelKb });
  }

  bot.on('contact', async (ctx, next) => {
    const uid = String(ctx.from.id);
    const st = userState[uid];
    if (!st || st.step !== 'feat_contact') return next();
    const c = ctx.message.contact;
    if (String(c.user_id) !== uid) {
      await ctx.reply('⚠️ Apna khud ka contact share karo — neeche wale button ka use karo.', contactKb);
      return;
    }
    const f = await fb.getFeature(st.data.featureId);
    if (!f) { delete userState[uid]; return ctx.reply('Feature nahi mila.', Markup.removeKeyboard()); }
    st.data.phone = c.phone_number;
    st.step = 'feat_q';
    await ctx.reply('✅ Contact mil gaya.', Markup.removeKeyboard());
    return finishOrAsk(ctx, f, st);
  });

  // after contact / each answer: next question, or on to payment/submit
  async function finishOrAsk(ctx, f, st) {
    const uid = String(ctx.from.id);
    if (st.data.idx < f.questions.length) return askQuestion(ctx, f, st.data);

    st.data.username = ctx.from.username || '';
    st.data.tgName = ctx.from.first_name || '';
    if (f.fee > 0) {
      st.step = 'feat_pay';
      const bal = await fb.getWalletBalance(uid);
      await ctx.reply('✅ Saari details mil gayi.', Markup.removeKeyboard());
      return ctx.reply(
        `💰 *Fee: ₹${f.fee}*\n\nRequest owner ko bhejne ke liye fee pay karni hogi${f.refundOnReject ? ' (reject hui to wallet mein wapas)' : ''}.\n\n👛 Aapka wallet: ₹${bal}`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
          [Markup.button.callback(`👛 Wallet se ₹${f.fee} pay karo`, 'featpay_wallet')],
          [Markup.button.callback('💳 UPI se pay karo', 'featpay_upi')],
          [Markup.button.callback('❌ Cancel', 'featpay_cancel')]
        ]) }
      );
    }
    const data = st.data; delete userState[uid];
    await ctx.reply('✅ Request bhej di ja rahi hai...', Markup.removeKeyboard());
    await submitRequest(ctx.from.id, f, data, null);
    await sendMainMenu(ctx);
  }

  async function handleUserText(ctx) {
    const uid = String(ctx.from.id);
    const st = userState[uid];
    if (!st || !st.step || !st.step.startsWith('feat_')) return false;
    const text = ctx.message.text.trim();

    if (isCancel(text)) {
      delete userState[uid];
      await ctx.reply('❌ Cancel kar diya.', Markup.removeKeyboard());
      await sendMainMenu(ctx);
      return true;
    }
    if (st.step === 'feat_contact') {
      await ctx.reply('📱 Text nahi — neeche wale *Share My Contact* button par tap karo.', { parse_mode: 'Markdown', ...contactKb });
      return true;
    }
    if (st.step === 'feat_pay') {
      await ctx.reply('👆 Upar ke buttons se payment method chuno.');
      return true;
    }
    if (st.step === 'feat_q') {
      const f = await fb.getFeature(st.data.featureId);
      if (!f) { delete userState[uid]; await ctx.reply('Feature nahi mila.', Markup.removeKeyboard()); return true; }
      if (text.length < 1 || text.length > 500) { await ctx.reply('⚠️ Jawab 1 se 500 characters ka likho.'); return true; }
      st.data.answers.push({ q: f.questions[st.data.idx], a: text });
      st.data.idx += 1;
      await finishOrAsk(ctx, f, st);
      return true;
    }
    return false;
  }

  // ---------- fee payment ----------
  async function payState(ctx) {
    const st = userState[String(ctx.from.id)];
    if (!st || st.step !== 'feat_pay') { await ctx.answerCbQuery('Session expire ho gaya — feature button dobara dabao.', { show_alert: true }); return null; }
    const f = await fb.getFeature(st.data.featureId);
    if (!f) { await ctx.answerCbQuery('Feature nahi mila.', { show_alert: true }); return null; }
    return { st, f };
  }

  bot.action('featpay_cancel', async (ctx) => {
    delete userState[String(ctx.from.id)];
    await ctx.answerCbQuery('Cancel kar diya');
    await ctx.reply('❌ Cancel kar diya.');
    await sendMainMenu(ctx);
  });

  bot.action('featpay_wallet', async (ctx) => {
    const uid = String(ctx.from.id);
    const p = await payState(ctx); if (!p) return;
    const bal = await fb.getWalletBalance(uid);
    if (bal < p.f.fee) return ctx.answerCbQuery(`Wallet balance kam hai (₹${bal}). Add Money karo ya UPI se pay karo.`, { show_alert: true });
    try { await fb.debitWallet(uid, p.f.fee, 'feature_fee'); }
    catch (e) { return ctx.answerCbQuery('Wallet balance kam hai.', { show_alert: true }); }
    await ctx.answerCbQuery('✅ Paid');
    const data = p.st.data; delete userState[uid];
    await submitRequest(ctx.from.id, p.f, data, { feePaid: p.f.fee, feeMethod: 'wallet' });
    await sendMainMenu(ctx);
  });

  bot.action('featpay_upi', async (ctx) => {
    const uid = String(ctx.from.id);
    const p = await payState(ctx); if (!p) return;
    await ctx.answerCbQuery('Payment link ban raha hai...');
    const paymentSettings = await fb.getPaymentSettings();
    const order = await fb.createOrder({
      userId: uid,
      productId: 'FEATURE_FEE',
      productName: `${p.f.title} — Fee`,
      amount: p.f.fee,
      paymentMethod: 'fampay',
      isFeatureFee: true,
      featureApplication: p.st.data   // everything needed to finish lives on the order
    });
    const qr = await fampay.generateQr(paymentSettings.upiId, p.f.fee, paymentSettings);
    if (!qr.success) {
      await fb.updateOrderStatus(order.id, 'failed');
      return ctx.reply('❌ Payment link nahi ban paya. Thodi der baad try karo ya wallet se pay karo.');
    }
    await fb.updateOrderStatus(order.id, 'pending', { famOrderId: qr.orderId });
    delete userState[uid];
    await sendZapUpiPaymentLink(ctx, order, qr, `${p.f.title} — Fee`, p.f.fee);
  });

  async function submitRequest(userId, f, data, fee) {
    const uid = String(userId);
    const u = await fb.getUser(uid);
    const req = await fb.createFeatureRequest({
      featureId: f.id,
      featureTitle: f.title,
      userId: uid,
      username: data.username || (u && u.username) || '',
      tgName: data.tgName || (u && u.name) || '',
      phone: data.phone || '',
      answers: data.answers || [],
      ...(fee || {})
    });
    try {
      await bot.telegram.sendMessage(uid,
        `${ui.banner('✅ REQUEST SENT', '✦ WAITING FOR OWNER ✦')}\n\n*${mdEscape(f.title)}* ki request owner ko bhej di gayi hai.\nDecision aate hi aapko message milega.`,
        { parse_mode: 'Markdown' });
    } catch (e) {}
    await notifyOwners(req);
    return req;
  }

  // called from bot.js once a feature-fee UPI payment is confirmed
  async function completeAfterPayment(order) {
    const data = order.featureApplication;
    if (!data) return;
    const f = await fb.getFeature(data.featureId);
    if (!f) return;
    await submitRequest(order.userId, f, data, { feePaid: order.amount, feeMethod: 'upi', feeOrderId: order.id });
    try { await sendMainMenuToUser(order.userId); } catch (e) {}
  }

  // =====================================================================
  // OWNER: decisions on applications
  // =====================================================================
  function requestCard(req) {
    const feeInfo = req.feePaid ? `Fee paid: ₹${req.feePaid} (${req.feeMethod || 'wallet'})` : null;
    return {
      text: ui.featureRequestCard(req, feeInfo),
      kb: Markup.inlineKeyboard([[
        Markup.button.callback('✅ Approve', `featreq_approve_${req.id}`),
        Markup.button.callback('❌ Reject', `featreq_reject_${req.id}`)
      ]])
    };
  }
  async function notifyOwners(req) {
    const { text, kb } = requestCard(req);
    for (const o of ownerIds()) {
      try { await bot.telegram.sendMessage(o, text, { parse_mode: 'Markdown', ...kb }); }
      catch (e) { console.error('Feature request notify failed for owner', o, e.message); }
    }
  }

  bot.action(/^featreq_approve_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    const req = await fb.decideFeatureRequest(ctx.match[1], 'approved', ctx.from.id);
    if (!req) return ctx.answerCbQuery('Yeh request pehle hi handle ho chuki hai.', { show_alert: true });
    const f = await fb.getFeature(req.featureId);

    // reward
    let rewardLine = '';
    const r = f && f.reward;
    if (r && r.type === 'wallet' && r.amount > 0) {
      await fb.creditWallet(req.userId, r.amount, 'feature_reward');
      rewardLine = `🎁 Reward: ₹${r.amount} aapke wallet mein add ho gaye!`;
    } else if (r && r.type === 'vip' && r.amount > 0) {
      await fb.activateProPlan(req.userId, r.amount);
      rewardLine = `👑 Reward: ${r.amount} din ka VIP activate ho gaya!`;
    }

    await ctx.answerCbQuery('✅ Approved');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await ctx.reply(`✅ *${mdEscape(req.tgName || req.userId)}* ki "${mdEscape(req.featureTitle)}" request approve ho gayi.${rewardLine ? `\n${rewardLine}` : ''}`, { parse_mode: 'Markdown' });
    try {
      await bot.telegram.sendMessage(req.userId, ui.featureApproved(req.featureTitle, rewardLine, f && f.approvedMessage), { parse_mode: 'Markdown' });
      await sendMainMenuToUser(req.userId);
    } catch (e) { console.error('Could not notify applicant', req.userId, e.message); }
  });

  bot.action(/^featreq_reject_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    const req = await fb.decideFeatureRequest(ctx.match[1], 'rejected', ctx.from.id);
    if (!req) return ctx.answerCbQuery('Yeh request pehle hi handle ho chuki hai.', { show_alert: true });
    const f = await fb.getFeature(req.featureId);
    let refunded = 0;
    if (req.feePaid > 0 && f && f.refundOnReject) {
      await fb.creditWallet(req.userId, req.feePaid, 'feature_fee_refund');
      refunded = req.feePaid;
    }
    await ctx.answerCbQuery('❌ Rejected');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await ctx.reply(`❌ "${mdEscape(req.featureTitle)}" request reject kar di.${refunded ? `\n💰 ₹${refunded} user ke wallet mein refund ho gaye.` : ''}`, { parse_mode: 'Markdown' });
    try {
      await bot.telegram.sendMessage(req.userId, `❌ Aapki "${req.featureTitle}" request abhi approve nahi hui.${refunded ? `\n\n💰 Fee ₹${refunded} wallet mein wapas kar di gayi.` : ''}\n\nAap 24 ghante baad dobara try kar sakte ho.`);
    } catch (e) {}
  });

  // =====================================================================
  // OWNER: Admin Panel → 🧩 Features  (create / manage)
  // =====================================================================
  async function sendFeaturesList(ctx) {
    const all = await fb.getAllFeatures();
    let text = `${ui.banner('🧩 CUSTOM FEATURES', '✦ BUILD YOUR OWN ✦')}\n\nYahan se "Become a Staff" jaise naye features bana sakte ho — user se sawal poochho, fee lo, approve karke reward do.\n\n`;
    if (!all.length) text += '_Abhi koi feature nahi hai._';
    const rows = [[Markup.button.callback('➕ Create Feature', 'featadm_new')]];
    for (const f of all) {
      const pend = (await fb.getPendingFeatureRequests(f.id)).length;
      text += `${f.enabled ? '🟢' : '🔴'} *${mdEscape(f.title)}* — ${f.fee > 0 ? '₹' + f.fee : 'free'}${pend ? ` · ⏳ ${pend}` : ''}\n`;
      rows.push([Markup.button.callback(`${f.enabled ? '🟢' : '🔴'} ${f.title.slice(0, 30)}${pend ? ` (${pend})` : ''}`, `featadm_view_${f.id}`)]);
    }
    rows.push([Markup.button.callback('⬅️ Back', 'admin_home')]);
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  }

  bot.action('admin_features', async (ctx) => {
    if (!isOwner(ctx)) return;
    await ctx.answerCbQuery();
    delete adminState[ctx.from.id];
    await sendFeaturesList(ctx);
  });

  async function sendFeatureView(ctx, id) {
    const f = await fb.getFeature(id);
    if (!f) return ctx.reply('Feature nahi mila.');
    const pend = (await fb.getPendingFeatureRequests(id)).length;
    const text = `${ui.banner('🧩 FEATURE', `✦ ${f.title} ✦`.slice(0, 40))}\n\n` +
      `Status: *${f.enabled ? 'ON 🟢' : 'OFF 🔴'}*\n💰 Fee: *${f.fee > 0 ? '₹' + f.fee : 'Free'}*${f.fee > 0 ? `\n↩️ Refund on reject: *${f.refundOnReject ? 'Yes' : 'No'}*` : ''}\n` +
      `📱 Contact maanga jata hai: *${f.askContact ? 'Yes' : 'No'}*\n🎁 Reward: *${mdEscape(rewardLabel(f.reward))}*\n⏳ Pending: *${pend}*\n\n` +
      `📝 ${mdEscape(f.intro)}\n\n❓ *Questions:*\n${f.questions.map((q, i) => `${i + 1}. ${mdEscape(q)}`).join('\n') || '—'}`;
    const rows = [
      [Markup.button.callback(f.enabled ? '🔴 Turn OFF' : '🟢 Turn ON', `featadm_toggle_${id}`)],
      [Markup.button.callback('✏️ Edit Title', `featadm_edittitle_${id}`), Markup.button.callback('💰 Edit Fee', `featadm_editfee_${id}`)],
      ...(f.fee > 0 ? [[Markup.button.callback(`↩️ Refund on reject: ${f.refundOnReject ? 'ON' : 'OFF'}`, `featadm_refund_${id}`)]] : []),
      [Markup.button.callback(`📥 Pending Requests (${pend})`, `featadm_reqs_${id}`)],
      [Markup.button.callback('🗑 Delete Feature', `featadm_del_${id}`)],
      [Markup.button.callback('⬅️ Back', 'admin_features')]
    ];
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  }

  bot.action(/^featadm_view_(.+)$/, async (ctx) => { if (!isOwner(ctx)) return; await ctx.answerCbQuery(); await sendFeatureView(ctx, ctx.match[1]); });

  bot.action(/^featadm_toggle_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    const f = await fb.getFeature(ctx.match[1]); if (!f) return ctx.answerCbQuery('Not found.');
    await fb.updateFeature(f.id, { enabled: !f.enabled });
    await ctx.answerCbQuery(f.enabled ? '🔴 OFF' : '🟢 ON');
    await sendFeatureView(ctx, f.id);
  });

  bot.action(/^featadm_refund_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    const f = await fb.getFeature(ctx.match[1]); if (!f) return ctx.answerCbQuery('Not found.');
    await fb.updateFeature(f.id, { refundOnReject: !f.refundOnReject });
    await ctx.answerCbQuery('✅ Updated');
    await sendFeatureView(ctx, f.id);
  });

  bot.action(/^featadm_edittitle_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'featadm_edittitle', data: { id: ctx.match[1] } };
    await ctx.reply('✏️ Naya button naam bhejo (emoji ke saath, max 40 chars):');
  });
  bot.action(/^featadm_editfee_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'featadm_editfee', data: { id: ctx.match[1] } };
    await ctx.reply('💰 Nayi fee bhejo (₹ number, 0 = free):');
  });

  bot.action(/^featadm_reqs_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    const pending = await fb.getPendingFeatureRequests(ctx.match[1]);
    if (!pending.length) return ctx.answerCbQuery('Koi pending request nahi.', { show_alert: true });
    await ctx.answerCbQuery();
    for (const r of pending) { const { text, kb } = requestCard(r); try { await ctx.reply(text, { parse_mode: 'Markdown', ...kb }); } catch (e) {} }
  });

  bot.action(/^featadm_del_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    await ctx.answerCbQuery();
    await ctx.reply('⚠️ Is feature ko delete karna hai? Menu se button hat jayega.', Markup.inlineKeyboard([[
      Markup.button.callback('🗑 Haan, delete', `featadm_delok_${ctx.match[1]}`), Markup.button.callback('❌ Nahi', `featadm_view_${ctx.match[1]}`)
    ]]));
  });
  bot.action(/^featadm_delok_(.+)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    await fb.deleteFeature(ctx.match[1]);
    await ctx.answerCbQuery('🗑 Deleted');
    await sendFeaturesList(ctx);
  });

  // ---- create wizard ----
  bot.action('featadm_new', async (ctx) => {
    if (!isOwner(ctx)) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'featadm_title', data: { questions: [] } };
    await ctx.reply(`${ui.banner('🧩 NEW FEATURE', '✦ STEP 1 ✦')}\n\nHome menu mein *button ka naam* kya ho? (emoji ke saath)\nJaise: 🤝 Become a Reseller`, { parse_mode: 'Markdown' });
  });

  bot.action(/^featadm_rw_(none|wallet|vip)$/, async (ctx) => {
    if (!isOwner(ctx)) return;
    const st = adminState[ctx.from.id];
    if (!st || st.step !== 'featadm_reward') return ctx.answerCbQuery('Session expire.', { show_alert: true });
    const type = ctx.match[1];
    await ctx.answerCbQuery();
    if (type === 'none') { st.data.reward = { type: 'none', amount: 0 }; st.step = 'featadm_msg'; return ctx.reply('Approve hone par user ko kaunsa *message* bhejna hai? (ya "skip")', { parse_mode: 'Markdown' }); }
    st.data.reward = { type, amount: 0 };
    st.step = 'featadm_rwval';
    await ctx.reply(type === 'wallet' ? '💰 Kitne ₹ wallet mein dene hain?' : '👑 Kitne din ka VIP dena hai?');
  });

  async function adminText(ctx, st, text) {
    const uid = ctx.from.id;
    if (isCancel(text) || text.toLowerCase() === '/cancel') { delete adminState[uid]; await ctx.reply('❌ Cancel kar diya.', Markup.removeKeyboard()); return true; }
    const d = st.data;
    const num = (t, min, max) => { const n = parseInt(t, 10); return (isNaN(n) || n < min || n > max) ? null : n; };

    switch (st.step) {
      case 'featadm_title':
        if (text.length < 2 || text.length > 40) { await ctx.reply('⚠️ Naam 2 se 40 characters ka ho.'); return true; }
        d.title = text; st.step = 'featadm_intro';
        await ctx.reply('Step 2 — User ko dikhane ke liye *description* likho (feature kya hai, kya milega):', { parse_mode: 'Markdown' });
        return true;
      case 'featadm_intro':
        if (text.length < 5 || text.length > 600) { await ctx.reply('⚠️ Description 5 se 600 characters ki ho.'); return true; }
        d.intro = text; st.step = 'featadm_q';
        await ctx.reply(`Step 3 — User se kaunse *sawal* poochne hain? Ek ek karke bhejo (max ${MAX_QUESTIONS}). Khatam hone par *done* likho.`, { parse_mode: 'Markdown' });
        return true;
      case 'featadm_q':
        if (/^\/?done$/i.test(text)) {
          st.step = 'featadm_contact';
          await ctx.reply('Step 4 — User se *phone contact* bhi maangna hai? (yes/no)', { parse_mode: 'Markdown', ...yesNoKb });
          return true;
        }
        if (text.length < 3 || text.length > 200) { await ctx.reply('⚠️ Sawal 3 se 200 characters ka ho.'); return true; }
        if (d.questions.length >= MAX_QUESTIONS) { await ctx.reply(`⚠️ Max ${MAX_QUESTIONS} sawal. *done* likho.`, { parse_mode: 'Markdown' }); return true; }
        d.questions.push(text);
        await ctx.reply(`✅ Sawal ${d.questions.length} save. Agla sawal bhejo ya *done* likho.`, { parse_mode: 'Markdown' });
        return true;
      case 'featadm_contact':
        if (!/^(yes|no)$/i.test(text)) { await ctx.reply('Reply "yes" ya "no".'); return true; }
        d.askContact = /^yes$/i.test(text);
        if (!d.askContact && d.questions.length === 0) { await ctx.reply('⚠️ Kam se kam 1 sawal ya contact zaroori hai. "yes" likho ya naye sawal ke liye /cancel karke dobara banao.'); return true; }
        st.step = 'featadm_fee';
        await ctx.reply('Step 5 — Application *fee* kitni lagegi? (₹ number, 0 = free)', { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
        return true;
      case 'featadm_fee': {
        const n = num(text, 0, 100000);
        if (n === null) { await ctx.reply('⚠️ 0 ya usse bada number daalo.'); return true; }
        d.fee = n;
        if (n > 0) { st.step = 'featadm_refundq'; await ctx.reply('Reject hone par fee wallet mein *wapas* karni hai? (yes/no)', { parse_mode: 'Markdown', ...yesNoKb }); }
        else { d.refundOnReject = false; st.step = 'featadm_reward'; await askReward(ctx); }
        return true;
      }
      case 'featadm_refundq':
        if (!/^(yes|no)$/i.test(text)) { await ctx.reply('Reply "yes" ya "no".'); return true; }
        d.refundOnReject = /^yes$/i.test(text);
        st.step = 'featadm_reward';
        await ctx.reply('✅ Saved.', Markup.removeKeyboard());
        await askReward(ctx);
        return true;
      case 'featadm_reward':
        await ctx.reply('👆 Upar ke buttons se reward chuno.');
        return true;
      case 'featadm_rwval': {
        const n = num(text, 1, 100000);
        if (n === null) { await ctx.reply('⚠️ 1 ya usse bada number daalo.'); return true; }
        d.reward.amount = n; st.step = 'featadm_msg';
        await ctx.reply('Approve hone par user ko kaunsa *message* bhejna hai? (ya "skip")', { parse_mode: 'Markdown' });
        return true;
      }
      case 'featadm_msg': {
        const f = await fb.createFeature({
          title: d.title, intro: d.intro, questions: d.questions, askContact: !!d.askContact,
          fee: d.fee || 0, refundOnReject: !!d.refundOnReject, reward: d.reward || { type: 'none', amount: 0 },
          approvedMessage: /^skip$/i.test(text) ? '' : text.slice(0, 400)
        });
        delete adminState[uid];
        await ctx.reply('✅ Feature ban gaya aur home menu mein dikhne laga!');
        await sendFeatureView(ctx, f.id);
        return true;
      }
      case 'featadm_edittitle': {
        if (text.length < 2 || text.length > 40) { await ctx.reply('⚠️ Naam 2 se 40 characters ka ho.'); return true; }
        await fb.updateFeature(d.id, { title: text }); delete adminState[uid];
        await ctx.reply('✅ Title updated.'); await sendFeatureView(ctx, d.id);
        return true;
      }
      case 'featadm_editfee': {
        const n = num(text, 0, 100000);
        if (n === null) { await ctx.reply('⚠️ 0 ya usse bada number daalo.'); return true; }
        await fb.updateFeature(d.id, { fee: n }); delete adminState[uid];
        await ctx.reply('✅ Fee updated.'); await sendFeatureView(ctx, d.id);
        return true;
      }
    }
    return false;
  }

  async function askReward(ctx) {
    await ctx.reply('Step 6 — Approve hone par user ko *reward* kya milega?', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([
      [Markup.button.callback('🚫 Koi reward nahi', 'featadm_rw_none')],
      [Markup.button.callback('💰 Wallet credit', 'featadm_rw_wallet')],
      [Markup.button.callback('👑 VIP days', 'featadm_rw_vip')]
    ]) });
  }

  // single entry from bot.js's text handler (admin wizard first, then user flow)
  async function handleText(ctx) {
    const st = adminState[ctx.from.id];
    if (st && st.step && st.step.startsWith('featadm_') && isOwner(ctx)) return adminText(ctx, st, ctx.message.text.trim());
    return handleUserText(ctx);
  }

  return { handleText, completeAfterPayment };
}

module.exports = { setupFeatures };
