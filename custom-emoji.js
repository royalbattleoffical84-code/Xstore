// Telegram Premium Custom Emoji support for Telegraf 4.x.
// Configure CUSTOM_EMOJI_MAP as JSON: {"⭐":"YOUR_CUSTOM_EMOJI_ID"}
function loadMap() {
  const raw = process.env.CUSTOM_EMOJI_MAP || '{}';
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([emoji, id]) =>
        typeof emoji === 'string' && emoji.length > 0 &&
        typeof id === 'string' && /^\d+$/.test(id)
      )
    );
  } catch (err) {
    console.error('⚠️ CUSTOM_EMOJI_MAP is invalid JSON. Custom emojis disabled:', err.message);
    return {};
  }
}

function addCustomEmojiEntities(text, existing = []) {
  if (typeof text !== 'string') return existing;
  const map = loadMap();
  if (!Object.keys(map).length) return existing;

  const found = [];
  let offset = 0; // JavaScript string offsets are UTF-16, as required by Telegram.
  for (const char of text) {
    const id = map[char];
    if (id) {
      found.push({
        type: 'custom_emoji',
        offset,
        length: char.length,
        custom_emoji_id: id
      });
    }
    offset += char.length;
  }
  return [...existing, ...found].sort((a, b) => a.offset - b.offset);
}

function installCustomEmojiSupport(telegram) {
  if (!telegram || typeof telegram.callApi !== 'function') {
    throw new Error('Unsupported Telegraf Telegram client: callApi not found');
  }
  if (telegram.__customEmojiInstalled) return;
  const originalCallApi = telegram.callApi.bind(telegram);

  telegram.callApi = function(method, payload = {}, signal) {
    const next = { ...payload };
    const textMethods = new Set(['sendMessage', 'editMessageText']);
    const captionMethods = new Set([
      'sendPhoto', 'sendVideo', 'sendAnimation', 'sendAudio',
      'sendDocument', 'sendVoice', 'editMessageCaption'
    ]);

    // Telegram does not allow parse_mode and entities together. Do not remove
    // Markdown/HTML formatting: leave those messages unchanged.
    if (!next.parse_mode) {
      if (textMethods.has(method) && typeof next.text === 'string') {
        const entities = addCustomEmojiEntities(next.text, next.entities || []);
        if (entities.length) next.entities = entities;
      } else if (captionMethods.has(method) && typeof next.caption === 'string') {
        const entities = addCustomEmojiEntities(next.caption, next.caption_entities || []);
        if (entities.length) next.caption_entities = entities;
      }
    }
    return originalCallApi(method, next, signal);
  };

  Object.defineProperty(telegram, '__customEmojiInstalled', { value: true });
  console.log(`✨ Premium custom emoji support ready (${Object.keys(loadMap()).length} emoji mappings).`);
}

module.exports = { installCustomEmojiSupport, addCustomEmojiEntities };
