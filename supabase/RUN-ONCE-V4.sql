-- ONE-TIME ML SPORTSWEAR V4 DATABASE UPDATE
-- Run this whole file in the SAME Supabase project.
-- Safe on existing V2/V3 databases.
-- Does not delete previous orders.

-- ML Sportswear V3: seven-step quotation, payment, production and delivery flow.
-- Execute AFTER supabase/schema.sql in Supabase SQL Editor on the SAME project.
-- Safe for existing V2 orders: all new order fields are nullable or have defaults.
-- Existing requests have no private tracking key until staff create one in the portal.

alter table public.orders
  add column if not exists tracking_token_hash text,
  add column if not exists quoted_total numeric(12,2),
  add column if not exists deposit_percent integer not null default 50,
  add column if not exists quote_notes text not null default '',
  add column if not exists gcash_instructions text not null default '',
  add column if not exists bank_instructions text not null default '',
  add column if not exists quote_issued_at timestamptz,
  add column if not exists customer_approved_at timestamptz,
  add column if not exists production_status text not null default 'not_started',
  add column if not exists delivery_status text not null default 'not_ready',
  add column if not exists delivery_reference text not null default '';

create unique index if not exists orders_tracking_token_hash_idx
on public.orders (tracking_token_hash) where tracking_token_hash is not null;

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stage text not null check (stage in ('initial','balance')),
  payment_option text not null check (payment_option in ('deposit','full','balance')),
  method text not null check (method in ('gcash','bank_transfer')),
  expected_amount numeric(12,2) not null check (expected_amount > 0),
  customer_reference text not null default '',
  proof_path text not null,
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists order_payments_order_id_idx on public.order_payments(order_id,created_at desc);
create unique index if not exists order_one_submitted_payment_idx
  on public.order_payments(order_id) where status = 'submitted';

alter table public.order_payments enable row level security;
revoke all on public.order_payments from anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('payment-proofs','payment-proofs',false,4194304,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=4194304,
 allowed_mime_types=array['image/png','image/jpeg','image/webp','application/pdf'];

-- Storage remains private and has no public read policies.
-- All customer operations require a long, random private access token verified by the server.
-- Never paste a real GCash number or bank account into this migration. Staff enter their own details per quotation.

-- Refresh the API schema cache after adding the new columns and table.
notify pgrst, 'reload schema';


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
