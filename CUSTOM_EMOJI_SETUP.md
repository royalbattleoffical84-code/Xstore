# Telegram Premium Custom Emoji Setup

The bot now has centralized custom-emoji formatting for Telegram text and caption API calls made through the shared Telegraf client. It covers `ctx.reply`, `ctx.editMessageText`, `bot.telegram.sendMessage`, photo/document/video captions, and broadcast/notification messages when those calls use the shared bot instance.

## Render environment variable

Add exactly one variable:

- **Key:** `CUSTOM_EMOJI_MAP`
- **Value before you collect IDs:** `{}`

After collecting real IDs, set a JSON object where each key is the exact emoji character and each value is its numeric `custom_emoji_id`. Example (IDs below are placeholders):

```json
{"⭐":"YOUR_NUMERIC_EMOJI_ID","🔥":"YOUR_OTHER_NUMERIC_EMOJI_ID","💎":"YOUR_DIAMOND_EMOJI_ID"}
```

Replace every placeholder with the real numeric ID. Do not include comments or trailing commas; the value must be valid JSON.

## How it works

- Plain text is HTML-escaped safely and sent in Telegram HTML mode when a mapped emoji is present.
- Existing legacy `parse_mode: Markdown` messages are converted from inline Markdown to HTML before the custom emoji tag is inserted.
- Existing HTML messages keep their HTML and receive the custom emoji tag.
- Messages with pre-existing `entities` / `caption_entities` are left unchanged so their UTF-16 entity offsets are not corrupted.
- `MarkdownV2` messages are left unchanged to avoid breaking their distinct escaping rules.
- Inline keyboard button labels and callback-query alert text are not changed: Telegram does not support custom-emoji entities in those fields in the same way as message text.

## Deploy

1. Upload all updated project files to the same GitHub repository used by Render.
2. Render installs `markdown-it` automatically from `package.json` during its normal build/install step.
3. Add `CUSTOM_EMOJI_MAP` in Render → your service → Environment.
4. Save and redeploy.
5. Check logs for `Custom emoji support ready (N mapping(s)).`

If the map is `{}`, support is installed but no premium emoji substitutions will occur. Use IDs extracted from actual Telegram messages containing custom emoji entities. Keep your `BOT_TOKEN` and other secrets private.
