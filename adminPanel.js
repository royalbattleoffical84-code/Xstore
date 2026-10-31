// ============================================================
// ADMIN PANEL (Telegram-based, replaces admin.html)
// ============================================================
// Everything the old web admin.html did is now available via /admin inside
// the bot itself — no browser, no Firebase client SDK, no separate hosting.
// All actions require the user's Telegram ID to be in ADMIN_TELEGRAM_IDS.

const { Markup } = require('telegraf');
const ui = require('./ui');

function setupAdminPanel(bot, fb, mdEscape) {
  const adminState = {}; // { telegramId: { step, data } } — separate from user-facing userState

  // Full owners (ADMIN_TELEGRAM_IDS) always pass. Staff pass a lighter check
  // since their menu is filtered by permission — isAdmin() itself just gates
  // "can open the panel at all", not which buttons they see.
  function isAdmin(ctx) {
    return fb.isAdmin(ctx.from.id);
  }

  async function isAdminOrStaff(ctx) {
    if (fb.isAdmin(ctx.from.id)) return true;
    return await fb.isStaff(ctx.from.id);
  }

  async function isOwner(ctx) {
    return fb.isAdmin(ctx.from.id); // only full owners, never staff
  }

  async function hasPerm(ctx, perm) {
    if (fb.isAdmin(ctx.from.id)) return true;
    const perms = await fb.getStaffPermissions(ctx.from.id);
    return perms.includes(perm);
  }

  const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

  // Staff features are LOCKED until the owner unlocks them. Owners always pass.
  async function needPerm(ctx, perm) {
    if (fb.isAdmin(ctx.from.id)) return true;
    if (!(await fb.isStaff(ctx.from.id))) return false;
    const perms = await fb.getStaffPermissions(ctx.from.id);
    if (perms.includes(perm)) return true;
    try { await ctx.answerCbQuery(`🔒 ${(PERM_LABELS[perm] || perm).replace(/^\S+\s/, '')} locked hai — owner se unlock karwao.`, { show_alert: true }); } catch (e) {}
    return false;
  }

  let _botUser = null;
  async function botUsername() {
    if (_botUser) return _botUser;
    try { _botUser = (await bot.telegram.getMe()).username; } catch (e) {}
    return _botUser || '';
  }

  const ownerIds = () => (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

  // ---- Product approval helpers (staff submissions need owner approval) ----
  function productStatusIcon(p) {
    if (p.approvalStatus === 'pending') return '⏳';
    if (p.approvalStatus === 'rejected') return '❌';
    return p.active ? '✅' : '🙈';
  }

  // Owners can manage everything. Staff can only touch THEIR OWN products,
  // and only until the owner approves them (approved ones are owner-managed).
  function staffCanEdit(ctx, p) {
    return String(p.submittedBy) === String(ctx.from.id) && p.approvalStatus !== 'approved';
  }
  function canManageProduct(ctx, p) {
    return fb.isAdmin(ctx.from.id) || staffCanEdit(ctx, p);
  }

  function productButtons(owner, id, p) {
    const rows = [];
    if (owner) {
      if (p.approvalStatus === 'pending') {
        rows.push([Markup.button.callback('✅ Approve', `admin_approveprod_${id}`), Markup.button.callback('❌ Reject', `admin_rejectprod_${id}`)]);
      }
      rows.push([Markup.button.callback('✏️ Edit', `admin_editprod_${id}`)]);
      if (p.approvalStatus !== 'pending') rows.push([Markup.button.callback(p.active ? '🙈 Hide' : '✅ Show', `admin_toggleprod_${id}`)]);
      rows.push([Markup.button.callback('🔗 Get Share Link', `admin_prodlink_${id}`)]);
      rows.push([Markup.button.callback('🗑 Delete', `admin_delprod_${id}`)]);
    } else {
      if (p.approvalStatus !== 'approved') {
        rows.push([Markup.button.callback('✏️ Edit & Resubmit', `admin_editprod_${id}`)]);
        rows.push([Markup.button.callback('🗑 Delete', `admin_delprod_${id}`)]);
      } else {
        rows.push([Markup.button.callback('🔗 Get Share Link', `admin_prodlink_${id}`)]);
      }
    }
    rows.push([Markup.button.callback('⬅️ Back', 'admin_products')]);
    return Markup.inlineKeyboard(rows);
  }

  function productStatusLine(p) {
    if (p.approvalStatus === 'pending') return '⏳ Waiting for owner approval';
    if (p.approvalStatus === 'rejected') return '❌ Rejected by owner — edit & resubmit';
    return p.active ? '✅ Live in store' : '🙈 Hidden';
  }

  async function notifyOwnersOfSubmission(productId, p, isResubmit) {
    const stockLabel = p.stock === -1 || p.stock === undefined ? 'Unlimited' : p.stock;
    const delivery = p.deliveryType === 'file' ? '📎 File delivery (file sent below for review)' : `🔗 Link: \`${p.deliveryLink}\``;
    const caption = ui.productSubmission(p, isResubmit, stockLabel, delivery);
    const kb = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Approve', `admin_approveprod_${productId}`), Markup.button.callback('❌ Reject', `admin_rejectprod_${productId}`)],
      [Markup.button.callback('👁 Open', `admin_prod_${productId}`)]
    ]);
    const image = (p.imageFileIds && p.imageFileIds[0]) || p.imageFileId || null;
    for (const owner of ownerIds()) {
      try {
        if (image) await bot.telegram.sendPhoto(owner, image, { caption, parse_mode: 'Markdown', ...kb });
        else await bot.telegram.sendMessage(owner, caption, { parse_mode: 'Markdown', ...kb });
        if (p.deliveryType === 'file' && p.fileId) await bot.telegram.sendDocument(owner, p.fileId, { caption: `📎 Delivery file for "${p.name}" (review)` });
      } catch (e) { console.error('Approval notify failed for owner', owner, e.message); }
    }
  }

  // ============ MAIN ADMIN MENU ============

  // /admin is OWNER ONLY. Staff reach their panel from the main-menu button.
  bot.command('admin', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    delete adminState[ctx.from.id];
    await sendAdminMenu(ctx);
  });

  async function sendAdminMenu(ctx) {
    const owner = await isOwner(ctx);
    const cfg = await fb.getStaffSettings();
    const rows = [];
    let text;

    if (owner) {
      text = `${ui.banner('🛠 ADMIN PANEL', '✦ OWNER CONTROL ✦')}\n\nChoose a section:`;
      rows.push([Markup.button.callback('📦 Products', 'admin_products'), Markup.button.callback('🧾 Orders', 'admin_orders')]);
      rows.push([Markup.button.callback('🎁 Gift Product', 'admin_gift'), Markup.button.callback('🔗 Refer-Lock', 'admin_referlock')]);
      rows.push([Markup.button.callback('👥 Users', 'admin_users'), Markup.button.callback('↩️ Refunds', 'admin_refunds')]);
      rows.push([Markup.button.callback('🎟 Coupons', 'admin_coupons'), Markup.button.callback('🔗 Referral', 'admin_referral')]);
      rows.push([Markup.button.callback('📢 Broadcast', 'admin_broadcast'), Markup.button.callback('📩 Direct Message', 'admin_dm')]);
      rows.push([Markup.button.callback('📜 Message History', 'admin_msghistory')]);
      rows.push([Markup.button.callback('⚙️ Bot Settings', 'admin_settings'), Markup.button.callback('🔘 Menu Buttons', 'admin_menubuttons')]);
      rows.push([Markup.button.callback('👑 Pro Plan', 'admin_proplan'), Markup.button.callback('🎯 Check-in', 'admin_checkin')]);
      rows.push([Markup.button.callback('📊 Sales Report', 'admin_report'), Markup.button.callback('🏆 Leaderboard', 'admin_leaderboard')]);
      rows.push([Markup.button.callback('🧑‍💼 Staff', 'admin_staff'), Markup.button.callback('🧩 Features', 'admin_features')]);
      rows.push([Markup.button.callback('👨‍💻 Developers', 'admin_developers'), Markup.button.callback('💾 Backup Data', 'admin_backup')]);
    } else {
      const perms = await fb.getStaffPermissions(ctx.from.id);
      const open = (perm) => perms.includes(perm) && !(perm === 'gift' && !cfg.giftEnabled);
      // Every feature is always VISIBLE; locked ones show 🔒 until the owner unlocks them.
      const cell = (perm, label, cb) => open(perm)
        ? Markup.button.callback(label, cb)
        : Markup.button.callback('🔒 ' + label.replace(/^\S+\s/, ''), `admin_locked_${perm}`);
      const total = Object.keys(PERM_LABELS).length;
      const unlocked = Object.keys(PERM_LABELS).filter(open).length;
      text = `${ui.banner('🛠 STAFF PANEL', '✦ YOUR WORKSPACE ✦')}\n\n🔓 Unlocked: *${unlocked}/${total}* features\n_🔒 wale features owner unlock karega tabhi chalenge._\n\nChoose a section:`;
      rows.push([cell('products', '📦 My Products', 'admin_products'), cell('products', '➕ Add Product', 'admin_addproduct')]);
      rows.push([cell('gift', '🎁 Gift Product', 'admin_gift'), cell('coupons', '🎟 My Coupons', 'admin_coupons')]);
      rows.push([cell('orders', '🧾 My Orders', 'admin_orders'), cell('stats', '📊 My Stats', 'admin_mystats')]);
      rows.push([cell('stock', '📦 Stock Manager', 'admin_stock'), cell('referlock', '🔗 Refer-Lock', 'admin_referlock')]);
      rows.push([cell('links', '🔗 Share Links', 'admin_links'), cell('users', '👥 Users', 'admin_users')]);
      rows.push([cell('broadcast', '📢 Broadcast', 'admin_broadcast'), cell('broadcast', '📩 Direct Message', 'admin_dm')]);
      rows.push([cell('broadcast', '📜 Message History', 'admin_msghistory')]);
      rows.push([Markup.button.callback('👤 My Profile', 'admin_myprofile'), Markup.button.callback('💬 Contact Owner', 'admin_contactowner')]);
    }
    rows.push([Markup.button.callback('🏠 Home', 'menu_home')]);

    const buttons = Markup.inlineKeyboard(rows);
    if (ctx.callbackQuery) {
      try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...buttons }); return; }
      catch (e) { try { await ctx.deleteMessage(); } catch (e2) {} }
    }
    await ctx.reply(text, { parse_mode: 'Markdown', ...buttons });
  }

  function adminBackButton(target = 'admin_home') {
    return Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', target)]]);
  }

  // Owner: Admin Panel button in the main menu (same as /admin)
  bot.action('menu_adminpanel', async (ctx) => {
    if (!(await isOwner(ctx))) return ctx.answerCbQuery('Sirf owner ke liye.', { show_alert: true });
    await ctx.answerCbQuery();
    delete adminState[ctx.from.id];
    await sendAdminMenu(ctx);
  });

  // Staff open their panel from the main-menu button (no /command needed)
  bot.action('menu_staffpanel', async (ctx) => {
    if (!(await isAdminOrStaff(ctx))) return ctx.answerCbQuery('Aap staff nahi ho.', { show_alert: true });
    await ctx.answerCbQuery();
    delete adminState[ctx.from.id];
    await sendAdminMenu(ctx);
  });

  bot.action('admin_home', async (ctx) => {
    if (!(await isAdminOrStaff(ctx))) return;
    await ctx.answerCbQuery();
    delete adminState[ctx.from.id];
    await sendAdminMenu(ctx);
  });

  // ============ PRODUCTS ============

  bot.action('admin_products', async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    await ctx.answerCbQuery();
    await sendProductsList(ctx);
  });

  async function sendProductsList(ctx) {
    const owner = await isOwner(ctx);
    const all = await fb.getAllProducts(false);
    // Staff only ever see (and manage) the products THEY submitted.
    const entries = Object.entries(all).filter(([, p]) => owner || String(p.submittedBy) === String(ctx.from.id));
    if (owner) entries.sort((x, y) => (y[1].approvalStatus === 'pending' ? 1 : 0) - (x[1].approvalStatus === 'pending' ? 1 : 0));
    const pendingCount = entries.filter(([, p]) => p.approvalStatus === 'pending').length;

    let text = `📦 *${owner ? 'Products' : 'My Products'}* (${entries.length})\n`;
    if (pendingCount) text += `⏳ ${pendingCount} waiting for approval\n`;
    text += '\n';
    if (entries.length === 0) {
      text += owner ? '_No products yet._' : '_You have not submitted any products yet._';
    } else {
      entries.slice(0, 20).forEach(([id, p]) => {
        text += `${productStatusIcon(p)} *${mdEscape(p.name)}* — ₹${p.price} | 👁 ${p.views || 0}${p.stock !== undefined && p.stock !== -1 ? ` | 📦 ${p.stock}` : ''}\n`;
      });
      if (entries.length > 20) text += `\n_...and ${entries.length - 20} more_`;
    }
    if (!owner) text += '\n\n_Your products go live only after the owner approves them._';

    const buttons = [[Markup.button.callback('➕ Add Product', 'admin_addproduct')]];
    entries.slice(0, 20).forEach(([id, p]) => {
      buttons.push([Markup.button.callback(`${productStatusIcon(p)} ${p.name.slice(0, 25)}`, `admin_prod_${id}`)]);
    });
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action(/^admin_prod_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const productId = ctx.match[1];
    const p = await fb.getProduct(productId);
    if (!p) return ctx.answerCbQuery('Product not found.');
    const owner = await isOwner(ctx);
    if (!owner && String(p.submittedBy) !== String(ctx.from.id)) return ctx.answerCbQuery('⛔ Yeh aapka product nahi hai.', { show_alert: true });
    await ctx.answerCbQuery();

    let text = `📦 *${mdEscape(p.name)}*\n\n💰 ₹${p.price}\n📁 ${mdEscape(p.category)}\n${p.deliveryType === 'file' ? '📎 File delivery' : '🔗 Link delivery'}\n📦 Stock: ${p.stock === -1 || p.stock === undefined ? 'Unlimited' : p.stock}\n👁 ${p.views || 0} views\n${productStatusLine(p)}`;
    if (owner && p.submittedBy) text += `\n👤 Submitted by: ${mdEscape(p.submittedByName || 'Staff')} (\`${p.submittedBy}\`)`;
    text += `\n\n${mdEscape(p.description || '')}`;
    if (!owner && p.approvalStatus === 'approved') text += '\n\n_Approved products can be changed by the owner only._';

    const buttons = productButtons(owner, productId, p);
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...buttons }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...buttons }); }
  });

  bot.action(/^admin_toggleprod_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return; // only the owner can show/hide products
    const productId = ctx.match[1];
    const p = await fb.getProduct(productId);
    if (!p) return ctx.answerCbQuery('Not found.');
    if (p.approvalStatus === 'pending') return ctx.answerCbQuery('Pehle Approve ya Reject karo.', { show_alert: true });
    await fb.updateProduct(productId, { active: !p.active });
    await ctx.answerCbQuery(p.active ? '🙈 Hidden' : '✅ Shown');
    const updated = await fb.getProduct(productId);
    const text = `📦 *${mdEscape(updated.name)}*\n\n💰 ₹${updated.price}\n${productStatusLine(updated)}`;
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...productButtons(true, productId, updated) }); } catch (e) {}
  });


  // ============================================================
  // STAFF SETTINGS (owner) — fee, open/close, permissions, limits
  // ============================================================
  const PERM_LABELS = { products: '📦 Products', gift: '🎁 Gift', coupons: '🎟 Coupons', orders: '🧾 Orders', stats: '📊 Stats', stock: '📦 Stock', referlock: '🔗 Refer-Lock', links: '🔗 Links', users: '👥 Users', broadcast: '📢 Broadcast' };
  const onOff = (v) => (v ? 'ON 🟢' : 'OFF 🔴');

  async function sendStaffSettings(ctx) {
    const c = await fb.getStaffSettings();
    const text =
      `${ui.banner('⚙️ STAFF SETTINGS', '✦ OWNER CONTROL ✦')}\n\n` +
      `🧑‍💼 Become a Staff: *${onOff(c.applyEnabled)}*\n` +
      `💰 Application fee: *${c.applyFee > 0 ? '₹' + c.applyFee : 'Free'}*\n` +
      `↩️ Refund fee if rejected: *${onOff(c.refundOnReject)}*\n` +
      `🎁 Staff gifting: *${onOff(c.giftEnabled)}*\n` +
      `🎁 Gifts per staff / day: *${c.giftDailyLimit > 0 ? c.giftDailyLimit : 'Unlimited'}*\n` +
      `📦 Max products per staff: *${c.maxProducts > 0 ? c.maxProducts : 'Unlimited'}*\n` +
      `🎟 Max staff coupon discount: *${c.couponMaxPercent}%*\n\n` +
      `🔐 *Permissions for newly approved staff:*\n${Object.entries(PERM_LABELS).map(([k, l]) => `${c.defaultPerms.includes(k) ? '✅' : '⬜'} ${l}`).join('\n')}`;

    const rows = [
      [Markup.button.callback(`🧑‍💼 Applications: ${onOff(c.applyEnabled)}`, 'admin_ss_toggle_applyEnabled')],
      [Markup.button.callback('💰 Set Application Fee', 'admin_ss_edit_applyFee')],
      [Markup.button.callback(`↩️ Refund on reject: ${onOff(c.refundOnReject)}`, 'admin_ss_toggle_refundOnReject')],
      [Markup.button.callback(`🎁 Staff Gifting: ${onOff(c.giftEnabled)}`, 'admin_ss_toggle_giftEnabled')],
      [Markup.button.callback('🎁 Set Daily Gift Limit', 'admin_ss_edit_giftDailyLimit')],
      [Markup.button.callback('📦 Set Max Products / Staff', 'admin_ss_edit_maxProducts')],
      [Markup.button.callback('🎟 Set Max Coupon Discount %', 'admin_ss_edit_couponMaxPercent')],
      ...chunk(Object.entries(PERM_LABELS).filter(([k]) => k !== 'products').map(([k, l]) => Markup.button.callback(`${c.defaultPerms.includes(k) ? '✅' : '⬜'} ${l.split(' ')[1]}`, `admin_ss_perm_${k}`)), 3),
      [Markup.button.callback('⬅️ Back', 'admin_staff')]
    ];
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  }

  bot.action('admin_staffsettings', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendStaffSettings(ctx);
  });

  bot.action(/^admin_ss_toggle_(applyEnabled|refundOnReject|giftEnabled)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const key = ctx.match[1];
    const c = await fb.getStaffSettings();
    await fb.updateStaffSettings({ [key]: !c[key] });
    await ctx.answerCbQuery('✅ Updated');
    await sendStaffSettings(ctx);
  });

  bot.action(/^admin_ss_perm_(gift|coupons|orders|stats|stock|referlock|links|users|broadcast)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const perm = ctx.match[1];
    const c = await fb.getStaffSettings();
    const set = new Set(c.defaultPerms); set.add('products'); // products is always on
    set.has(perm) ? set.delete(perm) : set.add(perm);
    await fb.updateStaffSettings({ defaultPerms: [...set] });
    await ctx.answerCbQuery('✅ Updated');
    await sendStaffSettings(ctx);
  });

  const SS_PROMPTS = {
    applyFee: '💰 Application fee kitni rakhni hai? (₹ number, 0 = free)',
    giftDailyLimit: '🎁 Ek staff din mein kitne gifts de sakta hai? (0 = unlimited)',
    maxProducts: '📦 Ek staff kitne products submit kar sakta hai? (0 = unlimited)',
    couponMaxPercent: '🎟 Staff coupon se maximum kitne % discount mil sakta hai? (1-100)'
  };
  bot.action(/^admin_ss_edit_(applyFee|giftDailyLimit|maxProducts|couponMaxPercent)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const key = ctx.match[1];
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'ss_edit', data: { key } };
    await ctx.reply(SS_PROMPTS[key]);
  });

  // ---- single staff member: view + permission toggles ----
  async function sendStaffView(ctx, id) {
    const s = await fb.getStaff(id);
    if (!s) return ctx.reply('Staff nahi mila.');
    const myProducts = Object.values(await fb.getAllProducts(false)).filter(p => String(p.submittedBy) === String(id));
    const gifts = Object.values(await fb.getAllOrders()).filter(o => o.paymentMethod === 'gift' && String(o.giftedBy) === String(id)).length;
    const text =
      `👤 *${mdEscape(s.fullName || 'Staff')}*\n🆔 \`${id}\`${s.phone ? `\n📱 \`${s.phone}\`` : ''}${s.username ? `\n🔗 @${mdEscape(s.username)}` : ''}\n\n` +
      `📦 Products submitted: ${myProducts.length} (live: ${myProducts.filter(p => p.active).length})\n🎁 Gifts given: ${gifts}\n\n` +
      `🔐 *Permissions:*\n${Object.entries(PERM_LABELS).map(([k, l]) => `${s.permissions.includes(k) ? '✅' : '⬜'} ${l}`).join('\n')}`;
    const rows = [
      ...chunk(Object.entries(PERM_LABELS).filter(([k]) => k !== 'products').map(([k, l]) => Markup.button.callback(`${s.permissions.includes(k) ? '✅' : '⬜'} ${l.split(' ')[1]}`, `admin_staffperm_${id}_${k}`)), 3),
      [Markup.button.callback('🗑 Remove Staff', `admin_removestaff_${id}`)],
      [Markup.button.callback('⬅️ Back', 'admin_staff')]
    ];
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  }

  bot.action(/^admin_staffview_(\d+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendStaffView(ctx, ctx.match[1]);
  });

  bot.action(/^admin_staffperm_(\d+)_(gift|coupons|orders|stats|stock|referlock|links|users|broadcast)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const [, id, perm] = ctx.match;
    const s = await fb.getStaff(id);
    if (!s) return ctx.answerCbQuery('Staff nahi mila.');
    const set = new Set(s.permissions); set.add('products');
    set.has(perm) ? set.delete(perm) : set.add(perm);
    await fb.setStaffPermissions(id, [...set]);
    await ctx.answerCbQuery('✅ Updated');
    await sendStaffView(ctx, id);
  });

  // ============================================================
  // 🎁 GIFT PRODUCT  (owner: any product, staff: only their own live products)
  // ============================================================
  async function giftableProducts(ctx) {
    const all = await fb.getAllProducts(true); // active only
    const owner = await isOwner(ctx);
    return Object.entries(all).filter(([, p]) => owner || String(p.submittedBy) === String(ctx.from.id));
  }

  async function sendGiftPicker(ctx, page = 0) {
    if (!(await isOwner(ctx))) {
      const cfg = await fb.getStaffSettings();
      if (!cfg.giftEnabled) return ctx.reply('🎁 Gifting abhi owner ne band kar rakhi hai.');
    }
    const list = await giftableProducts(ctx);
    const PER = 8;
    const pages = Math.max(1, Math.ceil(list.length / PER));
    page = Math.min(Math.max(0, page), pages - 1);
    const slice = list.slice(page * PER, page * PER + PER);

    let text = `${ui.banner('🎁 GIFT PRODUCT', '✦ SEND A PRODUCT FREE ✦')}\n\n`;
    text += list.length
      ? 'Jo product gift karna hai wo chuno:'
      : (await isOwner(ctx) ? '_Koi live product nahi hai._' : '_Aapka koi approved/live product nahi hai. Approval ke baad gift kar sakoge._');
    const rows = slice.map(([id, p]) => [Markup.button.callback(`🎁 ${p.name.slice(0, 28)} | ${p.price === 0 ? 'FREE' : '₹' + p.price}`, `admin_giftprod_${id}`)]);
    if (pages > 1) {
      const nav = [];
      if (page > 0) nav.push(Markup.button.callback('◀️ Prev', `admin_giftpage_${page - 1}`));
      nav.push(Markup.button.callback(`${page + 1}/${pages}`, 'admin_noop'));
      if (page < pages - 1) nav.push(Markup.button.callback('Next ▶️', `admin_giftpage_${page + 1}`));
      rows.push(nav);
    }
    rows.push([Markup.button.callback('⬅️ Back', 'admin_home')]);
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  }

  bot.action('admin_noop', async (ctx) => { await ctx.answerCbQuery(); });

  bot.action('admin_gift', async (ctx) => {
    if (!(await needPerm(ctx, 'gift'))) return;
    await ctx.answerCbQuery();
    delete adminState[ctx.from.id];
    await sendGiftPicker(ctx, 0);
  });

  bot.action(/^admin_giftpage_(\d+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'gift'))) return;
    await ctx.answerCbQuery();
    await sendGiftPicker(ctx, parseInt(ctx.match[1], 10));
  });

  bot.action(/^admin_giftprod_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'gift'))) return;
    const id = ctx.match[1];
    const p = await fb.getProduct(id);
    const owner = await isOwner(ctx);
    if (!p || !p.active) return ctx.answerCbQuery('Product available nahi hai.', { show_alert: true });
    if (!owner && String(p.submittedBy) !== String(ctx.from.id)) return ctx.answerCbQuery('⛔ Sirf apne products gift kar sakte ho.', { show_alert: true });
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'gift_userid', data: { productId: id } };
    await ctx.reply(`🎁 *${mdEscape(p.name)}*\n\nJis user ko gift karna hai uski *Telegram ID* bhejo:`, { parse_mode: 'Markdown' });
  });

  bot.action('admin_giftcancel', async (ctx) => {
    delete adminState[ctx.from.id];
    await ctx.answerCbQuery('Cancelled');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
  });

  bot.action('admin_giftgo', async (ctx) => {
    if (!(await needPerm(ctx, 'gift'))) return;
    const st = adminState[ctx.from.id];
    if (!st || st.step !== 'gift_confirm') return ctx.answerCbQuery('Session expire — dobara Gift Product kholo.', { show_alert: true });
    const { productId, targetId } = st.data;
    delete adminState[ctx.from.id]; // one tap = one gift
    const owner = await isOwner(ctx);

    const p = await fb.getProduct(productId);
    if (!p || !p.active) return ctx.answerCbQuery('Product ab available nahi hai.', { show_alert: true });
    if (!owner && String(p.submittedBy) !== String(ctx.from.id)) return ctx.answerCbQuery('⛔ Not allowed.', { show_alert: true });
    if (p.stock !== undefined && p.stock !== -1 && p.stock <= 0) return ctx.answerCbQuery('Product out of stock hai.', { show_alert: true });

    // Staff limits
    if (!owner) {
      const cfg = await fb.getStaffSettings();
      if (!cfg.giftEnabled) return ctx.answerCbQuery('Gifting band hai.', { show_alert: true });
      if (cfg.giftDailyLimit > 0) {
        const since = Date.now() - 24 * 60 * 60 * 1000;
        const used = Object.values(await fb.getAllOrders()).filter(o => o.paymentMethod === 'gift' && String(o.giftedBy) === String(ctx.from.id) && o.createdAt >= since).length;
        if (used >= cfg.giftDailyLimit) return ctx.answerCbQuery(`Aaj ki gift limit (${cfg.giftDailyLimit}) poori ho gayi.`, { show_alert: true });
      }
    }
    if (await fb.hasUserBoughtProduct(targetId, productId)) return ctx.answerCbQuery('Is user ke paas yeh product pehle se hai.', { show_alert: true });

    await ctx.answerCbQuery('🎁 Sending...');
    const staffRec = owner ? null : await fb.getStaff(ctx.from.id);
    const fromLabel = owner ? ui.STORE_NAME : ((staffRec && staffRec.fullName) || ctx.from.first_name || 'Staff');

    const order = await fb.createOrder({
      userId: String(targetId),
      productId,
      productName: p.name,
      amount: 0,
      originalAmount: p.price,
      paymentMethod: 'gift',
      giftedBy: String(ctx.from.id),
      giftedByName: fromLabel,
      giftedByRole: owner ? 'owner' : 'staff',
      productSnapshot: { deliveryType: p.deliveryType, fileId: p.fileId || null, deliveryLink: p.deliveryLink || null }
    });

    try {
      if (p.deliveryType === 'file' && p.fileId) {
        await bot.telegram.sendDocument(targetId, p.fileId, { caption: ui.giftPlain({ name: p.name, from: fromLabel }) });
      } else if (p.deliveryType === 'link' && p.deliveryLink) {
        await bot.telegram.sendMessage(targetId, ui.giftPlain({ name: p.name, from: fromLabel, link: p.deliveryLink }));
      } else {
        throw new Error('Product has no delivery content');
      }
    } catch (err) {
      await fb.updateOrderStatus(order.id, 'failed', { error: String(err.message).slice(0, 120) });
      return ctx.reply(`❌ Gift deliver nahi ho paya: ${err.message}\n\nUser ne bot block kiya ho sakta hai.`);
    }

    await fb.updateOrderStatus(order.id, 'delivered', { deliveredAt: Date.now() });
    await fb.decrementStock(productId);
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await ctx.reply(ui.giftSent({ name: p.name, to: targetId, by: owner ? null : fromLabel }), { parse_mode: 'Markdown' });

    // Oversight: owners get a short log of every staff gift
    if (!owner) {
      for (const o of ownerIds()) {
        try { await bot.telegram.sendMessage(o, `🎁 Staff gift: ${fromLabel} (${ctx.from.id}) → \`${targetId}\`\n📦 ${mdEscape(p.name)}`, { parse_mode: 'Markdown' }); } catch (e) {}
      }
    }
  });


  // ============================================================
  // STAFF PANEL FEATURES (each one is unlocked per staff by the owner)
  // ============================================================
  bot.action(/^admin_locked_(\w+)$/, async (ctx) => {
    const label = (PERM_LABELS[ctx.match[1]] || ctx.match[1]).replace(/^\S+\s/, '');
    const cfg = await fb.getStaffSettings();
    const extra = ctx.match[1] === 'gift' && !cfg.giftEnabled ? ' (owner ne gifting band ki hai)' : '';
    await ctx.answerCbQuery(`🔒 ${label} abhi locked hai${extra}. Owner se unlock karwao (Contact Owner button use karo).`, { show_alert: true });
  });

  const productsFor = async (ctx) => {
    const owner = await isOwner(ctx);
    return Object.entries(await fb.getAllProducts(false)).filter(([, p]) => owner || String(p.submittedBy) === String(ctx.from.id));
  };
  const ownsProduct = async (ctx, p) => (await isOwner(ctx)) || String(p.submittedBy) === String(ctx.from.id);

  // ---- 📊 My Stats ----
  bot.action('admin_mystats', async (ctx) => {
    if (!(await needPerm(ctx, 'stats'))) return;
    await ctx.answerCbQuery();
    const id = String(ctx.from.id);
    const prods = await productsFor(ctx);
    const ids = new Set(prods.map(([k]) => k));
    const allOrders = Object.values(await fb.getAllOrders());
    const sales = allOrders.filter(o => ids.has(o.productId) && (o.status === 'paid' || o.status === 'delivered') && o.paymentMethod !== 'gift');
    const now = Date.now(), day = 86400000;
    const agg = (since) => { const l = sales.filter(o => o.createdAt >= since); return { n: l.length, rev: l.reduce((s, o) => s + (o.amount || 0), 0) }; };
    const w = agg(now - 7 * day), m = agg(now - 30 * day), all = agg(0);
    const views = prods.reduce((s, [, p]) => s + (p.views || 0), 0);
    const gifts = allOrders.filter(o => o.paymentMethod === 'gift' && String(o.giftedBy) === id).length;
    const count = {}; sales.forEach(o => { count[o.productName] = (count[o.productName] || 0) + 1; });
    const top = Object.entries(count).sort((x, y) => y[1] - x[1])[0];
    const text = `${ui.banner('📊 MY STATS', '✦ YOUR PRODUCTS ✦')}\n\n` +
      `📦 Products: ${prods.length} (live: ${prods.filter(([, p]) => p.active).length})\n👁 Total views: ${views}\n🎁 Gifts given: ${gifts}\n\n` +
      `🗓 *Last 7 days:* ${w.n} sales · ₹${w.rev}\n🗓 *Last 30 days:* ${m.n} sales · ₹${m.rev}\n🏁 *All time:* ${all.n} sales · ₹${all.rev}\n\n` +
      `🏆 Top product: ${top ? `${mdEscape(top[0])} (${top[1]})` : '—'}`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...adminBackButton() });
  });

  // ---- 📦 Stock Manager ----
  bot.action('admin_stock', async (ctx) => {
    if (!(await needPerm(ctx, 'stock'))) return;
    await ctx.answerCbQuery();
    const list = await productsFor(ctx);
    let text = `${ui.banner('📦 STOCK MANAGER', '✦ UPDATE STOCK ✦')}\n\n`;
    if (!list.length) text += '_Koi product nahi hai._';
    const rows = list.slice(0, 25).map(([id, p]) => [Markup.button.callback(`${p.name.slice(0, 26)} · ${p.stock === -1 || p.stock === undefined ? '∞' : p.stock}`, `admin_stockedit_${id}`)]);
    rows.push([Markup.button.callback('⬅️ Back', 'admin_home')]);
    text += list.length ? 'Jis product ka stock badalna hai usse chuno:' : '';
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  });

  bot.action(/^admin_stockedit_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'stock'))) return;
    const p = await fb.getProduct(ctx.match[1]);
    if (!p || !(await ownsProduct(ctx, p))) return ctx.answerCbQuery('⛔ Not allowed.', { show_alert: true });
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'stock_edit', data: { productId: ctx.match[1] } };
    await ctx.reply(`📦 *${mdEscape(p.name)}*\nAbhi stock: ${p.stock === -1 || p.stock === undefined ? 'Unlimited' : p.stock}\n\nNaya stock number bhejo (-1 = unlimited):`, { parse_mode: 'Markdown' });
  });

  // ---- 🔗 Refer-Lock manager (free products) ----
  bot.action('admin_referlock', async (ctx) => {
    if (!(await needPerm(ctx, 'referlock'))) return;
    await ctx.answerCbQuery();
    const list = (await productsFor(ctx)).filter(([, p]) => p.price === 0);
    let text = `${ui.banner('🔗 REFER-LOCK', '✦ FREE PRODUCTS ✦')}\n\nFree product ko unlock karne ke liye user ko friends refer karne padte hain.\n\n`;
    text += list.length ? 'Product chuno:' : '_Koi FREE product nahi hai. Refer-lock sirf free products par lagta hai._';
    const rows = list.slice(0, 25).map(([id, p]) => [Markup.button.callback(`${p.name.slice(0, 26)} · ${p.referToUnlock > 0 ? '🔒 ' + p.referToUnlock : 'no lock'}`, `admin_rlset_${id}`)]);
    rows.push([Markup.button.callback('⬅️ Back', 'admin_home')]);
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) }); }
  });

  bot.action(/^admin_rlset_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'referlock'))) return;
    const p = await fb.getProduct(ctx.match[1]);
    if (!p || p.price !== 0 || !(await ownsProduct(ctx, p))) return ctx.answerCbQuery('⛔ Not allowed.', { show_alert: true });
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'rl_edit', data: { productId: ctx.match[1] } };
    await ctx.reply(`🔒 *${mdEscape(p.name)}*\nAbhi: ${p.referToUnlock > 0 ? p.referToUnlock + ' referrals' : 'koi lock nahi'}\n\nKitne referrals chahiye? (0 = lock hatao, max 100)`, { parse_mode: 'Markdown' });
  });

  // ---- 🔗 Share Links ----
  bot.action('admin_links', async (ctx) => {
    if (!(await needPerm(ctx, 'links'))) return;
    await ctx.answerCbQuery();
    const me = await botUsername();
    const live = (await productsFor(ctx)).filter(([, p]) => p.active);
    let text = `🔗 SHARE LINKS\n\n`;
    if (!live.length) text += 'Abhi koi live product nahi hai (approval ke baad link milega).';
    live.slice(0, 25).forEach(([id, p]) => { text += `📦 ${p.name} (${p.price === 0 ? 'FREE' : '₹' + p.price})\nhttps://t.me/${me}?start=PROD_${id}\n\n`; });
    await ctx.reply(text, { disable_web_page_preview: true, ...adminBackButton() });
  });

  // ---- 👤 My Profile ----
  bot.action('admin_myprofile', async (ctx) => {
    if (!(await isAdminOrStaff(ctx))) return;
    await ctx.answerCbQuery();
    const id = String(ctx.from.id);
    const s = await fb.getStaff(id);
    if (!s) return;
    const mine = (await productsFor(ctx));
    const gifts = Object.values(await fb.getAllOrders()).filter(o => o.paymentMethod === 'gift' && String(o.giftedBy) === id).length;
    const text = `${ui.banner('👤 MY PROFILE', '✦ STAFF ✦')}\n\n` +
      `✨ ${mdEscape(s.fullName || ctx.from.first_name || 'Staff')}\n🆔 \`${id}\`${s.phone ? `\n📱 \`${s.phone}\`` : ''}\n📅 Staff since: ${s.addedAt ? new Date(s.addedAt).toLocaleDateString() : '-'}\n📦 Products: ${mine.length}\n🎁 Gifts: ${gifts}\n\n` +
      `🔐 *Features:*\n${Object.entries(PERM_LABELS).map(([k, l]) => `${s.permissions.includes(k) ? '🔓' : '🔒'} ${l}`).join('\n')}`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...adminBackButton() });
  });

  // ---- 💬 Contact Owner ----
  const lastContact = {};
  bot.action('admin_contactowner', async (ctx) => {
    if (!(await isAdminOrStaff(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'staff_contact', data: {} };
    await ctx.reply('💬 Owner ko kya message bhejna hai? (jaise: kaunsa feature unlock karwana hai)');
  });

  // ---- coupon scope picker (staff) ----
  bot.action(/^admin_cpnscope_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'coupons'))) return;
    const st = adminState[ctx.from.id];
    if (!st || st.step !== 'coupon_scope') return ctx.answerCbQuery('Session expire — dobara Create Coupon dabao.', { show_alert: true });
    const pick = ctx.match[1];
    if (pick !== 'all') {
      const p = await fb.getProduct(pick);
      if (!p || !(await ownsProduct(ctx, p))) return ctx.answerCbQuery('⛔ Not allowed.', { show_alert: true });
    }
    st.data.productId = pick === 'all' ? null : pick;
    st.step = 'coupon_type';
    await ctx.answerCbQuery();
    const cfg = await fb.getStaffSettings();
    await ctx.reply(`Step 3/5 — Discount type? Reply "flat" (₹ amount) ya "percent" (max ${cfg.couponMaxPercent}%)`, Markup.keyboard(['flat', 'percent']).oneTime().resize());
  });

  // ---- Approve / reject staff-submitted products (owner only) ----
  bot.action(/^admin_approveprod_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const id = ctx.match[1];
    const p = await fb.getProduct(id);
    if (!p) return ctx.answerCbQuery('Product not found (deleted?).', { show_alert: true });
    if (p.approvalStatus !== 'pending') return ctx.answerCbQuery('Yeh pehle hi handle ho chuka hai.', { show_alert: true });
    // createdAt refreshed + notifiedNewProduct reset => the existing "new product"
    // broadcaster announces it to all users right after approval.
    await fb.updateProduct(id, { active: true, approvalStatus: 'approved', approvedBy: String(ctx.from.id), approvedAt: Date.now(), createdAt: Date.now(), notifiedNewProduct: false });
    await ctx.answerCbQuery('✅ Approved');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await ctx.reply(ui.productApproved(p.name), { parse_mode: 'Markdown' });
    if (p.submittedBy) {
      try { await bot.telegram.sendMessage(p.submittedBy, ui.productApproved(p.name), { parse_mode: 'Markdown' }); } catch (e) {}
    }
  });

  bot.action(/^admin_rejectprod_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const id = ctx.match[1];
    const p = await fb.getProduct(id);
    if (!p) return ctx.answerCbQuery('Product not found (deleted?).', { show_alert: true });
    if (p.approvalStatus !== 'pending') return ctx.answerCbQuery('Yeh pehle hi handle ho chuka hai.', { show_alert: true });
    await fb.updateProduct(id, { active: false, approvalStatus: 'rejected', rejectedBy: String(ctx.from.id), rejectedAt: Date.now() });
    await ctx.answerCbQuery('❌ Rejected');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await ctx.reply(`❌ *${mdEscape(p.name)}* reject kar diya.`, { parse_mode: 'Markdown' });
    if (p.submittedBy) {
      try { await bot.telegram.sendMessage(p.submittedBy, ui.productRejected(p.name), { parse_mode: 'Markdown' }); } catch (e) {}
    }
  });

  bot.action(/^admin_prodlink_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const productId = ctx.match[1];
    const lp = await fb.getProduct(productId);
    if (!lp) return ctx.answerCbQuery('Not found.');
    if (!(await isOwner(ctx)) && !(String(lp.submittedBy) === String(ctx.from.id) && lp.approvalStatus === 'approved')) {
      return ctx.answerCbQuery('Link approval ke baad milega.', { show_alert: true });
    }
    await ctx.answerCbQuery();
    const botInfo = await bot.telegram.getMe();
    const link = `https://t.me/${botInfo.username}?start=PROD_${productId}`;
    await ctx.reply(`🔗 *Share Link*\n\n\`${link}\`\n\nTap to copy, or forward this message.`, { parse_mode: 'Markdown' });
  });

  bot.action(/^admin_delprod_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const productId = ctx.match[1];
    const p = await fb.getProduct(productId);
    if (!p) return ctx.answerCbQuery('Not found.');
    if (!canManageProduct(ctx, p)) return ctx.answerCbQuery('⛔ Approved product sirf owner delete kar sakta hai.', { show_alert: true });

    const orders = await fb.getAllOrders();
    const orderCount = Object.values(orders).filter(o => o.productId === productId).length;

    await ctx.answerCbQuery();
    const warning = orderCount > 0
      ? `⚠️ *${orderCount} user(s) purchased this product.*\n\nTheir order history keeps the product name, but re-download uses a saved snapshot — deleting is generally safe. Delete anyway?`
      : `Delete "${mdEscape(p.name)}" permanently?`;

    await ctx.reply(warning, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Yes, Delete', `admin_confirmdelprod_${productId}`)],
        [Markup.button.callback('❌ Cancel', `admin_prod_${productId}`)]
      ])
    });
  });

  bot.action(/^admin_confirmdelprod_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const productId = ctx.match[1];
    const dp = await fb.getProduct(productId);
    if (dp && !canManageProduct(ctx, dp)) return ctx.answerCbQuery('⛔ Not allowed.', { show_alert: true });
    await fb.deleteProduct(productId);
    await ctx.answerCbQuery('🗑️ Deleted');
    await ctx.editMessageText('🗑️ Product deleted.', adminBackButton('admin_products'));
  });

  // ---- Add / Edit product flow (conversational) ----

  bot.action('admin_addproduct', async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    if (!(await isOwner(ctx))) {
      const cfg = await fb.getStaffSettings();
      if (cfg.maxProducts > 0) {
        const mine = Object.values(await fb.getAllProducts(false)).filter(p => String(p.submittedBy) === String(ctx.from.id)).length;
        if (mine >= cfg.maxProducts) return ctx.answerCbQuery(`Aapki limit ${cfg.maxProducts} products ki hai. Owner se baat karo.`, { show_alert: true });
      }
    }
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'prod_name', data: { isEdit: false } };
    await ctx.reply('📦 *Add Product*\n\nStep 1/8 — Product name?', { parse_mode: 'Markdown' });
  });

  // ============ PER-FIELD PRODUCT EDIT MENU ============
  // Tap "Edit" on a product -> menu where every field (name, category, price,
  // description, stock, file, link, photos) is changed on its own. The old
  // step-by-step wizard is still available as "Full Edit".

  async function sendProductEditMenu(ctx, productId, note) {
    const p = await fb.getProduct(productId);
    if (!p) return ctx.reply('⚠️ Product nahi mila.');
    const owner = await isOwner(ctx);
    const imgs = (Array.isArray(p.imageFileIds) && p.imageFileIds.length) ? p.imageFileIds.length : (p.imageFileId ? 1 : 0);
    const delivery = p.deliveryType === 'file'
      ? (p.fileId ? '📎 Delivery: File set ✅' : '📎 Delivery: File missing ⚠️')
      : (p.deliveryLink ? `🔗 Delivery: ${mdEscape(String(p.deliveryLink).slice(0, 60))}` : '🔗 Delivery: Link missing ⚠️');
    let text = `${note ? note + '\n\n' : ''}✏️ *Edit Product*\n\n📦 *${mdEscape(p.name)}*\n💰 Price: ₹${p.price}\n📁 Category: ${mdEscape(p.category || '-')}\n📦 Stock: ${p.stock === -1 || p.stock === undefined ? 'Unlimited' : p.stock}\n${delivery}\n🖼 Photos: ${imgs}\n\nKya change karna hai? Ek ek cheez alag se edit karo 👇`;
    if (!owner) text += '\n\n_Edit ke baad product owner approval ke liye wapas jayega._';
    const id = productId;
    const rows = [
      [Markup.button.callback('✏️ Edit Name', `admin_pe_name_${id}`), Markup.button.callback('📁 Edit Category', `admin_pe_cat_${id}`)],
      [Markup.button.callback('💰 Edit Price', `admin_pe_price_${id}`), Markup.button.callback('📝 Edit Description', `admin_pe_desc_${id}`)],
      [Markup.button.callback('📦 Edit Stock', `admin_pe_stock_${id}`), Markup.button.callback('🖼 Edit Photos', `admin_pe_photos_${id}`)],
      [Markup.button.callback('📎 Edit File', `admin_pe_file_${id}`), Markup.button.callback('🔗 Edit Link', `admin_pe_link_${id}`)],
      [Markup.button.callback('👁 Show File', `admin_pe_showfile_${id}`), Markup.button.callback('🖼 Show Photos', `admin_pe_showphotos_${id}`)],
      [Markup.button.callback('🧙 Full Edit (step by step)', `admin_editprodfull_${id}`)],
      [Markup.button.callback('⬅️ Back', `admin_prod_${id}`)]
    ];
    return ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) });
  }

  // Saves one edited field. Owner: applied instantly. Staff: product goes back to owner approval.
  async function applyProductEdit(ctx, productId, updates, label) {
    const existing = await fb.getProduct(productId);
    if (!existing) { delete adminState[ctx.from.id]; await ctx.reply('⚠️ Product nahi mila.'); return false; }
    const owner = await isOwner(ctx);
    if (!owner && !staffCanEdit(ctx, existing)) {
      delete adminState[ctx.from.id];
      await ctx.reply('⛔ Aap is product ko edit nahi kar sakte.');
      return false;
    }
    if (owner) {
      await fb.updateProduct(productId, updates);
    } else {
      const upd = await fb.updateProduct(productId, { ...updates, active: false, approvalStatus: 'pending', resubmittedAt: Date.now() });
      await notifyOwnersOfSubmission(productId, upd, true);
    }
    delete adminState[ctx.from.id];
    await sendProductEditMenu(ctx, productId, `✅ ${label} updated${owner ? '' : '\n⏳ Owner ke approval ke baad hi live hoga.'}`);
    return true;
  }

  bot.action(/^admin_editprod_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const productId = ctx.match[1];
    const p = await fb.getProduct(productId);
    if (!p) return ctx.answerCbQuery('Not found.');
    if (!canManageProduct(ctx, p)) return ctx.answerCbQuery('⛔ Approved product sirf owner edit kar sakta hai.', { show_alert: true });
    await ctx.answerCbQuery();
    delete adminState[ctx.from.id];
    await sendProductEditMenu(ctx, productId);
  });

  bot.action(/^admin_pe_cancel_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    await ctx.answerCbQuery('Cancelled');
    delete adminState[ctx.from.id];
    await sendProductEditMenu(ctx, ctx.match[1], '❌ Cancelled.');
  });

  bot.action(/^admin_pe_(name|cat|price|desc|stock|file|link|photos|showfile|showphotos)_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const field = ctx.match[1];
    const productId = ctx.match[2];
    const p = await fb.getProduct(productId);
    if (!p) return ctx.answerCbQuery('Not found.');
    if (!canManageProduct(ctx, p)) return ctx.answerCbQuery('⛔ Approved product sirf owner edit kar sakta hai.', { show_alert: true });
    await ctx.answerCbQuery();

    // ---- view-only buttons ----
    if (field === 'showfile') {
      if (p.deliveryType === 'file' && p.fileId) {
        try { await bot.telegram.sendDocument(ctx.from.id, p.fileId, { caption: `📎 Current file — ${p.name}` }); }
        catch (e) { await ctx.reply('⚠️ File bhej nahi paya (file_id invalid ho sakta hai). Naya file upload karo.'); }
      } else if (p.deliveryType === 'link' && p.deliveryLink) {
        await ctx.reply(`🔗 Current link:\n${p.deliveryLink}`, { disable_web_page_preview: true });
      } else {
        await ctx.reply('⚠️ Is product mein abhi koi file/link set nahi hai.');
      }
      return;
    }
    if (field === 'showphotos') {
      const ids = ((Array.isArray(p.imageFileIds) && p.imageFileIds.length) ? p.imageFileIds : [p.imageFileId]).filter(Boolean);
      if (!ids.length) return ctx.reply('🖼 Is product mein abhi koi photo nahi hai.');
      try {
        if (ids.length === 1) await bot.telegram.sendPhoto(ctx.from.id, ids[0], { caption: `🖼 ${p.name}` });
        else await bot.telegram.sendMediaGroup(ctx.from.id, ids.slice(0, 10).map(id => ({ type: 'photo', media: id })));
      } catch (e) { await ctx.reply('⚠️ Photos bhej nahi paya. Naye photos upload karo.'); }
      return;
    }

    // ---- edit buttons: remember which field is being edited ----
    const cancelKb = Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', `admin_pe_cancel_${productId}`)]]);
    const prompts = {
      name: ['pedit_name', `✏️ *Edit Name*\nAbhi: ${mdEscape(p.name)}\n\nNaya naam bhejo:`],
      cat: ['pedit_category', `📁 *Edit Category*\nAbhi: ${mdEscape(p.category || '-')}\n\nNayi category bhejo:`],
      price: ['pedit_price', `💰 *Edit Price*\nAbhi: ₹${p.price}\n\nNaya price bhejo (₹, 0 = free):`],
      desc: ['pedit_desc', `📝 *Edit Description*\nAbhi: ${mdEscape(p.description || '-')}\n\nNayi description bhejo (ya \`-\` bhejo description hatane ke liye):`],
      stock: ['pedit_stock', `📦 *Edit Stock*\nAbhi: ${p.stock === -1 || p.stock === undefined ? 'Unlimited' : p.stock}\n\nNaya stock number bhejo (-1 = unlimited):`],
      file: ['pedit_file', `📎 *Edit File*\nNayi delivery FILE (as document) bhejo. Purani file replace ho jayegi.`],
      link: ['pedit_link', `🔗 *Edit Link*\nAbhi: ${p.deliveryType === 'link' && p.deliveryLink ? mdEscape(p.deliveryLink) : '-'}\n\nNaya download link (URL) bhejo:`],
      photos: ['pedit_photos', `🖼 *Edit Photos*\nNayi photo(s) bhejo — ek ya album. Purani saari photos replace ho jayengi.\n\nSabhi photos hatane ke liye \`remove\` likho.`]
    };
    const [step, text] = prompts[field];
    adminState[ctx.from.id] = { step, data: { productId } };
    await ctx.reply(text, { parse_mode: 'Markdown', ...cancelKb });
  });

  async function handleProductEditText(ctx, state, text) {
    const productId = state.data.productId;
    if (text.toLowerCase() === 'cancel') {
      delete adminState[ctx.from.id];
      await sendProductEditMenu(ctx, productId, '❌ Cancelled.');
      return true;
    }
    switch (state.step) {
      case 'pedit_name':
        if (!text || text.length > 100) { await ctx.reply('⚠️ Naam 1-100 characters ka hona chahiye.'); return true; }
        await applyProductEdit(ctx, productId, { name: text }, 'Name');
        return true;
      case 'pedit_category':
        if (!text || text.length > 50) { await ctx.reply('⚠️ Category 1-50 characters ki honi chahiye.'); return true; }
        await applyProductEdit(ctx, productId, { category: text }, 'Category');
        return true;
      case 'pedit_price': {
        const price = parseInt(text, 10);
        if (isNaN(price) || price < 0) { await ctx.reply('⚠️ Valid number daalo (0 ya usse zyada).'); return true; }
        const cur = await fb.getProduct(productId);
        await applyProductEdit(ctx, productId, { price, referToUnlock: price === 0 ? ((cur && cur.referToUnlock) || 0) : 0 }, 'Price');
        return true;
      }
      case 'pedit_desc':
        await applyProductEdit(ctx, productId, { description: text === '-' ? '' : text }, 'Description');
        return true;
      case 'pedit_stock': {
        const stock = parseInt(text, 10);
        if (isNaN(stock) || stock < -1) { await ctx.reply('⚠️ Valid number daalo (-1 = unlimited).'); return true; }
        await applyProductEdit(ctx, productId, { stock }, 'Stock');
        return true;
      }
      case 'pedit_link':
        if (!/^https?:\/\//i.test(text)) { await ctx.reply('⚠️ Valid link bhejo (http:// ya https:// se shuru hona chahiye).'); return true; }
        await applyProductEdit(ctx, productId, { deliveryType: 'link', deliveryLink: text, fileId: '' }, 'Link');
        return true;
      case 'pedit_file':
        await ctx.reply('⚠️ File ko *document* ki tarah bhejo (text nahi). Ya `cancel` likho.', { parse_mode: 'Markdown' });
        return true;
      case 'pedit_photos':
        if (text.toLowerCase() === 'remove') {
          await applyProductEdit(ctx, productId, { imageUrl: '', imageFileId: null, imageFileIds: null }, 'Photos (removed)');
          return true;
        }
        await ctx.reply('⚠️ Photo bhejo, ya `remove` / `cancel` likho.', { parse_mode: 'Markdown' });
        return true;
      default:
        return false;
    }
  }

  // Full step-by-step wizard (old behaviour)
  bot.action(/^admin_editprodfull_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'products'))) return;
    const productId = ctx.match[1];
    const p = await fb.getProduct(productId);
    if (!p) return ctx.answerCbQuery('Not found.');
    if (!canManageProduct(ctx, p)) return ctx.answerCbQuery('⛔ Approved product sirf owner edit kar sakta hai.', { show_alert: true });
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'prod_name', data: { isEdit: true, productId, ...p } };
    await ctx.reply(`✏️ *Edit Product*\n\nCurrent name: ${mdEscape(p.name)}\n\nStep 1/8 — New name? (or send "skip" to keep current)`, { parse_mode: 'Markdown' });
  });

  // ============ ORDERS ============

  bot.action('admin_orders', async (ctx) => {
    if (!(await needPerm(ctx, 'orders'))) return;
    await ctx.answerCbQuery();
    await sendOrdersMenu(ctx, 'all', 0);
  });

  async function sendOrdersMenu(ctx, filter = 'all', page = 0) {
    const ownerView = await isOwner(ctx);
    const orders = await fb.getAllOrders();
    let list = Object.entries(orders).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    if (!ownerView) {
      const mine = new Set(Object.entries(await fb.getAllProducts(false)).filter(([, p]) => String(p.submittedBy) === String(ctx.from.id)).map(([k]) => k));
      list = list.filter(([, o]) => mine.has(o.productId) && o.paymentMethod !== 'gift');
    }
    if (filter !== 'all') list = list.filter(([, o]) => o.status === filter);

    const pageSize = 10;
    const pageItems = list.slice(page * pageSize, (page + 1) * pageSize);

    let text = `🧾 *Orders* (${list.length}${filter !== 'all' ? ` ${filter}` : ''})\n\nTap any order for full details:`;
    if (list.length === 0) text += '\n\n_No orders in this category._';

    const buttons = [
      [
        Markup.button.callback('All', 'admin_orderf_all'),
        Markup.button.callback('✅ Success', 'admin_orderf_delivered'),
        Markup.button.callback('⏳ Pending', 'admin_orderf_pending')
      ],
      [
        Markup.button.callback('❌ Failed', 'admin_orderf_failed'),
        Markup.button.callback('↩️ Refunded', 'admin_orderf_refunded')
      ]
    ];

    pageItems.forEach(([id, o]) => {
      const emoji = o.status === 'delivered' ? '✅' : o.status === 'pending' ? '⏳' : o.status === 'failed' ? '❌' : o.status === 'refunded' ? '↩️' : '🔄';
      const label = ownerView ? `${emoji} ${o.productName} — ₹${o.amount} (${o.userId})` : `${emoji} ${o.productName} — ₹${o.amount}`;
      buttons.push([Markup.button.callback(label.slice(0, 60), `admin_orderdetail_${id}`)]);
    });

    const navRow = [];
    if (page > 0) navRow.push(Markup.button.callback('⬅️ Prev', `admin_orderpage_${filter}_${page - 1}`));
    if ((page + 1) * pageSize < list.length) navRow.push(Markup.button.callback('Next ➡️', `admin_orderpage_${filter}_${page + 1}`));
    if (navRow.length) buttons.push(navRow);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action(/^admin_orderf_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'orders'))) return;
    await ctx.answerCbQuery();
    await sendOrdersMenu(ctx, ctx.match[1], 0);
  });

  bot.action(/^admin_orderpage_(\w+)_(\d+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'orders'))) return;
    await ctx.answerCbQuery();
    await sendOrdersMenu(ctx, ctx.match[1], parseInt(ctx.match[2]));
  });

  bot.action(/^admin_orderdetail_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'orders'))) return;
    const orderId = ctx.match[1];
    const o = await fb.getOrder(orderId);
    if (!o) return ctx.answerCbQuery('Not found.');
    const ownerView = await isOwner(ctx);
    if (!ownerView) {
      const op = await fb.getProduct(o.productId);
      if (!op || String(op.submittedBy) !== String(ctx.from.id)) return ctx.answerCbQuery('⛔ Yeh aapke product ka order nahi hai.', { show_alert: true });
    }
    await ctx.answerCbQuery();

    const emoji = o.status === 'delivered' ? '✅' : o.status === 'pending' ? '⏳' : o.status === 'failed' ? '❌' : o.status === 'refunded' ? '↩️' : '🔄';
    let text = `${emoji} *Order Details*\n\n`;
    text += `📦 Product: ${mdEscape(o.productName)}\n`;
    text += `💰 Amount: ₹${o.amount}${o.originalAmount && o.originalAmount !== o.amount ? ` (original ₹${o.originalAmount})` : ''}\n`;
    if (ownerView) text += `👤 User: \`${o.userId}\`\n`;
    text += `💳 Method: ${o.paymentMethod || 'unknown'}\n`;
    text += `📊 Status: ${o.status}\n`;
    if (o.utr) text += `🔢 UTR: \`${o.utr}\`\n`;
    if (o.couponUsed) text += `🎟 Coupon: \`${o.couponUsed}\`\n`;
    if (o.refundStatus) text += `↩️ Refund: ${o.refundStatus}\n`;
    text += `📅 Created: ${o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}\n`;
    if (o.deliveredAt) text += `📬 Delivered: ${new Date(o.deliveredAt).toLocaleString()}\n`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        ...(ownerView ? [[Markup.button.callback('👤 View User', `admin_viewuser_${o.userId}`)]] : []),
        [Markup.button.callback('⬅️ Back to Orders', 'admin_orders')]
      ])
    });
  });

  // ============ USERS ============

  bot.action('admin_users', async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    await ctx.answerCbQuery();
    await sendUsersList(ctx, 0);
  });

  async function sendUsersList(ctx, page) {
    const users = await fb.getAllUsers();
    const entries = Object.entries(users).sort((a, b) => (b[1].joinedAt || 0) - (a[1].joinedAt || 0));
    const pageSize = 8;
    const pageItems = entries.slice(page * pageSize, (page + 1) * pageSize);

    let text = `👥 *Users* (${entries.length} total)\n\nTap a user to view full details:`;

    const buttons = pageItems.map(([id, u]) => {
      const label = `${u.banned ? '🚫 ' : ''}${u.name || 'Unknown'}${u.username ? ' (@' + u.username + ')' : ''} — ₹${u.walletBalance || 0}`;
      return [Markup.button.callback(label.slice(0, 60), `admin_viewuser_${id}`)];
    });

    const navRow = [];
    if (page > 0) navRow.push(Markup.button.callback('⬅️ Prev', `admin_userspage_${page - 1}`));
    if ((page + 1) * pageSize < entries.length) navRow.push(Markup.button.callback('Next ➡️', `admin_userspage_${page + 1}`));
    if (navRow.length) buttons.push(navRow);
    buttons.push([Markup.button.callback('🔍 Search by ID', 'admin_usersearch')]);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action(/^admin_userspage_(\d+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    await ctx.answerCbQuery();
    await sendUsersList(ctx, parseInt(ctx.match[1]));
  });

  bot.action(/^admin_viewuser_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    await ctx.answerCbQuery();
    await sendUserDetails(ctx, ctx.match[1]);
  });

  bot.action('admin_usersearch', async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_user_lookup' };
    await ctx.reply('🔍 Send a Telegram ID to view details:', adminBackButton('admin_users'));
  });

  async function sendUserDetails(ctx, telegramId) {
    const analytics = await fb.getUserAnalytics(telegramId);
    if (!analytics) return ctx.reply('⚠️ User not found.');

    const isVip = analytics.isVip && analytics.vipExpiresAt > Date.now();
    const orders = await fb.getUserOrders(telegramId);
    const orderList = Object.values(orders).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const statusCounts = {};
    orderList.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const statusLine = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(', ') || 'none';

    let text = `👤 *${mdEscape(analytics.name)}* ${analytics.username ? '(@' + mdEscape(analytics.username) + ')' : ''}\n\n`;
    text += `🆔 Telegram ID: \`${telegramId}\`\n`;
    text += `📅 Joined: ${analytics.joinedAt ? new Date(analytics.joinedAt).toLocaleDateString() : 'unknown'}\n`;
    text += `💰 Wallet Balance: ₹${analytics.walletBalance || 0}\n`;
    text += `📦 Total Orders: ${analytics.totalOrders} (${statusLine})\n`;
    text += `💎 Total Spent: ₹${analytics.totalSpent}\n`;
    text += `🔗 Referral Code: \`${analytics.referralCode || 'none'}\`\n`;
    text += `👥 Referred By: ${analytics.referredBy ? '`' + analytics.referredBy + '`' : 'nobody (direct signup)'}\n`;
    text += `🤝 Users They Referred: ${analytics.referredCount}\n`;
    text += `🎯 Check-in Streak: ${analytics.checkInStreak || 0} days\n`;
    text += `${isVip ? `👑 VIP Active (expires ${new Date(analytics.vipExpiresAt).toLocaleDateString()})` : '👤 Not VIP'}\n`;
    text += `${analytics.banned ? `🚫 Banned — reason: ${mdEscape(analytics.banReason || 'not given')}` : '✅ Not banned'}\n`;

    if (orderList.length > 0) {
      text += `\n📋 *Recent Orders:*\n`;
      orderList.slice(0, 5).forEach(o => {
        const emoji = o.status === 'delivered' ? '✅' : o.status === 'pending' ? '⏳' : o.status === 'failed' ? '❌' : o.status === 'refunded' ? '↩️' : '🔄';
        text += `${emoji} ${mdEscape(o.productName)} — ₹${o.amount}\n`;
      });
    }

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Adjust Wallet', `admin_wallet_${telegramId}`)],
        [analytics.banned ? Markup.button.callback('✅ Unban', `admin_unban_${telegramId}`) : Markup.button.callback('🚫 Ban', `admin_banuser_${telegramId}`)],
        [Markup.button.callback('📩 Message', `admin_msguser_${telegramId}`)],
        [Markup.button.callback('⬅️ Back to List', 'admin_users')]
      ])
    });
  }

  bot.action(/^admin_wallet_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const telegramId = ctx.match[1];
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_wallet_amount', data: { telegramId } };
    await ctx.reply('💰 Enter new wallet balance (₹):');
  });

  bot.action(/^admin_banuser_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    const telegramId = ctx.match[1];
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_ban_reason', data: { telegramId } };
    await ctx.reply('🚫 Ban reason:');
  });

  bot.action(/^admin_unban_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    const telegramId = ctx.match[1];
    await fb.unbanUser(telegramId);
    await ctx.answerCbQuery('✅ Unbanned');
    await ctx.reply(`✅ User ${telegramId} unbanned.`);
  });

  bot.action(/^admin_msguser_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'users'))) return;
    const telegramId = ctx.match[1];
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'dm_message', data: { telegramId } };
    await ctx.reply('📩 Type the message to send:');
  });

  // ============ REFUNDS ============

  bot.action('admin_refunds', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendRefundsList(ctx);
  });

  async function sendRefundsList(ctx) {
    const orders = await fb.getAllOrders();
    const pending = Object.entries(orders).filter(([, o]) => o.refundStatus === 'requested');

    let text = `↩️ *Pending Refund Requests* (${pending.length})\n\n`;
    if (pending.length === 0) text += '_No pending refund requests._';

    const buttons = pending.slice(0, 15).map(([id, o]) => [
      Markup.button.callback(`${o.productName} — ₹${o.amount} (${o.userId})`, `admin_refund_${id}`)
    ]);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action(/^admin_refund_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const orderId = ctx.match[1];
    const order = await fb.getOrder(orderId);
    if (!order) return ctx.answerCbQuery('Not found.');
    await ctx.answerCbQuery();

    const text = `↩️ *Refund Request*\n\n📦 ${mdEscape(order.productName)}\n💰 ₹${order.amount}\n👤 User: \`${order.userId}\`\n📝 Reason: ${mdEscape(order.refundReason || 'not given')}`;
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Approve (refund to wallet)', `admin_approverefund_${orderId}`)],
        [Markup.button.callback('❌ Reject', `admin_rejectrefund_${orderId}`)],
        [Markup.button.callback('⬅️ Back', 'admin_refunds')]
      ])
    });
  });

  bot.action(/^admin_approverefund_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const orderId = ctx.match[1];
    await fb.processRefund(orderId, true);
    await ctx.answerCbQuery('✅ Refund approved');
    await ctx.editMessageText('✅ Refund approved and credited to user\'s wallet.', adminBackButton('admin_refunds'));
  });

  bot.action(/^admin_rejectrefund_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const orderId = ctx.match[1];
    await fb.processRefund(orderId, false);
    await ctx.answerCbQuery('❌ Refund rejected');
    await ctx.editMessageText('❌ Refund request rejected.', adminBackButton('admin_refunds'));
  });

  // ============ COUPONS ============

  bot.action('admin_coupons', async (ctx) => {
    if (!(await needPerm(ctx, 'coupons'))) return;
    await ctx.answerCbQuery();
    await sendCouponsList(ctx);
  });

  async function sendCouponsList(ctx) {
    const ownerView = await isOwner(ctx);
    const coupons = await fb.getAllCoupons();
    const entries = Object.entries(coupons).filter(([, c]) => ownerView || String(c.ownerStaffId) === String(ctx.from.id));

    let text = `🎟 *${ownerView ? 'Coupons' : 'My Coupons'}* (${entries.length})\n\n`;
    entries.forEach(([code, c]) => {
      const scope = c.ownerStaffId ? (c.productId ? ' 📦 1 product' : ' 📦 all own') + (ownerView ? ' 🧑‍💼 staff' : '') : '';
      text += `${c.active ? '✅' : '🚫'} \`${code}\` — ${c.discountType === 'percent' ? c.discountValue + '%' : '₹' + c.discountValue} off (used ${c.usedCount || 0}${c.usageLimit ? '/' + c.usageLimit : ''})${scope}\n`;
    });
    if (entries.length === 0) text += '_No coupons yet._';

    const buttons = [[Markup.button.callback('➕ Create Coupon', 'admin_addcoupon')]];
    entries.forEach(([code]) => {
      buttons.push([Markup.button.callback(`${code}`, `admin_coupon_${code}`)]);
    });
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action(/^admin_coupon_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'coupons'))) return;
    const code = ctx.match[1];
    const coupon = await fb.getCoupon(code);
    if (!coupon) return ctx.answerCbQuery('Not found.');
    if (!(await isOwner(ctx)) && String(coupon.ownerStaffId) !== String(ctx.from.id)) return ctx.answerCbQuery('⛔ Yeh aapka coupon nahi hai.', { show_alert: true });
    await ctx.answerCbQuery();
    await ctx.reply(`🎟 \`${code}\`\n\n${coupon.active ? '✅ Active' : '🚫 Disabled'}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback(coupon.active ? '🚫 Disable' : '✅ Enable', `admin_togglecoupon_${code}`)],
        [Markup.button.callback('⬅️ Back', 'admin_coupons')]
      ])
    });
  });

  bot.action(/^admin_togglecoupon_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'coupons'))) return;
    const code = ctx.match[1];
    const coupon = await fb.getCoupon(code);
    if (!coupon) return ctx.answerCbQuery('Not found.');
    if (!(await isOwner(ctx)) && String(coupon.ownerStaffId) !== String(ctx.from.id)) return ctx.answerCbQuery('⛔ Yeh aapka coupon nahi hai.', { show_alert: true });
    await fb.toggleCoupon(code, !coupon.active);
    await ctx.answerCbQuery(coupon.active ? '🚫 Disabled' : '✅ Enabled');
    await sendCouponsList(ctx);
  });

  bot.action('admin_addcoupon', async (ctx) => {
    if (!(await needPerm(ctx, 'coupons'))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'coupon_code', data: {} };
    await ctx.reply('🎟 *New Coupon*\n\nStep 1/4 — Coupon code? (e.g. WELCOME50)', { parse_mode: 'Markdown' });
  });

  // ============ REFERRAL SETTINGS ============

  bot.action('admin_referral', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const settings = await fb.getReferralSettings();
    await ctx.reply(
      `🔗 *Referral Settings*\n\nBonus Type: ${settings.bonusType}\nBonus Amount: ${settings.bonusType === 'percent' ? settings.bonusAmount + '%' : '₹' + settings.bonusAmount}`,
      { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✏️ Edit', 'admin_editreferral')], [Markup.button.callback('⬅️ Back', 'admin_home')]]) }
    );
  });

  bot.action('admin_editreferral', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'referral_type', data: {} };
    await ctx.reply('Bonus type? Reply "flat" (₹) or "percent" (%)', Markup.keyboard(['flat', 'percent']).oneTime().resize());
  });

  // ============ BROADCAST ============

  bot.action('admin_broadcast', async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'bc_message', data: {} };
    await ctx.reply('📢 *Broadcast*\n\nType the message to send to all users:', { parse_mode: 'Markdown', ...adminBackButton('admin_home') });
  });

  // ============ DIRECT MESSAGE ============

  bot.action('admin_dm', async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    await ctx.answerCbQuery();
    await sendDmUserPicker(ctx, 0);
  });

  async function sendDmUserPicker(ctx, page) {
    const users = await fb.getAllUsers();
    const entries = Object.entries(users).sort((a, b) => (b[1].joinedAt || 0) - (a[1].joinedAt || 0));
    const pageSize = 8;
    const pageItems = entries.slice(page * pageSize, (page + 1) * pageSize);

    let text = `📩 *Direct Message*\n\nSelect a user to message (${entries.length} total):`;

    const buttons = pageItems.map(([id, u]) => {
      const label = `${u.name || 'Unknown'}${u.username ? ' (@' + u.username + ')' : ''} — \`${id}\``;
      return [Markup.button.callback(label.replace(/`/g, '').slice(0, 60), `admin_dmpick_${id}`)];
    });

    const navRow = [];
    if (page > 0) navRow.push(Markup.button.callback('⬅️ Prev', `admin_dmpage_${page - 1}`));
    if ((page + 1) * pageSize < entries.length) navRow.push(Markup.button.callback('Next ➡️', `admin_dmpage_${page + 1}`));
    if (navRow.length) buttons.push(navRow);
    buttons.push([Markup.button.callback('🔍 Search by ID instead', 'admin_dmbyid')]);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action(/^admin_dmpage_(\d+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    await ctx.answerCbQuery();
    await sendDmUserPicker(ctx, parseInt(ctx.match[1]));
  });

  bot.action(/^admin_dmpick_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    const telegramId = ctx.match[1];
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'dm_message', data: { telegramId } };
    await ctx.reply(`📩 Message for \`${telegramId}\`? Type it now:`, { parse_mode: 'Markdown' });
  });

  bot.action('admin_dmbyid', async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'dm_userid', data: {} };
    await ctx.reply('📩 Enter the Telegram ID to message:', adminBackButton('admin_dm'));
  });

  // ============ BOT SETTINGS ============

  bot.action('admin_settings', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const settings = await fb.getBotSettings();
    const text = `⚙️ *Bot Settings*\n\n🛠 Maintenance: ${settings.maintenanceMode ? 'ON 🔴' : 'OFF 🟢'}\n📢 Required Channels: ${(settings.channels || []).filter(c => c.required).length}\n💬 Support TG: ${settings.supportTelegram ? '@' + mdEscape(settings.supportTelegram) : 'not set'}\n📱 Support WA: ${settings.supportWhatsapp || 'not set'}`;

    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✏️ Welcome Message', 'admin_setwelcome')],
          [Markup.button.callback('🎨 Apply Decorated Welcome', 'admin_welcomestyle')],
          [Markup.button.callback(settings.maintenanceMode ? '🟢 Disable Maintenance' : '🔴 Enable Maintenance', 'admin_togglemaintenance')],
          [Markup.button.callback('📢 Manage Channels', 'admin_channels')],
          [Markup.button.callback('💬 Set Support Info', 'admin_setsupport')],
          [Markup.button.callback('💳 Payment Settings', 'admin_paymentsettings')],
          [Markup.button.callback('⬅️ Back', 'admin_home')]
        ])
      });
    } catch (e) { await ctx.reply(text, { parse_mode: 'Markdown' }); }
  });

  // ============ PAYMENT SETTINGS (FamPay) ============

  bot.action('admin_paymentsettings', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendPaymentSettingsMenu(ctx);
  });

  async function sendPaymentSettingsMenu(ctx) {
    const s = await fb.getPaymentSettings();
    const maskedKey = s.apiKey ? s.apiKey.slice(0, 12) + '...' + s.apiKey.slice(-4) : 'not set';
    const text = `💳 *Payment Settings (PayX)*\n\n🔑 PayX API Key: \`${maskedKey}\`\n🌐 PayX Server URL: ${mdEscape(s.baseUrl)}\n💰 UPI ID: \`${s.upiId || 'not set'}\`\n📜 T&C: ${s.termsAndConditions ? 'set' : 'not set'}`;

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('🔑 Edit API Key', 'admin_editfamkey')],
      [Markup.button.callback('🌐 Edit Base URL', 'admin_editfamurl')],
      [Markup.button.callback('💰 Edit UPI ID', 'admin_editfamupi')],
      [Markup.button.callback('📜 Edit Terms & Conditions', 'admin_editfamtc')],
      [Markup.button.callback('⬅️ Back', 'admin_settings')]
    ]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...buttons }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...buttons }); }
  }

  bot.action('admin_editfamkey', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_fam_apikey' };
    await ctx.reply('🔑 Send the new FamPay API key:');
  });

  bot.action('admin_editfamurl', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_fam_baseurl' };
    await ctx.reply('🌐 Send the new FamPay base URL:');
  });

  bot.action('admin_editfamupi', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_fam_upi' };
    await ctx.reply('💰 Send the new UPI ID (e.g. yourname@fam):');
  });

  bot.action('admin_editfamtc', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_fam_tc' };
    await ctx.reply('📜 Send the new Terms & Conditions text (shown to users before every payment). Markdown formatting supported:');
  });

  bot.action('admin_welcomestyle', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await fb.updateBotSettings({ welcomeMessage: ui.welcomeTemplate() });
    await ctx.answerCbQuery('✅ Decorated welcome applied');
    await ctx.reply(`✅ Welcome message ab decorated style mein hai. Preview:\n\n${ui.welcomeTemplate().replace('{name}', ctx.from.first_name || 'Friend')}`, { parse_mode: 'Markdown' });
  });

  bot.action('admin_setwelcome', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_welcome_message' };
    await ctx.reply('✏️ Send the new welcome message. Use {name} for the user\'s first name:');
  });

  bot.action('admin_togglemaintenance', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const settings = await fb.getBotSettings();
    await fb.updateBotSettings({ maintenanceMode: !settings.maintenanceMode });
    await ctx.answerCbQuery(settings.maintenanceMode ? '🟢 Maintenance OFF' : '🔴 Maintenance ON');
  });

  bot.action('admin_channels', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendChannelsMenu(ctx);
  });

  async function sendChannelsMenu(ctx) {
    const settings = await fb.getBotSettings();
    const channels = settings.channels || [];
    let text = '📢 *Required Channels*\n\n';
    if (channels.length === 0) text += '_None set._';

    const buttons = channels.map((c, i) => [
      Markup.button.callback(`${c.required ? '✅' : '⬜'} @${c.username}`, `admin_togglechannel_${i}`),
      Markup.button.callback('🗑', `admin_removechannel_${i}`)
    ]);
    buttons.push([Markup.button.callback('➕ Add Channel', 'admin_addchannel')]);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_settings')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action('admin_addchannel', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_channel_username', data: {} };
    await ctx.reply('Send a channel username (without @) to add it as required. Make sure the bot is an admin in that channel!');
  });

  bot.action(/^admin_togglechannel_(\d+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const idx = parseInt(ctx.match[1]);
    const settings = await fb.getBotSettings();
    const channels = settings.channels || [];
    if (channels[idx]) channels[idx].required = !channels[idx].required;
    await fb.updateBotSettings({ channels });
    await ctx.answerCbQuery('Updated');
    await sendChannelsMenu(ctx);
  });

  bot.action(/^admin_removechannel_(\d+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const idx = parseInt(ctx.match[1]);
    const settings = await fb.getBotSettings();
    const channels = settings.channels || [];
    channels.splice(idx, 1);
    await fb.updateBotSettings({ channels });
    await ctx.answerCbQuery('🗑️ Removed');
    await sendChannelsMenu(ctx);
  });

  bot.action('admin_setsupport', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_support_telegram', data: {} };
    await ctx.reply('💬 Send support Telegram username (without @), or "skip":');
  });

  // ============ MENU BUTTONS MANAGER ============

  const MENU_LABEL_KEYS = {
    profile: '👤 My Profile', browse: '🛍 Browse Products', free: '🎁 Free Products',
    proplan: '👑 Pro Plan', purchases: '📦 My Purchases', orders: '📋 Order Status',
    referrals: '🔗 My Referrals', stats: '📊 My Stats', paymenthistory: '🧾 Payment History',
    support: '📞 Support', language: '🌐 Hindi / English', checkin: '🎯 Daily Check-in',
    leaderboard: '🏆 Leaderboard'
  };

  bot.action('admin_menubuttons', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendMenuButtonsMenu(ctx);
  });

  async function sendMenuButtonsMenu(ctx) {
    const settings = await fb.getBotSettings();
    const customButtons = settings.menuCustomButtons || [];

    let text = '🔘 *Menu Buttons Manager*\n\nRename any built-in button, or add unlimited custom link buttons to the main menu.';

    const buttons = [
      [Markup.button.callback('✏️ Rename Built-in Buttons', 'admin_renamebuttons')],
      [Markup.button.callback('➕ Add Custom Link Button', 'admin_addmenubutton')]
    ];
    customButtons.forEach((btn, i) => {
      buttons.push([Markup.button.callback(`🔗 ${btn.text}`, 'noop'), Markup.button.callback('🗑', `admin_removemenubutton_${i}`)]);
    });
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action('noop', async (ctx) => { await ctx.answerCbQuery(); });

  bot.action('admin_renamebuttons', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const settings = await fb.getBotSettings();
    const labels = { ...MENU_LABEL_KEYS, ...(settings.menuLabels || {}) };

    const buttons = Object.keys(MENU_LABEL_KEYS).map(key => [Markup.button.callback(labels[key], `admin_renamebtn_${key}`)]);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_menubuttons')]);
    await ctx.reply('Tap a button to rename it:', Markup.inlineKeyboard(buttons));
  });

  bot.action(/^admin_renamebtn_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const key = ctx.match[1];
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_button_rename', data: { key } };
    await ctx.reply(`New label for this button? (include emoji if you want one)`);
  });

  bot.action('admin_addmenubutton', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'menubutton_text', data: {} };
    await ctx.reply('🔗 Button text? (e.g. "Join Community")');
  });

  bot.action(/^admin_removemenubutton_(\d+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const idx = parseInt(ctx.match[1]);
    const settings = await fb.getBotSettings();
    const customButtons = settings.menuCustomButtons || [];
    customButtons.splice(idx, 1);
    await fb.updateBotSettings({ menuCustomButtons: customButtons });
    await ctx.answerCbQuery('🗑️ Removed');
    await sendMenuButtonsMenu(ctx);
  });

  // ============ DAILY CHECK-IN SETTINGS ============

  bot.action('admin_checkin', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const settings = await fb.getCheckInSettings();
    await ctx.reply(
      `🎯 *Daily Check-in*\n\nStatus: ${settings.active ? '✅ Active' : '🚫 Disabled'}\nBase Reward: ₹${settings.rewardAmount}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(settings.active ? '🚫 Disable' : '✅ Enable', 'admin_togglecheckin')],
          [Markup.button.callback('✏️ Edit Reward', 'admin_editcheckinreward')],
          [Markup.button.callback('⬅️ Back', 'admin_home')]
        ])
      }
    );
  });

  bot.action('admin_togglecheckin', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const settings = await fb.getCheckInSettings();
    await fb.setCheckInSettings({ ...settings, active: !settings.active });
    await ctx.answerCbQuery(settings.active ? '🚫 Disabled' : '✅ Enabled');
  });

  bot.action('admin_editcheckinreward', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_checkin_reward', data: {} };
    await ctx.reply('💰 New base reward amount (₹)?');
  });

  // ============ MESSAGE HISTORY ============

  bot.action('admin_msghistory', async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    await ctx.answerCbQuery();
    await ctx.reply('📜 *Message History*\n\nChoose which history to view:', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📩 DM History', 'admin_dmhistory_0')],
        [Markup.button.callback('📢 Broadcast History', 'admin_bchistory_0')],
        [Markup.button.callback('⬅️ Back', 'admin_home')]
      ])
    });
  });

  bot.action(/^admin_dmhistory_(\d+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    const page = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    const queue = await fb.getDmQueue();
    const entries = Object.entries(queue).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    const pageSize = 5;
    const pageItems = entries.slice(page * pageSize, (page + 1) * pageSize);

    let text = `📩 *DM History* (${entries.length} total)\n\n`;
    if (pageItems.length === 0) text += '_No messages yet._';
    const buttons = [];
    pageItems.forEach(([id, d]) => {
      const status = d.sent ? (d.success !== false ? '✅' : '❌') : '⏳';
      const seen = d.seen ? '👁' : '';
      text += `${status}${seen} \`${d.userId}\` — ${(d.message || '').slice(0, 40)}\n`;
      if (d.sentChatId && !d.deleted) buttons.push([Markup.button.callback(`🗑 Unsend to ${d.userId}`, `admin_unsenddm_${id}`)]);
    });
    const navRow = [];
    if (page > 0) navRow.push(Markup.button.callback('⬅️ Prev', `admin_dmhistory_${page - 1}`));
    if ((page + 1) * pageSize < entries.length) navRow.push(Markup.button.callback('Next ➡️', `admin_dmhistory_${page + 1}`));
    if (navRow.length) buttons.push(navRow);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_msghistory')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  });

  bot.action(/^admin_unsenddm_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    const id = ctx.match[1];
    await fb.updateDmEntry(id, { deleteRequested: true });
    await ctx.answerCbQuery('📤 Unsend requested — processing...');
  });

  bot.action(/^admin_bchistory_(\d+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    const page = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    const queue = await fb.getBroadcastQueue();
    const entries = Object.entries(queue).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    const pageSize = 5;
    const pageItems = entries.slice(page * pageSize, (page + 1) * pageSize);

    let text = `📢 *Broadcast History* (${entries.length} total)\n\n`;
    if (pageItems.length === 0) text += '_No broadcasts yet._';
    const buttons = [];
    pageItems.forEach(([id, b]) => {
      const status = b.sent ? `✅ ${b.sentCount ?? 0}/${b.targetCount ?? '?'}` : '⏳ sending...';
      text += `${status} 👁${b.seenCount || 0} — ${(b.message || '').slice(0, 35)}\n`;
      if (b.sentMessages && !b.deleted) buttons.push([Markup.button.callback('🗑 Unsend from everyone', `admin_unsendbc_${id}`)]);
    });
    const navRow = [];
    if (page > 0) navRow.push(Markup.button.callback('⬅️ Prev', `admin_bchistory_${page - 1}`));
    if ((page + 1) * pageSize < entries.length) navRow.push(Markup.button.callback('Next ➡️', `admin_bchistory_${page + 1}`));
    if (navRow.length) buttons.push(navRow);
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_msghistory')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  });

  bot.action(/^admin_unsendbc_(.+)$/, async (ctx) => {
    if (!(await needPerm(ctx, 'broadcast'))) return;
    const id = ctx.match[1];
    await fb.updateBroadcastEntry(id, { deleteRequested: true });
    await ctx.answerCbQuery('📤 Unsend requested — processing for all recipients...');
  });

  // ============ STAFF SYSTEM ============

  bot.action('admin_staff', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    await sendStaffMenu(ctx);
  });

  async function sendStaffMenu(ctx) {
    const staff = await fb.getAllStaff();
    const entries = Object.entries(staff);

    const pendingReqs = (await fb.getPendingStaffRequests()).length;
    let text = `🧑‍💼 *Staff* (${entries.length})\n\nStaff products always need YOUR approval before going live. Tap a staff member to manage permissions. Fee, gifting and limits are in *Staff Settings*.\n\n`;
    if (entries.length === 0) text += '_No staff added yet._';
    entries.forEach(([id, s]) => { text += `👤 ${s.fullName ? mdEscape(s.fullName) + ' — ' : ''}\`${id}\`${s.phone ? ` 📱 \`${s.phone}\`` : ''}\n`; });

    const buttons = [[Markup.button.callback('➕ Add Staff', 'admin_addstaff')]];
    buttons.push([Markup.button.callback(`📥 Staff Requests${pendingReqs ? ` (${pendingReqs})` : ''}`, 'admin_staffreqs')]);
    buttons.push([Markup.button.callback('⚙️ Staff Settings', 'admin_staffsettings')]);
    entries.forEach(([id, s]) => buttons.push([Markup.button.callback(`👤 ${(s.fullName || id).slice(0, 24)}`, `admin_staffview_${id}`)]));
    buttons.push([Markup.button.callback('⬅️ Back', 'admin_home')]);

    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }); }
  }

  bot.action('admin_addstaff', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'awaiting_staff_id', data: {} };
    await ctx.reply('🧑‍💼 Enter the Telegram ID to make staff:');
  });

  bot.action(/^admin_removestaff_(.+)$/, async (ctx) => {
    if (!(await isOwner(ctx))) return;
    const id = ctx.match[1];
    await fb.removeStaff(id);
    await ctx.answerCbQuery('🗑️ Removed');
    await sendStaffMenu(ctx);
  });

  // ============ PRO PLAN ============

  bot.action('admin_proplan', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const settings = await fb.getProPlanSettings();
    await ctx.reply(`👑 *Pro Plan Settings*\n\n💰 Price: ₹${settings.price}\n📅 Duration: ${settings.durationDays} days`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Edit', 'admin_editproplan')],
        [Markup.button.callback('⬅️ Back', 'admin_home')]
      ])
    });
  });

  bot.action('admin_editproplan', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'proplan_price', data: {} };
    await ctx.reply('👑 New price (₹)?');
  });

  // ============ SALES REPORT ============

  bot.action('admin_report', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const weekly = await fb.getSalesReport(7);
    const monthly = await fb.getSalesReport(30);
    const text = `📊 *Sales Report*\n\n*Last 7 days:*\n💰 ₹${weekly.totalSales} — ${weekly.orderCount} orders\n${weekly.topProducts.join('\n')}\n\n*Last 30 days:*\n💰 ₹${monthly.totalSales} — ${monthly.orderCount} orders\n${monthly.topProducts.join('\n')}`;
    await ctx.reply(text, { parse_mode: 'Markdown', ...adminBackButton() });
  });

  // ============ LEADERBOARD ============

  bot.action('admin_leaderboard', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery();
    const [buyers, referrers] = await Promise.all([fb.getTopBuyers(5), fb.getTopReferrers(5)]);
    let text = '🏆 *Leaderboard*\n\n💰 *Top Buyers*\n';
    buyers.forEach((b, i) => { text += `${i + 1}. ${mdEscape(b.name)} — ₹${b.totalSpent}\n`; });
    text += '\n🔗 *Top Referrers*\n';
    referrers.forEach((r, i) => { text += `${i + 1}. ${mdEscape(r.name)} — ${r.referralCount}\n`; });
    await ctx.reply(text, { parse_mode: 'Markdown', ...adminBackButton() });
  });

  // ============ BACKUP ============

  bot.action('admin_backup', async (ctx) => {
    if (!(await isOwner(ctx))) return;
    await ctx.answerCbQuery('Generating backup...');
    const st = fb.getStorageStatus();
    const ago = st.lastPushAt ? `, last sync ${Math.max(0, Math.round((Date.now() - st.lastPushAt) / 1000))}s ago` : '';
    await ctx.reply(st.enabled
      ? `✅ Cloud storage: ${st.provider} (pending: ${st.pending}${ago})${st.lastError ? `\n⚠️ Last error: ${st.lastError}` : ''}`
      : '⚠️ Cloud storage NOT configured — data will be LOST on every redeploy! Set SUPABASE_URL + SUPABASE_SERVICE_KEY on Render.');
    const backup = fb.getFullBackup();
    const json = JSON.stringify(backup, null, 2);
    const buffer = Buffer.from(json, 'utf8');
    await ctx.replyWithDocument(
      { source: buffer, filename: `backup_${new Date().toISOString().slice(0, 10)}.json` },
      { caption: '💾 Full data backup. Keep this file safe as an extra copy.' }
    );
  });

  // ============ SHARED TEXT HANDLER FOR ALL WIZARDS ============
  // Returns true if it handled the message (so bot.js's own text handler
  // knows to skip its own processing for this update).

  async function handleAdminText(ctx) {
    const state = adminState[ctx.from.id];
    if (!state || !(await isAdminOrStaff(ctx))) return false;

    const text = ctx.message.text.trim();

    // ---- Per-field product edit ----
    if (state.step && state.step.startsWith('pedit_')) {
      return handleProductEditText(ctx, state, text);
    }

    // ---- Product add/edit wizard ----
    if (state.step && state.step.startsWith('prod_')) {
      return handleProductWizard(ctx, state, text);
    }

    // ---- Coupon creation wizard ----
    if (state.step && state.step.startsWith('coupon_')) {
      return handleCouponWizard(ctx, state, text);
    }

    // ---- Pro Plan edit wizard ----
    if (state.step === 'proplan_price') {
      const price = parseInt(text);
      if (isNaN(price)) { await ctx.reply('⚠️ Valid number daalo.'); return true; }
      state.data.price = price;
      state.step = 'proplan_duration';
      await ctx.reply('📅 Duration (days)?');
      return true;
    }
    if (state.step === 'proplan_duration') {
      const days = parseInt(text);
      if (isNaN(days)) { await ctx.reply('⚠️ Valid number daalo.'); return true; }
      await fb.setProPlanSettings({ price: state.data.price, durationDays: days, active: true });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Pro Plan updated: ₹${state.data.price} for ${days} days.`);
      return true;
    }

    // ---- Simple single-step flows ----
    if (state.step === 'awaiting_wallet_amount') {
      const amount = parseInt(text);
      if (isNaN(amount) || amount < 0) { await ctx.reply('⚠️ Valid amount daalo.'); return true; }
      const users = await fb.getAllUsers();
      const current = users[state.data.telegramId]?.walletBalance || 0;
      const delta = amount - current;
      if (delta > 0) await fb.creditWallet(state.data.telegramId, delta, 'admin_adjustment');
      else if (delta < 0) await fb.debitWallet(state.data.telegramId, -delta, 'admin_adjustment').catch(() => {});
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Wallet set to ₹${amount}.`);
      return true;
    }

    if (state.step === 'awaiting_ban_reason') {
      await fb.banUser(state.data.telegramId, text);
      delete adminState[ctx.from.id];
      await ctx.reply(`🚫 User ${state.data.telegramId} banned.\nReason: ${text}`);
      return true;
    }

    // ---- Direct Message wizard: userid -> message -> image? -> file? -> button? -> popup? -> send
    if (state.step === 'dm_userid') {
      state.data.telegramId = text;
      state.step = 'dm_message';
      await ctx.reply('📩 Now type the message:');
      return true;
    }
    if (state.step === 'dm_message') {
      state.data.message = text;
      state.step = 'dm_image';
      await ctx.reply('🖼 Send a photo to attach (or type "skip"):');
      return true;
    }
    if (state.step === 'dm_image') {
      if (text.toLowerCase() === 'skip') {
        state.step = 'dm_file';
        await ctx.reply('📎 Send a file to attach (or type "skip"):');
        return true;
      }
      await ctx.reply('⚠️ Send a photo, or type "skip".');
      return true;
    }
    if (state.step === 'dm_file') {
      if (text.toLowerCase() === 'skip') {
        state.step = 'dm_button';
        await ctx.reply('🔗 Add a button? Send as `Button Text | https://url.com`, or type "skip":', { parse_mode: 'Markdown' });
        return true;
      }
      await ctx.reply('⚠️ Send a file, or type "skip".');
      return true;
    }
    if (state.step === 'dm_button') {
      if (text.toLowerCase() !== 'skip') {
        const parts = text.split('|').map(s => s.trim());
        if (parts.length === 2) { state.data.buttonText = parts[0]; state.data.buttonUrl = parts[1]; }
      }
      state.step = 'dm_popup';
      await ctx.reply('🔔 Send as popup notification (with a Close ❌ button)? Reply "yes" or "no":', Markup.keyboard(['yes', 'no']).oneTime().resize());
      return true;
    }
    if (state.step === 'dm_popup') {
      state.data.isPopup = text.toLowerCase() === 'yes';
      await fb.queueDm({
        userId: state.data.telegramId, message: state.data.message,
        imageIds: state.data.imageId ? [state.data.imageId] : null,
        fileIds: state.data.fileId ? [state.data.fileId] : null,
        buttonText: state.data.buttonText || null, buttonUrl: state.data.buttonUrl || null,
        isPopup: state.data.isPopup
      });
      delete adminState[ctx.from.id];
      await ctx.reply('📩 Message queued — sending shortly.', Markup.removeKeyboard());
      return true;
    }

    // ---- Broadcast wizard: message -> image? -> file? -> button? -> popup? -> send
    if (state.step === 'bc_message') {
      state.data.message = text;
      state.step = 'bc_image';
      await ctx.reply('🖼 Send a photo to attach (or type "skip"):');
      return true;
    }
    if (state.step === 'bc_image') {
      if (text.toLowerCase() === 'skip') {
        state.step = 'bc_file';
        await ctx.reply('📎 Send a file to attach (or type "skip"):');
        return true;
      }
      await ctx.reply('⚠️ Send a photo, or type "skip".');
      return true;
    }
    if (state.step === 'bc_file') {
      if (text.toLowerCase() === 'skip') {
        state.step = 'bc_button';
        await ctx.reply('🔗 Add a button? Send as `Button Text | https://url.com`, or type "skip":', { parse_mode: 'Markdown' });
        return true;
      }
      await ctx.reply('⚠️ Send a file, or type "skip".');
      return true;
    }
    if (state.step === 'bc_button') {
      if (text.toLowerCase() !== 'skip') {
        const parts = text.split('|').map(s => s.trim());
        if (parts.length === 2) { state.data.buttonText = parts[0]; state.data.buttonUrl = parts[1]; }
      }
      state.step = 'bc_popup';
      await ctx.reply('🔔 Send as popup notification (with a Close ❌ button)? Reply "yes" or "no":', Markup.keyboard(['yes', 'no']).oneTime().resize());
      return true;
    }
    if (state.step === 'bc_popup') {
      state.data.isPopup = text.toLowerCase() === 'yes';
      await fb.queueBroadcast({
        message: state.data.message,
        imageIds: state.data.imageId ? [state.data.imageId] : null,
        fileIds: state.data.fileId ? [state.data.fileId] : null,
        buttonText: state.data.buttonText || null, buttonUrl: state.data.buttonUrl || null,
        isPopup: state.data.isPopup
      });
      delete adminState[ctx.from.id];
      await ctx.reply('📢 Broadcast queued — sending to all users shortly.', Markup.removeKeyboard());
      return true;
    }

    if (state.step === 'awaiting_welcome_message') {
      await fb.updateBotSettings({ welcomeMessage: text });
      delete adminState[ctx.from.id];
      await ctx.reply('✅ Welcome message updated.');
      return true;
    }

    if (state.step === 'awaiting_channel_username') {
      const settings = await fb.getBotSettings();
      const channels = settings.channels || [];
      const username = text.replace('@', '');
      channels.push({ username, label: username, required: true });
      await fb.updateBotSettings({ channels });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Channel @${username} added as required. Make sure the bot is an admin in that channel!`);
      return true;
    }

    if (state.step === 'awaiting_support_telegram') {
      if (text.toLowerCase() !== 'skip') {
        await fb.updateBotSettings({ supportTelegram: text.replace('@', '') });
      }
      state.step = 'awaiting_support_whatsapp';
      await ctx.reply('📱 Send support WhatsApp number (with country code), or "skip":');
      return true;
    }
    if (state.step === 'awaiting_support_whatsapp') {
      if (text.toLowerCase() !== 'skip') {
        await fb.updateBotSettings({ supportWhatsapp: text.replace(/[^0-9]/g, '') });
      }
      delete adminState[ctx.from.id];
      await ctx.reply('✅ Support info updated.');
      return true;
    }

    if (state.step === 'awaiting_user_lookup') {
      delete adminState[ctx.from.id];
      await sendUserDetails(ctx, text);
      return true;
    }

    // ---- Payment Settings (PayX) ----
    if (state.step === 'awaiting_fam_apikey') {
      await fb.updatePaymentSettings({ apiKey: text });
      delete adminState[ctx.from.id];
      await ctx.reply('✅ PayX API key updated.');
      return true;
    }
    if (state.step === 'awaiting_fam_baseurl') {
      await fb.updatePaymentSettings({ baseUrl: text });
      delete adminState[ctx.from.id];
      await ctx.reply('✅ PayX server URL updated.');
      return true;
    }
    if (state.step === 'awaiting_fam_upi') {
      await fb.updatePaymentSettings({ upiId: text });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ UPI ID updated to \`${text}\`.`, { parse_mode: 'Markdown' });
      return true;
    }
    if (state.step === 'awaiting_fam_tc') {
      await fb.updatePaymentSettings({ termsAndConditions: text });
      delete adminState[ctx.from.id];
      await ctx.reply('✅ Terms & Conditions updated.');
      return true;
    }

    // ---- Menu button rename ----
    if (state.step === 'awaiting_button_rename') {
      const settings = await fb.getBotSettings();
      const menuLabels = { ...(settings.menuLabels || {}) };
      menuLabels[state.data.key] = text;
      await fb.updateBotSettings({ menuLabels });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Button renamed to "${text}"`);
      return true;
    }

    // ---- Add custom menu button wizard ----
    if (state.step === 'menubutton_text') {
      state.data.text = text;
      state.step = 'menubutton_url';
      await ctx.reply('🔗 Button URL?');
      return true;
    }
    if (state.step === 'menubutton_url') {
      const settings = await fb.getBotSettings();
      const customButtons = [...(settings.menuCustomButtons || []), { text: state.data.text, url: text }];
      await fb.updateBotSettings({ menuCustomButtons: customButtons });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Custom button "${state.data.text}" added to main menu.`);
      return true;
    }

    // ---- Check-in reward edit ----
    if (state.step === 'awaiting_checkin_reward') {
      const amount = parseInt(text);
      if (isNaN(amount) || amount < 0) { await ctx.reply('⚠️ Valid amount daalo.'); return true; }
      const settings = await fb.getCheckInSettings();
      await fb.setCheckInSettings({ ...settings, rewardAmount: amount });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Check-in reward set to ₹${amount}.`);
      return true;
    }

    // ---- Add staff ----
    if (state.step === 'stock_edit') {
      const p = await fb.getProduct(state.data.productId);
      if (!p || !(await ownsProduct(ctx, p)) || !(await hasPerm(ctx, 'stock'))) { delete adminState[ctx.from.id]; await ctx.reply('⛔ Not allowed.'); return true; }
      const n = parseInt(text, 10);
      if (isNaN(n) || n < -1 || n > 1000000) { await ctx.reply('⚠️ Number daalo (-1 = unlimited).'); return true; }
      await fb.updateProduct(state.data.productId, { stock: n });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Stock updated: *${mdEscape(p.name)}* → ${n === -1 ? 'Unlimited' : n}`, { parse_mode: 'Markdown', ...adminBackButton('admin_stock') });
      return true;
    }

    if (state.step === 'rl_edit') {
      const p = await fb.getProduct(state.data.productId);
      if (!p || p.price !== 0 || !(await ownsProduct(ctx, p)) || !(await hasPerm(ctx, 'referlock'))) { delete adminState[ctx.from.id]; await ctx.reply('⛔ Not allowed.'); return true; }
      const n = parseInt(text, 10);
      if (isNaN(n) || n < 0 || n > 100) { await ctx.reply('⚠️ 0 se 100 ke beech number daalo.'); return true; }
      await fb.updateProduct(state.data.productId, { referToUnlock: n });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ *${mdEscape(p.name)}*: ${n > 0 ? `ab ${n} referrals chahiye` : 'lock hata diya'}`, { parse_mode: 'Markdown', ...adminBackButton('admin_referlock') });
      return true;
    }

    if (state.step === 'staff_contact') {
      if (text.length < 5 || text.length > 500) { await ctx.reply('⚠️ Message 5 se 500 characters ka likho.'); return true; }
      const now = Date.now();
      if (lastContact[ctx.from.id] && now - lastContact[ctx.from.id] < 60000) { await ctx.reply('⏳ Thodi der baad dobara bhejo.'); return true; }
      lastContact[ctx.from.id] = now;
      const s = await fb.getStaff(ctx.from.id);
      for (const o of ownerIds()) {
        try { await bot.telegram.sendMessage(o, `💬 *Staff message*\n\n👤 ${mdEscape((s && s.fullName) || ctx.from.first_name || 'Staff')} (\`${ctx.from.id}\`)\n\n${mdEscape(text)}`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🛠 Staff', `admin_staffview_${ctx.from.id}`)]]) }); } catch (e) {}
      }
      delete adminState[ctx.from.id];
      await ctx.reply('✅ Owner ko message bhej diya gaya.', adminBackButton());
      return true;
    }

    if (state.step === 'ss_edit') {
      if (!(await isOwner(ctx))) { delete adminState[ctx.from.id]; return true; }
      const n = parseInt(text, 10);
      if (isNaN(n) || n < 0 || n > 1000000 || (state.data.key === 'couponMaxPercent' && (n < 1 || n > 100))) { await ctx.reply(state.data.key === 'couponMaxPercent' ? '⚠️ 1 se 100 ke beech number daalo.' : '⚠️ 0 ya usse bada number daalo.'); return true; }
      await fb.updateStaffSettings({ [state.data.key]: n });
      delete adminState[ctx.from.id];
      await ctx.reply('✅ Saved.');
      await sendStaffSettings(ctx);
      return true;
    }

    if (state.step === 'gift_userid') {
      if (!/^\d{5,15}$/.test(text)) { await ctx.reply('⚠️ Sahi Telegram ID daalo (sirf numbers).'); return true; }
      const target = await fb.getUser(text);
      if (!target) { await ctx.reply('❌ Yeh user bot mein nahi mila. User ne pehle bot ko /start kiya hona chahiye.'); return true; }
      if (await fb.isUserBanned(text)) { await ctx.reply('⛔ Yeh user banned hai.'); return true; }
      if (String(text) === String(ctx.from.id)) { await ctx.reply('⚠️ Khud ko gift nahi kar sakte.'); return true; }
      const p = await fb.getProduct(state.data.productId);
      if (!p) { delete adminState[ctx.from.id]; await ctx.reply('Product nahi mila.'); return true; }
      if (await fb.hasUserBoughtProduct(text, state.data.productId)) { await ctx.reply('ℹ️ Is user ke paas yeh product pehle se hai. Doosra product chuno.'); delete adminState[ctx.from.id]; return true; }
      state.step = 'gift_confirm';
      state.data.targetId = text;
      await ctx.reply(
        `🎁 *Confirm Gift*\n\n📦 ${mdEscape(p.name)}\n👤 ${mdEscape(target.name || 'User')} (\`${text}\`)${target.username ? ` @${mdEscape(target.username)}` : ''}\n\nYeh product is user ko *free* bhej diya jayega.`,
        { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Send Gift', 'admin_giftgo'), Markup.button.callback('❌ Cancel', 'admin_giftcancel')]]) }
      );
      return true;
    }

    if (state.step === 'awaiting_staff_id') {
      if (!(await isOwner(ctx))) { delete adminState[ctx.from.id]; return true; }
      const cfgS = await fb.getStaffSettings();
      await fb.addStaff(text, cfgS.defaultPerms && cfgS.defaultPerms.length ? cfgS.defaultPerms : ['products']);
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ User \`${text}\` added as staff.`, { parse_mode: 'Markdown' });
      return true;
    }

    // ---- Referral settings wizard ----
    if (state.step === 'referral_type') {
      const type = text.toLowerCase();
      if (type !== 'flat' && type !== 'percent') { await ctx.reply('⚠️ Reply "flat" or "percent".'); return true; }
      state.data.bonusType = type;
      state.step = 'referral_amount';
      await ctx.reply(`Bonus amount? (${type === 'flat' ? '₹' : '%'})`, Markup.removeKeyboard());
      return true;
    }
    if (state.step === 'referral_amount') {
      const amount = parseInt(text);
      if (isNaN(amount)) { await ctx.reply('⚠️ Valid number daalo.'); return true; }
      await fb.setReferralSettings({ bonusType: state.data.bonusType, bonusAmount: amount });
      delete adminState[ctx.from.id];
      await ctx.reply(`✅ Referral bonus set: ${state.data.bonusType === 'percent' ? amount + '%' : '₹' + amount}`);
      return true;
    }

    return false;
  }

  // ---- Coupon creation wizard ----
  async function handleCouponWizard(ctx, state, text) {
    switch (state.step) {
      case 'coupon_code': {
        const code = text.toUpperCase();
        if (!(await isOwner(ctx))) {
          // Staff: clean code, can never overwrite an existing (e.g. owner's) coupon
          if (!/^[A-Z0-9_-]{3,20}$/.test(code)) { await ctx.reply('⚠️ Code 3-20 characters ka ho (A-Z, 0-9, - _).'); return true; }
          if (await fb.getCoupon(code)) { await ctx.reply('⚠️ Yeh code pehle se use mein hai. Doosra code likho.'); return true; }
          state.data.code = code;
          state.step = 'coupon_scope';
          const mine = Object.entries(await fb.getAllProducts(false)).filter(([, p]) => String(p.submittedBy) === String(ctx.from.id));
          const rows = [[Markup.button.callback('📦 All my products', 'admin_cpnscope_all')],
            ...mine.slice(0, 8).map(([id, p]) => [Markup.button.callback(`📦 ${p.name.slice(0, 28)}`, `admin_cpnscope_${id}`)])];
          await ctx.reply('Step 2/5 — Yeh coupon kis product par chalega?', Markup.inlineKeyboard(rows));
          return true;
        }
        state.data.code = code;
        state.step = 'coupon_type';
        await ctx.reply('Step 2/4 — Discount type? Reply "flat" (₹ amount) or "percent" (%)', Markup.keyboard(['flat', 'percent']).oneTime().resize());
        return true;
      }

      case 'coupon_scope':
        await ctx.reply('👆 Upar ke buttons mein se product chuno.');
        return true;

      case 'coupon_type': {
        const type = text.toLowerCase();
        if (type !== 'flat' && type !== 'percent') { await ctx.reply('⚠️ Reply "flat" or "percent".'); return true; }
        state.data.discountType = type;
        state.step = 'coupon_value';
        await ctx.reply(`Step 3/4 — Discount value? (${type === 'flat' ? '₹ amount' : '% amount'})`, Markup.removeKeyboard());
        return true;
      }

      case 'coupon_value': {
        const value = parseInt(text);
        if (isNaN(value) || value < 1) { await ctx.reply('⚠️ Valid number daalo.'); return true; }
        if (!(await isOwner(ctx)) && state.data.discountType === 'percent') {
          const cfgC = await fb.getStaffSettings();
          if (value > cfgC.couponMaxPercent) { await ctx.reply(`⚠️ Owner ne staff coupon ki limit ${cfgC.couponMaxPercent}% rakhi hai. Isse kam daalo.`); return true; }
        }
        state.data.discountValue = value;
        state.step = 'coupon_limit';
        await ctx.reply('Step 4/4 — Usage limit? (number, or "unlimited")');
        return true;
      }

      case 'coupon_limit': {
        const limit = text.toLowerCase() === 'unlimited' ? null : parseInt(text);
        const staffExtra = (await isOwner(ctx)) ? {} : {
          ownerStaffId: String(ctx.from.id),
          productId: state.data.productId || null,
          maxPercent: (await fb.getStaffSettings()).couponMaxPercent
        };
        await fb.createCoupon(state.data.code, {
          discountType: state.data.discountType,
          discountValue: state.data.discountValue,
          usageLimit: isNaN(limit) ? null : limit,
          minAmount: 0,
          ...staffExtra
        });
        delete adminState[ctx.from.id];
        await ctx.reply(`✅ Coupon \`${state.data.code}\` created!`, { parse_mode: 'Markdown' });
        return true;
      }

      default:
        return false;
    }
  }

  // ---- Product add/edit wizard steps ----
  async function handleProductWizard(ctx, state, text) {
    const skip = text.toLowerCase() === 'skip' && state.data.isEdit;

    switch (state.step) {
      case 'prod_name':
        if (!skip) state.data.name = text;
        state.step = 'prod_price';
        await ctx.reply(`Step 2/8 — Price (₹, 0 for free)?${state.data.isEdit ? ` Current: ${state.data.price}` : ''}`);
        return true;

      case 'prod_price': {
        if (!skip) {
          const price = parseInt(text);
          if (isNaN(price)) { await ctx.reply('⚠️ Valid number daalo.'); return true; }
          state.data.price = price;
        }
        state.step = 'prod_category';
        await ctx.reply(`Step 3/8 — Category?${state.data.isEdit ? ` Current: ${state.data.category}` : ''}`);
        return true;
      }

      case 'prod_category':
        if (!skip) state.data.category = text;
        state.step = 'prod_description';
        await ctx.reply('Step 4/8 — Description? (or "skip")');
        return true;

      case 'prod_description':
        if (text.toLowerCase() !== 'skip') state.data.description = text;
        state.step = 'prod_stock';
        await ctx.reply('Step 5/8 — Stock quantity? (-1 for unlimited)');
        return true;

      case 'prod_stock': {
        if (!skip) {
          const stock = parseInt(text);
          state.data.stock = isNaN(stock) ? -1 : stock;
        }
        if (state.data.price === 0) {
          state.step = 'prod_refer';
          await ctx.reply(`🔒 Refer-to-Unlock: is FREE product ko lene ke liye user ko kitne friends refer karne honge? (0 = koi lock nahi, max 100)${state.data.isEdit ? ` Current: ${state.data.referToUnlock || 0}` : ''}`, Markup.removeKeyboard());
          return true;
        }
        state.data.referToUnlock = 0;
        state.step = 'prod_deliverytype';
        await ctx.reply('Step 6/8 — Delivery type? Reply "file" or "link"', Markup.keyboard(['file', 'link']).oneTime().resize());
        return true;
      }

      case 'prod_refer': {
        if (!skip) {
          const n = parseInt(text);
          if (isNaN(n) || n < 0 || n > 100) { await ctx.reply('⚠️ 0 se 100 ke beech number daalo.'); return true; }
          state.data.referToUnlock = n;
        }
        state.step = 'prod_deliverytype';
        await ctx.reply('Step 6/8 — Delivery type? Reply "file" or "link"', Markup.keyboard(['file', 'link']).oneTime().resize());
        return true;
      }

      case 'prod_deliverytype': {
        const type = text.toLowerCase();
        if (type !== 'file' && type !== 'link') { await ctx.reply('⚠️ Reply "file" or "link".'); return true; }
        state.data.deliveryType = type;
        state.step = 'prod_deliveryvalue';
        if (type === 'file') {
          await ctx.reply('Step 7/8 — Now send the FILE (as document) you want delivered:', Markup.removeKeyboard());
        } else {
          await ctx.reply('Step 7/8 — Send the download link (URL):', Markup.removeKeyboard());
        }
        return true;
      }

      case 'prod_deliveryvalue':
        if (state.data.deliveryType === 'link') {
          state.data.deliveryLink = text;
          state.step = 'prod_image';
          await ctx.reply('Step 8/8 — Send a product image (photo), or type "skip":');
          return true;
        }
        await ctx.reply('⚠️ Please send the file as a document, not text.');
        return true;

      case 'prod_image':
        if (text.toLowerCase() === 'skip') {
          await finalizeProduct(ctx, state);
          return true;
        }
        await ctx.reply('⚠️ Send a photo, or type "skip".');
        return true;

      default:
        return false;
    }
  }

  async function finalizeProduct(ctx, state) {
    const d = state.data;
    const imageFileIds = d.imageFileIds && d.imageFileIds.length > 0 ? d.imageFileIds : (d.imageFileId ? [d.imageFileId] : []);
    const productData = {
      name: d.name, price: d.price, category: d.category,
      description: d.description || '', stock: d.stock,
      referToUnlock: d.price === 0 ? (d.referToUnlock || 0) : 0,
      deliveryType: d.deliveryType,
      fileId: d.fileId || '',
      deliveryLink: d.deliveryLink || '',
      imageUrl: '',
      imageFileId: imageFileIds[0] || null,
      imageFileIds: imageFileIds.length > 0 ? imageFileIds : null
    };

    const owner = await isOwner(ctx);
    const imgNote = imageFileIds.length > 1 ? ` (${imageFileIds.length} images)` : '';

    if (d.isEdit) {
      const existing = await fb.getProduct(d.productId);
      if (!owner && (!existing || !staffCanEdit(ctx, existing))) {
        delete adminState[ctx.from.id];
        await ctx.reply('⛔ Aap is product ko edit nahi kar sakte.');
        return;
      }
      if (owner) {
        await fb.updateProduct(d.productId, productData);
        await ctx.reply(`✅ Product updated: *${mdEscape(d.name)}*${imgNote}`, { parse_mode: 'Markdown' });
      } else {
        // Staff edits go back to the owner for approval and stay hidden meanwhile
        const upd = await fb.updateProduct(d.productId, { ...productData, active: false, approvalStatus: 'pending', resubmittedAt: Date.now() });
        await ctx.reply(`✅ Product updated: *${mdEscape(d.name)}*${imgNote}\n\n⏳ Owner ke approval ke baad hi live hoga.`, { parse_mode: 'Markdown' });
        await notifyOwnersOfSubmission(d.productId, upd, true);
      }
    } else if (owner) {
      await fb.createProduct(productData);
      await ctx.reply(`✅ Product added: *${mdEscape(d.name)}*${imgNote}\n\nUsers will be notified automatically! 🆕`, { parse_mode: 'Markdown' });
    } else {
      const staffRec = await fb.getStaff(ctx.from.id);
      const created = await fb.createProduct({
        ...productData,
        active: false,
        approvalStatus: 'pending',
        submittedBy: String(ctx.from.id),
        submittedByName: (staffRec && staffRec.fullName) || ctx.from.first_name || 'Staff'
      });
      await ctx.reply(`✅ Product submit ho gaya: *${mdEscape(d.name)}*${imgNote}\n\n⏳ Owner approve karega tabhi store mein dikhega. Status Products section mein dekh sakte ho.`, { parse_mode: 'Markdown' });
      await notifyOwnersOfSubmission(created.id, created, false);
    }
    delete adminState[ctx.from.id];
  }

  // Called from bot.js's document/photo handlers when an admin is mid-wizard
  async function handleAdminDocument(ctx) {
    const state = adminState[ctx.from.id];
    if (!state) return false;

    if (state.step === 'pedit_file') {
      await applyProductEdit(ctx, state.data.productId, { deliveryType: 'file', fileId: ctx.message.document.file_id, deliveryLink: '' }, 'File');
      return true;
    }

    if (state.step === 'prod_deliveryvalue' && state.data.deliveryType === 'file') {
      state.data.fileId = ctx.message.document.file_id;
      state.step = 'prod_image';
      await ctx.reply('✅ File saved.\n\nStep 8/8 — Send a product image (photo), or type "skip":');
      return true;
    }

    if (state.step === 'dm_file') {
      state.data.fileId = ctx.message.document.file_id;
      state.step = 'dm_button';
      await ctx.reply('✅ File attached.\n\n🔗 Add a button? Send as `Button Text | https://url.com`, or type "skip":', { parse_mode: 'Markdown' });
      return true;
    }
    if (state.step === 'bc_file') {
      state.data.fileId = ctx.message.document.file_id;
      state.step = 'bc_button';
      await ctx.reply('✅ File attached.\n\n🔗 Add a button? Send as `Button Text | https://url.com`, or type "skip":', { parse_mode: 'Markdown' });
      return true;
    }

    return false;
  }

  async function handleAdminPhoto(ctx) {
    const state = adminState[ctx.from.id];
    if (!state) return false;
    const sizes = ctx.message.photo;
    const fileId = sizes[sizes.length - 1].file_id;
    const mediaGroupId = ctx.message.media_group_id || null;

    if (state.step === 'pedit_photos') {
      // Same album handling as the add-product wizard: collect photos, apply once.
      if (!state.data.photoIds) state.data.photoIds = [];
      state.data.photoIds.push(fileId);
      const apply = async () => {
        if (adminState[ctx.from.id] !== state) return; // cancelled / already applied
        const ids = state.data.photoIds.slice(0, 10);
        await applyProductEdit(ctx, state.data.productId, { imageUrl: '', imageFileId: ids[0], imageFileIds: ids }, ids.length > 1 ? `Photos (${ids.length})` : 'Photo');
      };
      if (!mediaGroupId) { await apply(); return true; }
      if (state.data._peTimer) clearTimeout(state.data._peTimer);
      state.data._peTimer = setTimeout(() => { apply().catch(e => console.error('pedit photos error:', e.message)); }, 1200);
      return true;
    }

    if (state.step === 'prod_image') {
      // Telegram's multi-select photo picker sends each photo as a SEPARATE
      // message sharing the same media_group_id — not one message with many
      // photos. We collect them into an array and only finalize once, after
      // a short debounce window (so the last photo in the album has time to
      // arrive) instead of finalizing on the very first photo received.
      if (!state.data.imageFileIds) state.data.imageFileIds = [];
      state.data.imageFileIds.push(fileId);

      if (!mediaGroupId) {
        // Single photo, no album — finalize immediately as before.
        await finalizeProduct(ctx, state);
        return true;
      }

      // Part of an album — debounce so we catch all photos in the group
      // before creating the product once with every image attached.
      if (state.data._mediaGroupTimer) clearTimeout(state.data._mediaGroupTimer);
      state.data._mediaGroupId = mediaGroupId;
      state.data._mediaGroupTimer = setTimeout(async () => {
        if (!adminState[ctx.from.id]) return; // already finalized/cancelled
        await finalizeProduct(ctx, state);
      }, 1200);
      return true;
    }

    if (state.step === 'dm_image') {
      state.data.imageId = fileId;
      state.step = 'dm_file';
      await ctx.reply('✅ Photo attached.\n\n📎 Send a file to attach (or type "skip"):');
      return true;
    }
    if (state.step === 'bc_image') {
      state.data.imageId = fileId;
      state.step = 'bc_file';
      await ctx.reply('✅ Photo attached.\n\n📎 Send a file to attach (or type "skip"):');
      return true;
    }

    return false;
  }

  return { handleAdminText, handleAdminDocument, handleAdminPhoto, isAdmin, isAdminOrStaff, adminState, sendAdminMenu };
}

module.exports = { setupAdminPanel };
