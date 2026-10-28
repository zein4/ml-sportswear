# ML Sportswear V4 – Simple Checkout

This version replaces the 7-step approval flow **for NEW orders**. Old V3 requests are still visible in the staff dashboard and retain their previous workflow.

## Customer experience
1. Customize Sando, T-Shirt, Shorts, or Jersey Set; upload logos and edit artwork.
2. Click **Continue to checkout**, enter contact + full delivery address.
3. Choose **Cash on Delivery** or **GCash / QR Ph**.
4. **COD** places the order immediately. No online payment or approval. Staff marks COD cash collected when delivering.
5. **GCash / QR Ph** opens a PayMongo-hosted secure checkout page, where the customer can scan a dynamic QR Ph code with GCash or select GCash. Provider-signed confirmation updates the order to **Paid** automatically. If they leave without paying, they can reopen the private tracking link to resume checkout.
6. Track production and delivery on `/track` using the private link.

## Install on your Windows laptop
1. Back up your `Documents\SD Project\ml-sportswear` folder.
2. Extract this ZIP. Its `ml-sportswear` folder is the new version. Keep your original `.git` directory and copy your existing `.env.local` into the new folder. **Never upload `.env.local` to GitHub.**
3. In Supabase > SQL Editor, run **`supabase/RUN-ONCE-V4.sql`** in the same ML Sportswear database. It includes the required V3 database setup and the new V4 fields. This can be run even if you already completed V3 SQL.
4. In VS Code, run `npm.cmd install`, `npm.cmd run build`, then `npm.cmd run dev`.
5. For LOCAL COD testing, open `http://localhost:3000/customize`, choose COD, submit, and check `/admin` and the private tracking link.

## Before PUBLIC checkout: confirm prices
The sample per-garment prices in **`lib/catalog.ts`** are DEMO RATES, not ML Sportswear's official charges. Confirm the actual business prices and delivery fee with the shop. Never accept real orders using placeholder prices. This version does not calculate shipping charges, so it is appropriate only when the business has confirmed a delivery-fee policy (for example, no additional fee, or an agreed separately charged courier fee). Don't promise customers an all-in charge until delivery cost is included.

In your local `.env.local` and in Vercel Production Environment Variables, add:

```
CHECKOUT_PRICING_CONFIRMED=true
```

**Only set this once the real prices, delivery conditions, and payment terms have been verified.** In Production, checkout is blocked until this flag is true. Remove it or set false to pause new checkouts.

## GCash / QR Ph — additional setup
Real automatic QR payments **require a payment provider**. The project is wired for **PayMongo Hosted Checkout v2** and their `checkout_session.payment.paid` webhook; it cannot charge a personal GCash QR directly or pretend a payment is confirmed.

Ask ML Sportswear to create a merchant account at PayMongo, complete any required verification, and enable GCash / QR Ph payment methods. In PayMongo dashboard obtain a TEST secret key first. In `.env.local` and Vercel, add:

```
PAYMONGO_SECRET_KEY=sk_test_YOUR_TEST_KEY
PAYMONGO_WEBHOOK_SECRET=YOUR_WEBHOOK_SIGNING_SECRET
```

Set up a PayMongo webhook subscribing to **`checkout_session.payment.paid`**, pointing to:

```
https://YOUR-REAL-VERCEL-DOMAIN.vercel.app/api/paymongo/webhook
```

This MUST be your public **HTTPS** Vercel domain, not localhost. Use the matching test or live webhook signing secret. Deploy and perform sandbox transactions, then switch to live credentials only after business approval and full verification. Save keys only on the server; **NEVER** prefix them with `NEXT_PUBLIC_`, or paste them into chat/screenshots.

Without `PAYMONGO_SECRET_KEY`, **COD still works**, but GCash checkout returns a clear "not configured" message. Without a working webhook, the order will **not** automatically update to Paid; do not treat the return URL as proof of payment. PayMongo may charge processing fees. The business should review rates and refunds before enabling real payments.

Official references:
- https://docs.paymongo.com/docs/payment-channels-hosted-checkout
- https://docs.paymongo.com/docs/developer-tools-webhook-setup-management

## Admin and compatibility
- `/admin` is still secured by Supabase staff login. New orders show the checkout method, payment status, address, and production/delivery controls.
- Staff cannot mark GCash orders as paid manually; only the provider-signed webhook does that.
- COD can go into production without an advance payment. When marked delivered, staff confirms actual cash collection; that single delivery confirmation marks it collected.
- Older V3 orders remain under the older review controls, and no old order is erased.

## Publishing updated code
After a local production build succeeds and you've tested the database:

```
git add .
git ls-files .env.local
# the command above MUST output nothing
git commit -m "Replace approvals with simple GCash QR and COD checkout"
git push origin main
```

Vercel then deploys the updated GitHub code. Add/update the server-only keys in Vercel before testing QR checkout.

## Limitations before accepting actual customers
- The QR system depends on PayMongo merchant eligibility, enabled QR Ph / GCash payment methods, and a valid signed webhook.
- This is a developer integration, not independently confirmed with a live transaction here. The full Next.js build and end-to-end browser test must be performed on the user's laptop.
- Delivery fees, configurable pricing, automatic customer email receipts, order cancellation/refunds, stock validation, spam/rate limiting, production capacity checks, and privacy/terms should be completed before a public commercial launch.
- QR Ph code is shown on the PayMongo-hosted payment page, not rendered as an image inside your website.
