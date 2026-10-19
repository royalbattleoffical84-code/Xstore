// ============================================================
// MESSAGE DECORATION  —  one place for the bot's "framed" look
// ============================================================
// Style: ╔═ banner ═╗ at the top, ✦ accents, ❖ / emoji bullets, a ━━━ divider,
// and a closing  ┌『 ribbon 』 / └─ footer  pair.
// Change STORE_NAME via the STORE_NAME env var (default: ORVIX STORE).

const STORE_NAME = (process.env.STORE_NAME || 'ORVIX STORE').trim();

// Same escaping the rest of the bot uses for Markdown messages
const md = (t) => (t === undefined || t === null ? '' : String(t).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1'));

const W = 20;
const TOP = '╔' + '═'.repeat(W) + '╗';
const BOT = '╚' + '═'.repeat(W) + '╝';
const BAR = '━'.repeat(W + 2);

const banner = (...lines) => [TOP, ...lines.map(l => '  ' + l), BOT].join('\n');
const ribbon = (t) => `┌──────『 ${t} 』`;
const foot = (t) => `└─ ${t}`;
const boxed = (t) => `╭${'─'.repeat(W - 2)}╮\n  ${t}\n╰${'─'.repeat(W - 2)}╯`;
const priceLabel = (p) => (p.price === 0 ? 'FREE 🎁' : `₹${p.price}`);
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

// ---------- welcome (used as the default + by the "apply style" button) ----------
function welcomeTemplate() {
  return [
    banner(`🛍 ${STORE_NAME}`, '✦ DIGITAL MARKETPLACE ✦'),
    '',
    '⭐ *WELCOME, {name}!* 🚀',
    '',
    boxed('💎 Quality products, instant delivery'),
    '',
    '🌟 *Why shop with us*',
    '❖ Handpicked premium quality',
    '🛍 Paid & free collections',
    '💳 Secure UPI payments',
    '⚡ Instant auto delivery',
    '🛡 Friendly support',
    BAR,
    ribbon('🚀 START HERE'),
    foot('👇 Choose an option below')
  ].join('\n');
}

// ---------- new product broadcast (Markdown) ----------
function newProduct(p) {
  return [
    banner('🆕 NEW ARRIVAL', '✦ JUST ADDED ✦'),
    '',
    `✨ *${md(p.name)}*`,
    `💰 ${md(priceLabel(p))}`,
    p.category ? `📁 ${md(p.category)}` : null,
    p.description ? `\n${md(clip(p.description, 300))}` : null,
    '',
    BAR,
    ribbon('👀 CHECK IT OUT'),
    foot('Neeche button dabao')
  ].filter(x => x !== null).join('\n');
}

// ---------- delivery (PLAIN text: links/underscores must not hit Markdown) ----------
const THANKS = {
  en: ['🙏 THANK YOU', 'Thank you for your purchase!'],
  hi: ['🙏 धन्यवाद', 'आपकी खरीदारी के लिए धन्यवाद!'],
  hg: ['🙏 THANK YOU', 'Aapki purchase ke liye shukriya!']
};
function deliveredPlain(name, link, lang) {
  const t = THANKS[lang] || THANKS.hg;
  return [
    banner('📦 ORDER DELIVERED'),
    '',
    `🛍 ${clip(name, 120)}`,
    link ? `\n🔗 ${lang === 'hi' ? 'डाउनलोड लिंक' : 'Download Link'}:\n${link}` : null,
    '',
    BAR,
    ribbon(t[0]),
    foot(t[1])
  ].filter(x => x !== null).join('\n');
}

function giftPlain({ name, from, link }) {
  return [
    banner('🎁 GIFT RECEIVED', '✦ SPECIAL FOR YOU ✦'),
    '',
    `🛍 Product: ${clip(name, 120)}`,
    `💝 From: ${clip(from, 60)}`,
    link ? `\n🔗 Download Link:\n${link}` : null,
    '',
    BAR,
    ribbon('🎉 ENJOY'),
    foot('Is gift ka maza lo!')
  ].filter(x => x !== null).join('\n');
}

// ---------- staff-related (Markdown) ----------
function staffWelcome() {
  return [
    banner('🎉 CONGRATULATIONS', '✦ YOU ARE STAFF NOW ✦'),
    '',
    'Owner ne aapki request approve kar di.',
    '',
    '❖ Main menu mein *🛠 Staff Panel* button hai',
    '❖ Wahin se products add karo',
    '❖ Products owner ke approval ke baad live honge',
    BAR,
    ribbon('🚀 ALL SET'),
    foot('Staff Panel kholo aur shuru karo')
  ].join('\n');
}

function productApproved(name) {
  return [banner('✅ PRODUCT APPROVED'), '', `✨ *${md(name)}*`, 'Ab store mein live hai! 🎉', '', ribbon('🛍 LIVE'), foot('Users ko notification bhej di gayi')].join('\n');
}

function productRejected(name) {
  return [banner('❌ PRODUCT REJECTED'), '', `✨ *${md(name)}*`, 'Owner ne reject kar diya.', '', ribbon('✏️ WHAT NEXT'), foot('Staff Panel → Products se edit karke dobara bhejo')].join('\n');
}

function staffRequestCard(r, feeInfo) {
  return [
    banner('🧑‍💼 STAFF REQUEST', '✦ NEW APPLICATION ✦'),
    '',
    `👤 Name: *${md(r.fullName)}*`,
    `📱 Phone: \`${r.phone}\``,
    `🆔 ID: \`${r.userId}\``,
    r.username ? `🔗 @${md(r.username)}` : null,
    `🙋 Telegram name: ${md(r.tgName)}`,
    feeInfo ? `💰 ${feeInfo}` : null,
    '',
    `💬 ${md(r.note)}`,
    '',
    BAR,
    ribbon('👇 DECISION'),
    foot('Approve ya Reject karo')
  ].filter(x => x !== null).join('\n');
}

function productSubmission(p, isResubmit, stockLabel, delivery) {
  return [
    banner('🆕 APPROVAL NEEDED', isResubmit ? '✦ EDITED PRODUCT ✦' : '✦ NEW SUBMISSION ✦'),
    '',
    `👤 Staff: *${md(p.submittedByName || 'Staff')}* (\`${p.submittedBy}\`)`,
    `📦 *${md(p.name)}*`,
    `💰 ₹${p.price}`,
    `📁 ${md(p.category)}`,
    `📦 Stock: ${stockLabel}`,
    delivery,
    '',
    md(clip(p.description || '', 500)),
    '',
    BAR,
    ribbon('👇 DECISION'),
    foot('Approve ya Reject karo')
  ].join('\n');
}

function giftSent({ name, to, by }) {
  return [banner('🎁 GIFT SENT', '✦ DELIVERED ✦'), '', `🛍 ${md(clip(name, 100))}`, `👤 To: \`${to}\``, by ? `🧑‍💼 By: ${md(by)}` : null, '', ribbon('✅ DONE'), foot('User ko product mil gaya')].filter(x => x !== null).join('\n');
}

function featureRequestCard(req, feeInfo) {
  const qa = (req.answers || []).map((x, i) => `*Q${i + 1}.* ${md(x.q)}\n➜ ${md(x.a)}`).join('\n\n');
  return [
    banner('🧩 NEW APPLICATION', `✦ ${req.featureTitle} ✦`.slice(0, 40)),
    '',
    `👤 ${md(req.tgName || 'User')}${req.username ? ' (@' + md(req.username) + ')' : ''}`,
    `🆔 \`${req.userId}\``,
    req.phone ? `📱 \`${req.phone}\`` : null,
    feeInfo ? `💰 ${feeInfo}` : null,
    '',
    qa || '_(koi sawal nahi)_',
    '',
    BAR,
    ribbon('👇 DECISION'),
    foot('Approve ya Reject karo')
  ].filter(x => x !== null).join('\n');
}

function featureApproved(title, rewardLine, customMsg) {
  return [
    banner('✅ APPROVED', `✦ ${title} ✦`.slice(0, 40)),
    '',
    customMsg ? md(customMsg) : 'Aapki request approve ho gayi! 🎉',
    rewardLine ? `\n${rewardLine}` : null,
    '',
    ribbon('🚀 ENJOY'),
    foot('Home menu se aage badho')
  ].filter(x => x !== null).join('\n');
}

module.exports = {
  featureRequestCard, featureApproved,
  STORE_NAME, md, banner, ribbon, foot, boxed, BAR, clip,
  welcomeTemplate, newProduct, deliveredPlain, giftPlain,
  staffWelcome, productApproved, productRejected, staffRequestCard, productSubmission, giftSent
};
