// ============================================================
// 💼 HIRE A DEVELOPER  —  public directory + admin management
// ============================================================
// Users who get approved through the "Become a Developer" feature (see features.js)
// are listed here, grouped by category (Website Developer, App Developer, ...).
// The owner manages categories, developers and the on/off switch from
// Admin Panel → 👨‍💻 Developers.

const { Markup } = require('telegraf');
const ui = require('./ui');

function setupDevelopers(bot, fb, adminState, { mdEscape }) {
  const PER_PAGE = 8;
  const isOwner = (ctx) => fb.isAdmin(ctx.from.id);
  const show = async (ctx, text, kb) => {
    try { await ctx.editMessageText(text, { parse_mode: 'Markdown', ...kb }); }
    catch (e) { await ctx.reply(text, { parse_mode: 'Markdown', ...kb }); }
  };
  const isHttp = (u) => /^https?:\/\/\S+$/i.test(u || '');

  // devs that should be visible to users
  async function visibleDevelopers() {
    const cats = await fb.getDevCategories();
    const activeCat = new Map(cats.filter(c => c.active).map(c => [c.id, c]));
    const devs = (await fb.getDevelopers()).filter(d => d.active);
    // a developer whose category is switched off is hidden; no category => "Other"
    return devs.filter(d => !d.category || !cats.find(c => c.id === d.category) || activeCat.has(d.category));
  }
  const catName = (cats, id) => { const c = cats.find(x => x.id === id); return c ? c.name : '🧩 Other'; };

  // =====================================================================
  // USER SIDE: 💼 Hire a Developer
  // =====================================================================
  bot.action('menu_hire', async (ctx) => {
    const meta = await fb.getFeatureMeta();
    if (meta.hireEnabled === false) return ctx.answerCbQuery('Yeh section abhi band hai.', { show_alert: true });
    await ctx.answerCbQuery();
    const cats = (await fb.getDevCategories()).filter(c => c.active);
    const devs = await visibleDevelopers();
    let text = `${ui.banner('💼 HIRE A DEVELOPER', '✦ FIND YOUR EXPERT ✦')}\n\n`;
    const rows = [];
    if (!devs.length) {
      text += 'Abhi koi developer listed nahi hai.\n\n_Aap developer ho? Home menu mein *Become a Developer* se join karo!_';
    } else {
      text += `🔎 *${devs.length}* developer${devs.length > 1 ? 's' : ''} available. Category chuno:\n\n${ui.BAR}\n${ui.ribbon('📂 CATEGORIES')}\n${ui.foot('Neeche se chuno')}`;
      rows.push([Markup.button.callback(`👥 All Developers (${devs.length})`, 'hire_cat_all_0')]);
      for (const c of cats) {
        const n = devs.filter(d => d.category === c.id).length;
        if (n) rows.push([Markup.button.callback(`${c.name} (${n})`, `hire_cat_${c.id}_0`)]);
      }
      const other = devs.filter(d => !d.category || !cats.find(c => c.id === d.category)).length;
      if (other) rows.push([Markup.button.callback(`🧩 Other (${other})`, 'hire_cat_other_0')]);
    }
    rows.push([Markup.button.callback('🏠 Home', 'menu_home')]);
    await show(ctx, text, Markup.inlineKeyboard(rows));
  });

  bot.action(/^hire_cat_(.+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const key = ctx.match[1], page = parseInt(ctx.match[2], 10);
    const cats = await fb.getDevCategories();
    let devs = await visibleDevelopers();
    let title = '👥 All Developers';
    if (key === 'other') { devs = devs.filter(d => !d.category || !cats.find(c => c.id === d.category)); title = '🧩 Other'; }
    else if (key !== 'all') { devs = devs.filter(d => d.category === key); title = catName(cats, key); }
    const pages = Math.max(1, Math.ceil(devs.length / PER_PAGE));
    const p = Math.min(Math.max(0, page), pages - 1);
    const slice = devs.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);

    let text = `${ui.banner('💼 HIRE A DEVELOPER', `✦ ${title} ✦`.slice(0, 40))}\n\n${devs.length ? 'Developer chuno:' : '_Is category mein abhi koi developer nahi._'}`;
    const rows = slice.map(d => [Markup.button.callback(`👨‍💻 ${d.name.slice(0, 26)}${key === 'all' ? ` · ${catName(cats, d.category).slice(0, 18)}` : ''}`, `hire_dev_${d.userId}`)]);
    if (pages > 1) {
      const nav = [];
      if (p > 0) nav.push(Markup.button.callback('◀️ Prev', `hire_cat_${key}_${p - 1}`));
      nav.push(Markup.button.callback(`${p + 1}/${pages}`, 'admin_noop'));
      if (p < pages - 1) nav.push(Markup.button.callback('Next ▶️', `hire_cat_${key}_${p + 1}`));
      rows.push(nav);
    }
    rows.push([Markup.button.callback('⬅️ Categories', 'menu_hire')]);
    await show(ctx, text, Markup.inlineKeyboard(rows));
  });

  bot.action(/^hire_dev_(\d+)$/, async (ctx) => {
    const d = await fb.getDeveloper(ctx.match[1]);
    const visible = d && (await visibleDevelopers()).some(x => x.userId === d.userId);
    if (!visible) return ctx.answerCbQuery('Yeh developer ab available nahi hai.', { show_alert: true });
    await ctx.answerCbQuery();
    const cats = await fb.getDevCategories();
    const text = [
      ui.banner('👨‍💻 DEVELOPER', `✦ ${catName(cats, d.category)} ✦`.slice(0, 40)),
      '',
      `✨ *${mdEscape(d.name)}*`,
      `📂 ${mdEscape(catName(cats, d.category))}`,
      d.bio ? `\n${mdEscape(d.bio.slice(0, 600))}` : null,
      d.portfolio ? `\n🔗 ${mdEscape(d.portfolio)}` : null,
      '',
      ui.BAR,
      ui.ribbon('📩 HIRE NOW'),
      ui.foot('Contact button se seedha baat karo')
    ].filter(x => x !== null).join('\n');
    const contactUrl = d.username ? `https://t.me/${d.username}` : `tg://user?id=${d.userId}`;
    const rows = [[Markup.button.url('📩 Contact', contactUrl)]];
    if (isHttp(d.portfolio)) rows.push([Markup.button.url('🔗 Portfolio', d.portfolio)]);
    rows.push([Markup.button.callback('⬅️ Back', 'menu_hire'), Markup.button.callback('🏠 Home', 'menu_home')]);
    await show(ctx, text, Markup.inlineKeyboard(rows));
  });

  // =====================================================================
  // OWNER: Admin Panel → 👨‍💻 Developers
  // =====================================================================
  const ownerAction = (re, fn) => bot.action(re, async (ctx) => { if (!isOwner(ctx)) return; return fn(ctx); });

  async function sendDevHome(ctx) {
    const [cats, devs, meta] = await Promise.all([fb.getDevCategories(), fb.getDevelopers(), fb.getFeatureMeta()]);
    const on = meta.hireEnabled !== false;
    const text = `${ui.banner('👨‍💻 DEVELOPERS', '✦ HIRE SECTION ✦')}\n\n` +
      `💼 Hire a Developer section: *${on ? 'ON 🟢' : 'OFF 🔴'}*\n📂 Categories: *${cats.length}*\n👨‍💻 Developers: *${devs.length}* (live: ${devs.filter(d => d.active).length})\n\n` +
      `_Developers "Become a Developer" feature se aate hain, ya ➕ Add Developer se kisi ko bhi seedha bana do (Telegram ID + naam)._`;
    await show(ctx, text, Markup.inlineKeyboard([
      [Markup.button.callback('➕ Add Developer', 'devadm_add')],
      [Markup.button.callback('📂 Categories', 'devadm_cats'), Markup.button.callback('👥 Developers', 'devadm_devs_0')],
      [Markup.button.callback(`💼 Hire section: ${on ? 'ON' : 'OFF'}`, 'devadm_hire')],
      [Markup.button.callback('⬅️ Back', 'admin_home')]
    ]));
  }
  ownerAction(/^admin_developers$/, async (ctx) => { await ctx.answerCbQuery(); delete adminState[ctx.from.id]; await sendDevHome(ctx); });

  ownerAction(/^devadm_hire$/, async (ctx) => {
    const meta = await fb.getFeatureMeta();
    await fb.updateFeatureMeta({ hireEnabled: meta.hireEnabled === false });
    await ctx.answerCbQuery('✅ Updated');
    await sendDevHome(ctx);
  });

  // ---- categories ----
  async function sendCats(ctx) {
    const [cats, devs] = await Promise.all([fb.getDevCategories(), fb.getDevelopers()]);
    let text = `${ui.banner('📂 CATEGORIES', '✦ HIRE A DEVELOPER ✦')}\n\n`;
    text += cats.length ? cats.map(c => `${c.active ? '🟢' : '🔴'} ${mdEscape(c.name)} — ${devs.filter(d => d.category === c.id).length} dev`).join('\n') : '_Koi category nahi. Add karo!_';
    const rows = [[Markup.button.callback('➕ Add Category', 'devadm_addcat')]];
    cats.forEach(c => rows.push([Markup.button.callback(`${c.active ? '🟢' : '🔴'} ${c.name.slice(0, 30)}`, `devadm_cat_${c.id}`)]));
    rows.push([Markup.button.callback('⬅️ Back', 'admin_developers')]);
    await show(ctx, text, Markup.inlineKeyboard(rows));
  }
  ownerAction(/^devadm_cats$/, async (ctx) => { await ctx.answerCbQuery(); await sendCats(ctx); });
  ownerAction(/^devadm_addcat$/, async (ctx) => {
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'devadm_addcat', data: {} };
    await ctx.reply('➕ Nayi category ka naam bhejo (emoji ke saath).\nJaise: 🌐 Website Developer');
  });
  async function sendCat(ctx, id) {
    const c = (await fb.getDevCategories()).find(x => x.id === id);
    if (!c) return ctx.reply('Category nahi mili.');
    const n = (await fb.getDevelopers()).filter(d => d.category === id).length;
    await show(ctx, `${ui.banner('📂 CATEGORY', `✦ ${c.name} ✦`.slice(0, 40))}\n\nStatus: *${c.active ? 'ON 🟢' : 'OFF 🔴'}*\n👨‍💻 Developers: *${n}*\n\n_OFF karne par is category ke developers users ko nahi dikhte._`, Markup.inlineKeyboard([
      [Markup.button.callback(c.active ? '🔴 Turn OFF' : '🟢 Turn ON', `devadm_cattoggle_${id}`), Markup.button.callback('✏️ Rename', `devadm_catrename_${id}`)],
      [Markup.button.callback('🗑 Delete', `devadm_catdel_${id}`)],
      [Markup.button.callback('⬅️ Back', 'devadm_cats')]
    ]));
  }
  ownerAction(/^devadm_cat_(.+)$/, async (ctx) => { await ctx.answerCbQuery(); await sendCat(ctx, ctx.match[1]); });
  ownerAction(/^devadm_cattoggle_(.+)$/, async (ctx) => {
    const c = (await fb.getDevCategories()).find(x => x.id === ctx.match[1]); if (!c) return ctx.answerCbQuery('Not found.');
    await fb.updateDevCategory(c.id, { active: !c.active });
    await ctx.answerCbQuery(c.active ? '🔴 OFF' : '🟢 ON');
    await sendCat(ctx, c.id);
  });
  ownerAction(/^devadm_catrename_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'devadm_rename', data: { id: ctx.match[1] } };
    await ctx.reply('✏️ Category ka naya naam bhejo:');
  });
  ownerAction(/^devadm_catdel_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('⚠️ Category delete karni hai? Is category ke developers "Other" mein chale jayenge.', Markup.inlineKeyboard([[
      Markup.button.callback('🗑 Haan, delete', `devadm_catdelok_${ctx.match[1]}`), Markup.button.callback('❌ Nahi', `devadm_cat_${ctx.match[1]}`)
    ]]));
  });
  ownerAction(/^devadm_catdelok_(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    for (const d of (await fb.getDevelopers()).filter(x => x.category === id)) await fb.updateDeveloper(d.userId, { category: null });
    await fb.deleteDevCategory(id);
    await ctx.answerCbQuery('🗑 Deleted');
    await sendCats(ctx);
  });

  // ---- developers ----
  async function sendDevs(ctx, page) {
    const [devs, cats] = await Promise.all([fb.getDevelopers(), fb.getDevCategories()]);
    const pages = Math.max(1, Math.ceil(devs.length / PER_PAGE));
    const p = Math.min(Math.max(0, page), pages - 1);
    const slice = devs.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);
    let text = `${ui.banner('👥 DEVELOPERS', '✦ MANAGE LIST ✦')}\n\n${devs.length ? '' : '_Abhi koi developer nahi hai._'}`;
    const rows = slice.map(d => [Markup.button.callback(`${d.active ? '🟢' : '🔴'} ${d.name.slice(0, 20)} · ${catName(cats, d.category).slice(0, 18)}`, `devadm_dev_${d.userId}`)]);
    if (pages > 1) {
      const nav = [];
      if (p > 0) nav.push(Markup.button.callback('◀️', `devadm_devs_${p - 1}`));
      nav.push(Markup.button.callback(`${p + 1}/${pages}`, 'admin_noop'));
      if (p < pages - 1) nav.push(Markup.button.callback('▶️', `devadm_devs_${p + 1}`));
      rows.push(nav);
    }
    rows.push([Markup.button.callback('⬅️ Back', 'admin_developers')]);
    await show(ctx, text, Markup.inlineKeyboard(rows));
  }
  ownerAction(/^devadm_devs_(\d+)$/, async (ctx) => { await ctx.answerCbQuery(); await sendDevs(ctx, parseInt(ctx.match[1], 10)); });

  async function sendDev(ctx, userId) {
    const d = await fb.getDeveloper(userId);
    if (!d) return ctx.reply('Developer nahi mila.');
    const cats = await fb.getDevCategories();
    const text = `${ui.banner('👨‍💻 DEVELOPER', `✦ ${d.name} ✦`.slice(0, 40))}\n\n` +
      `Status: *${d.active ? 'Live 🟢' : 'Hidden 🔴'}*\n📂 ${mdEscape(catName(cats, d.category))}\n🆔 \`${d.userId}\`${d.username ? `\n🔗 @${mdEscape(d.username)}` : ''}${d.phone ? `\n📱 \`${d.phone}\`` : ''}\n${d.portfolio ? `🌐 ${mdEscape(d.portfolio)}\n` : ''}\n${mdEscape((d.bio || '').slice(0, 500))}`;
    await show(ctx, text, Markup.inlineKeyboard([
      [Markup.button.callback(d.active ? '🔴 Hide' : '🟢 Show', `devadm_devtoggle_${d.userId}`), Markup.button.callback('📂 Change Category', `devadm_devcat_${d.userId}`)],
      [Markup.button.callback('✏️ Name', `devadm_edit_name_${d.userId}`), Markup.button.callback('🔗 Username', `devadm_edit_user_${d.userId}`), Markup.button.callback('📝 Bio', `devadm_edit_bio_${d.userId}`)],
      [Markup.button.callback('🗑 Remove Developer', `devadm_devdel_${d.userId}`)],
      [Markup.button.callback('⬅️ Back', 'devadm_devs_0')]
    ]));
  }
  ownerAction(/^devadm_dev_(\d+)$/, async (ctx) => { await ctx.answerCbQuery(); await sendDev(ctx, ctx.match[1]); });
  ownerAction(/^devadm_devtoggle_(\d+)$/, async (ctx) => {
    const d = await fb.getDeveloper(ctx.match[1]); if (!d) return ctx.answerCbQuery('Not found.');
    await fb.updateDeveloper(d.userId, { active: !d.active });
    await ctx.answerCbQuery(d.active ? '🔴 Hidden' : '🟢 Live');
    await sendDev(ctx, d.userId);
  });
  ownerAction(/^devadm_devcat_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const cats = await fb.getDevCategories();
    const rows = cats.map(c => [Markup.button.callback(c.name, `devadm_setcat_${ctx.match[1]}_${c.id}`)]);
    rows.push([Markup.button.callback('⬅️ Back', `devadm_dev_${ctx.match[1]}`)]);
    await show(ctx, 'Nayi category chuno:', Markup.inlineKeyboard(rows));
  });
  ownerAction(/^devadm_setcat_(\d+)_(.+)$/, async (ctx) => {
    await fb.updateDeveloper(ctx.match[1], { category: ctx.match[2] });
    await ctx.answerCbQuery('✅ Updated');
    await sendDev(ctx, ctx.match[1]);
  });
  ownerAction(/^devadm_devdel_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('⚠️ Is developer ko list se hatana hai? (Wo "Become a Developer" se dobara apply kar sakta hai.)', Markup.inlineKeyboard([[
      Markup.button.callback('🗑 Haan, remove', `devadm_devdelok_${ctx.match[1]}`), Markup.button.callback('❌ Nahi', `devadm_dev_${ctx.match[1]}`)
    ]]));
  });
  ownerAction(/^devadm_devdelok_(\d+)$/, async (ctx) => {
    await fb.removeDeveloper(ctx.match[1]);
    await ctx.answerCbQuery('🗑 Removed');
    await sendDevs(ctx, 0);
  });


  // ---- ➕ Add a developer by hand (Telegram ID or @username + name) ----
  ownerAction(/^devadm_add$/, async (ctx) => {
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: 'devadm_addid', data: {} };
    await ctx.reply('➕ *Add Developer*\n\nUser ki *Telegram ID* bhejo (numbers). Agar wo bot use kar chuka hai to @username bhi chalega.', { parse_mode: 'Markdown' });
  });

  async function askAddCategory(ctx, st) {
    st.step = 'devadm_addpickcat';
    const cats = (await fb.getDevCategories()).filter(c => c.active);
    const rows = cats.map(c => [Markup.button.callback(c.name, `devadm_addcat_${c.id}`)]);
    rows.push([Markup.button.callback('🧩 Other (no category)', 'devadm_addcat_none')]);
    await ctx.reply('📂 Developer ki *category* chuno:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) });
  }
  async function afterAddCategory(ctx, st) {
    if (!st.data.username) {
      st.step = 'devadm_adduser';
      return ctx.reply('🔗 Developer ka Telegram *@username* bhejo (contact button ke liye), ya "skip":', { parse_mode: 'Markdown' });
    }
    st.step = 'devadm_addbio';
    return ctx.reply('📝 Skills / short bio bhejo (portfolio link bhi daal sakte ho), ya "skip":');
  }
  ownerAction(/^devadm_addcat_(dc_[a-z0-9]+|none)$/, async (ctx) => {
    const st = adminState[ctx.from.id];
    if (!st || st.step !== 'devadm_addpickcat') return ctx.answerCbQuery('Session expire ho gaya.', { show_alert: true });
    st.data.category = ctx.match[1] === 'none' ? null : ctx.match[1];
    await ctx.answerCbQuery('✅');
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (e) {}
    await afterAddCategory(ctx, st);
  });

  async function finishAdd(ctx, st) {
    const d = st.data;
    const links = (d.bio || '').match(/https?:\/\/\S+/);
    await fb.upsertDeveloper({
      userId: d.userId, name: d.name, username: d.username || '', category: d.category || null,
      bio: d.bio || '', portfolio: links ? links[0] : '', phone: '', active: true, addedByOwner: true
    });
    if (await fb.getUser(d.userId)) await fb.addUserBadge(d.userId, 'Developer');
    delete adminState[ctx.from.id];
    let told = true;
    try {
      await bot.telegram.sendMessage(d.userId, `${ui.banner('👨‍💻 DEVELOPER', '✦ YOU ARE LISTED ✦')}\n\nOwner ne aapko *💼 Hire a Developer* section mein add kar diya hai. Ab clients aapko yahan se contact kar sakte hain! 🎉`, { parse_mode: 'Markdown' });
    } catch (e) { told = false; }
    await ctx.reply(`✅ *${mdEscape(d.name)}* ab Hire a Developer mein listed hai.${told ? '' : '\n\n_(User ko message nahi ja paya — usne bot start nahi kiya hoga. Listing phir bhi live hai.)_'}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('👨‍💻 Open Developer', `devadm_dev_${d.userId}`)], [Markup.button.callback('⬅️ Back', 'admin_developers')]])
    });
  }

  // ---- edit name / username / bio of a developer ----
  const EDIT_PROMPTS = { name: '✏️ Developer ka naya naam bhejo:', user: '🔗 Naya Telegram @username bhejo (ya "remove" = hata do):', bio: '📝 Nayi bio / skills bhejo (portfolio link bhi chalega):' };
  ownerAction(/^devadm_edit_(name|user|bio)_(\d+)$/, async (ctx) => {
    if (!(await fb.getDeveloper(ctx.match[2]))) return ctx.answerCbQuery('Developer nahi mila.');
    await ctx.answerCbQuery();
    adminState[ctx.from.id] = { step: `devadm_edit${ctx.match[1]}`, data: { userId: ctx.match[2] } };
    await ctx.reply(EDIT_PROMPTS[ctx.match[1]]);
  });

  // ---- text steps ----
  async function handleText(ctx) {
    const st = adminState[ctx.from.id];
    if (!st || !st.step || !st.step.startsWith('devadm_') || !isOwner(ctx)) return false;
    const text = ctx.message.text.trim();
    if (/^(❌\s*)?cancel$/i.test(text) || text === '/cancel') { delete adminState[ctx.from.id]; await ctx.reply('❌ Cancel kar diya.'); return true; }
    const skip = /^skip$/i.test(text);
    const nameOk = text.length >= 2 && text.length <= 40;

    switch (st.step) {
      // categories (Hire a Developer)
      case 'devadm_addcat': {
        if (!nameOk) { await ctx.reply('⚠️ Naam 2 se 40 characters ka ho.'); return true; }
        const dup = (await fb.getDevCategories()).some(c => c.name.toLowerCase() === text.toLowerCase());
        if (dup) { await ctx.reply('⚠️ Yeh category pehle se hai.'); return true; }
        await fb.createDevCategory(text);
        delete adminState[ctx.from.id];
        await ctx.reply('✅ Category add ho gayi.');
        await sendCats(ctx);
        return true;
      }
      case 'devadm_rename': {
        if (!nameOk) { await ctx.reply('⚠️ Naam 2 se 40 characters ka ho.'); return true; }
        await fb.updateDevCategory(st.data.id, { name: text });
        delete adminState[ctx.from.id];
        await ctx.reply('✅ Category rename ho gayi.');
        await sendCat(ctx, st.data.id);
        return true;
      }

      // ➕ add a developer by hand
      case 'devadm_addid': {
        let id = null, known = null;
        if (/^\d{5,15}$/.test(text)) { id = text; known = await fb.getUser(text); }
        else if (/^@?[A-Za-z0-9_]{4,32}$/.test(text)) {
          const uname = text.replace(/^@/, '').toLowerCase();
          const hit = Object.entries(await fb.getAllUsers()).find(([, u]) => (u.username || '').toLowerCase() === uname);
          if (!hit) { await ctx.reply('⚠️ Yeh @username bot ke users mein nahi mila. Numeric *Telegram ID* bhejo.', { parse_mode: 'Markdown' }); return true; }
          id = String(hit[0]); known = hit[1];
        } else { await ctx.reply('⚠️ Sahi Telegram ID (numbers) ya @username bhejo.'); return true; }
        if (await fb.getDeveloper(id)) { delete adminState[ctx.from.id]; await ctx.reply('ℹ️ Yeh user pehle se developer hai — Developers list se manage karo.', Markup.inlineKeyboard([[Markup.button.callback('👨‍💻 Open Developer', `devadm_dev_${id}`)]])); return true; }
        st.data.userId = id; st.data.username = (known && known.username) || ''; st.data.knownName = (known && known.name) || '';
        st.step = 'devadm_addname';
        await ctx.reply(`✅ ID: \`${id}\`${known ? ` (${mdEscape(known.name || 'user')})` : ' (naya user)'}\n\n✏️ Developer ka *naam* bhejo (list mein yahi dikhega)${st.data.knownName ? `, ya "skip" = ${mdEscape(st.data.knownName)}` : ''}:`, { parse_mode: 'Markdown' });
        return true;
      }
      case 'devadm_addname': {
        if (skip && st.data.knownName) st.data.name = st.data.knownName.slice(0, 40);
        else if (!nameOk) { await ctx.reply('⚠️ Naam 2 se 40 characters ka ho.'); return true; }
        else st.data.name = text;
        await askAddCategory(ctx, st);
        return true;
      }
      case 'devadm_addpickcat':
        await ctx.reply('👆 Upar ke buttons se category chuno.');
        return true;
      case 'devadm_adduser': {
        if (!skip) {
          if (!/^@?[A-Za-z0-9_]{4,32}$/.test(text)) { await ctx.reply('⚠️ Sahi @username bhejo ya "skip".'); return true; }
          st.data.username = text.replace(/^@/, '');
        }
        st.step = 'devadm_addbio';
        await ctx.reply('📝 Skills / short bio bhejo (portfolio link bhi daal sakte ho), ya "skip":');
        return true;
      }
      case 'devadm_addbio': {
        if (!skip) {
          if (text.length > 600) { await ctx.reply('⚠️ Bio max 600 characters.'); return true; }
          st.data.bio = text;
        }
        await finishAdd(ctx, st);
        return true;
      }

      // edit an existing developer
      case 'devadm_editname': {
        if (!nameOk) { await ctx.reply('⚠️ Naam 2 se 40 characters ka ho.'); return true; }
        await fb.updateDeveloper(st.data.userId, { name: text });
        break;
      }
      case 'devadm_edituser': {
        if (/^remove$/i.test(text)) await fb.updateDeveloper(st.data.userId, { username: '' });
        else if (/^@?[A-Za-z0-9_]{4,32}$/.test(text)) await fb.updateDeveloper(st.data.userId, { username: text.replace(/^@/, '') });
        else { await ctx.reply('⚠️ Sahi @username bhejo ya "remove".'); return true; }
        break;
      }
      case 'devadm_editbio': {
        if (text.length > 600) { await ctx.reply('⚠️ Bio max 600 characters.'); return true; }
        const links = text.match(/https?:\/\/\S+/);
        await fb.updateDeveloper(st.data.userId, { bio: text, ...(links ? { portfolio: links[0] } : {}) });
        break;
      }
      default:
        return false;
    }
    // (edit cases fall through to here)
    delete adminState[ctx.from.id];
    await ctx.reply('✅ Update ho gaya.');
    await sendDev(ctx, st.data.userId);
    return true;
  }

  return { handleText };
}

module.exports = { setupDevelopers };
