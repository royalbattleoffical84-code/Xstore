# Telegram Premium Custom Emoji Setup

The bot can import a Telegram custom-emoji pack at runtime and use matching emojis in the welcome message.

## Render environment variables

Add:

- `CUSTOM_EMOJI_SET_NAME` = `DSPSIR_by_TgEmojis_bot`
- `CUSTOM_EMOJI_MAP` = `{}` (optional; use this only for manual overrides)

The set name is the part after `https://t.me/addemoji/` in the pack link. Do not include the full URL.

## How it works

When a welcome message is sent, the bot calls Telegram's `getStickerSet` API, reads each sticker's `emoji` and `custom_emoji_id`, and builds a mapping automatically. Matching emoji characters in the welcome message are rendered with Telegram's `<tg-emoji>` HTML entity. Manual entries in `CUSTOM_EMOJI_MAP` override imported entries.

Example manual override:

```json
{"✅":"6156939810427640445"}
```

## Important

- Only emoji characters that exist in the selected pack and exactly match characters in the welcome text can be replaced.
- The pack is fetched by the bot at runtime; this ZIP cannot verify the pack's contents without the bot token.
- The bot account owner must meet Telegram's custom-emoji sending eligibility requirements.
- This change applies to the welcome message send paths. It does not automatically rewrite every unrelated message in the project or keyboard button labels.
- Check Render logs for `Custom emoji pack loaded` or `Could not load custom emoji pack` after testing `/start`.
