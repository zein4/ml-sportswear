-- ML Sportswear / Admin price editor. Run ONCE in the existing Supabase project.
-- IMPORTANT: No demo rates are inserted. Enter the SHOP'S APPROVED prices in /admin.
-- Until all four prices have been set, public checkout is unavailable.
create table if not exists public.garment_prices (
  garment_id text primary key check (garment_id in ('sando','tshirt','shorts','set')),
  unit_price numeric(12,2) not null check (unit_price > 0 and unit_price <= 1000000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.garment_prices enable row level security;
-- All reads/writes go through server endpoints. Do NOT grant direct browser writes.
revoke all on public.garment_prices from anon, authenticated;
-- Service key used exclusively by Next.js server after checking public.admin_users.
