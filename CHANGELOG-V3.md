# V3 — Seven-Step Order Workflow

Keeps the V2 garment editor, dark mode, existing customer quotation fields, private logo storage, and protected Supabase staff login.

**New pages:** `/track`, revamped `/success`, and enhanced `/admin`.

**New backend:** private customer tracking and approval API, manual payment-proof upload API, staff quote/payment/fulfillment actions, payment record audit trail, and restricted private receipt URLs.

**New database migration:** `supabase/UPGRADE-V3.sql` adds quote/fulfillment columns, `order_payments`, and private `payment-proofs` bucket. It preserves existing rows.

**Payment policy:** manual GCash/bank transfer only. The site does not collect, send or automatically verify money. Staff verify payments against actual account balances. A quoted price is required before customer approval, approval is required before payment proof, verified initial payment is required before production, and verified full balance is required before shipped/delivered status.

**Private customer access:** each NEW order returns a single-use-displayed customer link with a random 256-bit secret in the URL fragment. The server stores a hash of that secret. Existing orders require a staff-issued tracking link. Lost links can be rotated, invalidating the old link. No unauthenticated database read policies are added.

**Limitations:** no automated customer messages, online checkout, refunds, tax calculation, carrier tracking API, spam rate limiting, or full browser/build validation in this environment. These are future enhancements.
