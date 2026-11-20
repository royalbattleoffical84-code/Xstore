# ORVIX STORE — ORVIX PAY integration

This update changes the existing payment adapter used by the Telegram bot and Mini App to call ORVIX PAY.

## What changed
- Server-side `POST /create-order` using `api_token`, `amount`, `order_id` and optional `redirect_url`.
- Customers are sent to the returned `payment_url`.
- Server-side `POST /order-status` polling; only verified `success` can continue the existing fulfilment flow.
- `pending` remains pending; `failed`, `expired`, `refunded`, and `cancelled` are non-success.
- Status lookup retries once after a short delay. Order creation is not automatically retried after an ambiguous network failure, to avoid duplicate payment orders.
- If ORVIX PAY reports an amount, it is checked against the store order amount before fulfilment.
- A successful order is fulfilled only when its recorded environment is explicitly `live` or `production`. Test-mode success never delivers products or credits wallets.
- API token is read only from `ORVIX_PAY_TOKEN` in the Node host environment.
- Existing `fampay.js` filename and exported function names are retained so existing call sites keep working.

## Hosting setup (Node 18+)
1. Back up the current ORVIX STORE files and JSON/database storage.
2. Extract this ZIP and upload the contents of `Xstore-main/` over the existing project folder, replacing the included files. Do not delete your existing data/storage files.
3. In the Node hosting dashboard, open Environment Variables and add:
   - `ORVIX_PAY_TOKEN` = your ORVIX PAY merchant API token
   - `ORVIX_PAY_BASE_URL` = `https://codertufan.bond/api`
4. Optional: set `ORVIX_PAY_REDIRECT_URL` to an HTTPS page on your own site. It is not required for the bot checkout flow.
5. Redeploy/restart the Node service.
6. In ORVIX PAY merchant settings, choose Test or Live API Environment before creating test orders. The gateway documentation says the selected environment is stored on each newly created order. The adapter stores that value and refuses fulfilment unless status verification confirms `live`/`production`. Use a test token/account for test orders and the live token/account for live orders if your gateway issues separate credentials.
7. Make a low-value test order and confirm the order in ORVIX PAY's dashboard. Check the bot only delivers after `/order-status` reports `success`.

## Important
- Never put the API token in `miniapp.html`, browser JavaScript, Telegram messages, or screenshots.
- Never mark an order paid based on the customer returning to the redirect page.
- Do not manually retry a create-order request after a timeout until you have checked the ORVIX PAY dashboard for the supplied `order_id`.
- This patch follows the API shape visible in the supplied ORVIX PAY documentation recording. If the live API response uses different field names or content type, the adapter will leave the order unfulfilled and log the response for diagnosis.
