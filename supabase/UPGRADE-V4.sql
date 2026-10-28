-- ML Sportswear V4: streamlined checkout; run AFTER UPGRADE-V3.sql.
-- Keeps historical quotation/payment records untouched.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_method text,
  ADD COLUMN IF NOT EXISTS checkout_status text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS delivery_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS paymongo_checkout_id text,
  ADD COLUMN IF NOT EXISTS paymongo_checkout_url text,
  ADD COLUMN IF NOT EXISTS paymongo_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS orders_paymongo_checkout_idx ON public.orders(paymongo_checkout_id)
  WHERE paymongo_checkout_id IS NOT NULL;
-- Old quotation orders remain legacy; new orders use 'cod' or 'qrph'.
NOTIFY pgrst, 'reload schema';
