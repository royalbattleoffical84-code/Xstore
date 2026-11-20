'use strict';

const MarkdownIt = require('markdown-it');

// Telegram supports custom emoji in HTML mode via <tg-emoji emoji-id="...">.
// This patch is installed once on the shared Telegraf Telegram client, so it
// covers bot.telegram.* and ctx.reply/edit methods throughout the project.
const markdown = new MarkdownIt({ html: false, linkify: false, breaks: false, typographer: false });

function loadEmojiMap(raw = process.env.CUSTOM_EMOJI_MAP || '{}') {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error('⚠️ CUSTOM_EMOJI_MAP is not valid JSON. Custom emojis are disabled.');
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error('⚠️ CUSTOM_EMOJI_MAP must be a JSON object. Custom emojis are disabled.');
    return {};
  }
  const valid = {};
  for (const [emoji, id] of Object.entries(parsed)) {
    if (emoji && /^\d+$/.test(String(id))) valid[emoji] = String(id);
    else console.warn(`⚠️ Ignoring invalid custom emoji mapping for ${emoji || '(empty key)'}`);
  }
  return valid;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createCustomEmojiSupport(telegram, options = {}) {
  if (!telegram || typeof telegram.callApi !== 'function') {
    throw new TypeError('A valid Telegraf Telegram client is required');
  }
  if (telegram.__customEmojiSupportInstalled) return;

  const emojiMap = loadEmojiMap(options.mapJson);
  const entries = Object.entries(emojiMap).sort((a, b) => b[0].length - a[0].length);
  const originalCallApi = telegram.callApi.bind(telegram);

  function replaceMappedEmoji(text) {
    let result = String(text);
    for (const [emoji, id] of entries) {
      // The emoji itself is trusted configuration; the ID is digits-only.
      result = result.split(emoji).join(`<tg-emoji emoji-id="${id}">${emoji}</tg-emoji>`);
    }
    return result;
  }

  function preparePayload(method, payload) {
    if (!payload || typeof payload !== 'object' || entries.length === 0) return payload;

    const textKeys = ['text', 'caption'];
    const hasText = textKeys.some((key) => typeof payload[key] === 'string');
    const hasMediaCaptions = Array.isArray(payload.media) && payload.media.some((item) => item && typeof item.caption === 'string');
    if (!hasText && !hasMediaCaptions) return payload;

    // Telegram entity offsets are UTF-16 based. Do not alter messages which
    // already carry entities because changing text would invalidate offsets.
    if (payload.entities || payload.caption_entities) return payload;

    const parseMode = String(payload.parse_mode || '').toLowerCase();
    // MarkdownV2 has different escaping rules; leave it untouched rather than
    // silently corrupting a message. This project primarily uses legacy Markdown.
    if (parseMode === 'markdownv2') return payload;

    const next = { ...payload };
    let changed = false;

    function transformText(original, mode) {
      if (typeof original !== 'string' || !entries.some(([emoji]) => original.includes(emoji))) return original;
      let html;
      if (mode === 'markdown') {
        // Convert legacy Markdown to Telegram-compatible HTML before adding
        // tg-emoji tags. renderInline avoids unsupported paragraph wrappers.
        html = markdown.renderInline(original);
      } else if (mode === 'html') {
        html = original;
      } else {
        html = escapeHtml(original);
      }
      changed = true;
      return replaceMappedEmoji(html);
    }

    for (const key of textKeys) {
      if (typeof next[key] === 'string') next[key] = transformText(next[key], parseMode);
    }

    // Album captions are nested in the `media` array for sendMediaGroup.
    if (Array.isArray(next.media)) {
      next.media = next.media.map((item) => {
        if (!item || typeof item.caption !== 'string' || item.caption_entities) return item;
        const itemMode = String(item.parse_mode || parseMode || '').toLowerCase();
        if (itemMode === 'markdownv2') return item;
        return { ...item, caption: transformText(item.caption, itemMode) };
      });
    }

    if (!changed) return payload;

    // HTML is required for Telegram's tg-emoji tag. Existing Markdown messages
    // are converted above; plain text is safely HTML-escaped above.
    next.parse_mode = 'HTML';
    return next;
  }

  telegram.callApi = function patchedCallApi(method, payload, signal) {
    try {
      const prepared = preparePayload(method, payload);
      return originalCallApi(method, prepared, signal);
    } catch (error) {
      // Never let optional emoji formatting prevent the bot from sending.
      console.error('Custom emoji formatting failed; sending original message:', error.message);
      return originalCallApi(method, payload, signal);
    }
  };

  Object.defineProperty(telegram, '__customEmojiSupportInstalled', { value: true });
  console.log(`✨ Custom emoji support ready (${entries.length} mapping(s)).`);
}

module.exports = { createCustomEmojiSupport, loadEmojiMap };
