# ORVIX STORE — Advanced feature update

This build is based on the previous V2 package, retaining its channel URL normalization and order-before-QR initialization fixes.

## Product categories
- Add Product now displays existing categories for owners and staff.
- Staff and owners can select an existing category, add a new category, or type a category manually.
- Categories are persisted in the `storeCategories` collection and combined with categories already used by products.
- Owner Admin Panel includes Category Management: add, rename (renames the category on existing products), and delete only when no product uses the category.

## Broadcast improvements
- A confirmation preview appears before sending.
- Delivery is sequential and paced at approximately 22 recipients/second.
- Each recipient's sent/failed state is checkpointed to persistent storage.
- Successful recipients are skipped when a worker resumes; failed recipients can be retried from Broadcast History.
- Telegram 429 `retry_after` and transient network/server errors receive bounded retries.
- Markdown entity errors fall back to plain text.
- Broadcast History shows sent/failed progress and a Retry Failed action.
- Old unfinished broadcasts without recipient checkpoints are paused instead of being replayed and accidentally duplicating messages.

## Exactly-once limitation
Telegram's send APIs do not expose an idempotency key. If the process crashes after Telegram accepts a message but before the per-user checkpoint is committed, that one recipient may receive a duplicate on resume. Durable checkpoints minimize this window but cannot mathematically guarantee exactly-once delivery.

## Deployment
Replace the project files with the contents of this ZIP, commit/push to the connected GitHub repository, and deploy on Render. Keep existing environment variables unchanged. No new environment variables are required.
