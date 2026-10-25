-- ML Sportswear / Supabase schema
-- Run ONCE in Supabase > SQL Editor > New query.
-- Service-role server routes handle customer order inserts.
-- Customer data, orders and uploaded artwork are NOT publicly readable.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  garment text not null check (garment in ('sando','tshirt','shorts','set')),
  color text not null,
  accent_color text not null,
  print_color text not null,
  player_name text not null default '',
  player_number text not null default '',
  team_name text not null default '',
  sizes jsonb not null,
  quantity integer not null check (quantity between 1 and 100),
  roster text not null default '',
  notes text not null default '',
  contact_name text not null,
  email text not null,
  phone text not null,
  organization text not null default '',
  estimated_total numeric(12,2) not null check (estimated_total >= 0),
  artwork_layout jsonb not null default '{}'::jsonb,
  front_design_path text,
  back_design_path text,
  status text not null default 'new' check (status in ('new','reviewing','quoted','approved','in_production','completed','cancelled'))
);

-- Run this on existing databases too, to add the editable layout column safely.
alter table public.orders add column if not exists artwork_layout jsonb not null default '{}'::jsonb;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;
alter table public.admin_users enable row level security;
-- No anon or authenticated SELECT/INSERT policies by design.
-- Server-side service role bypasses RLS only after verifying staff identity for admin routes.

revoke all on public.orders from anon, authenticated;
revoke all on public.admin_users from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-uploads','design-uploads',false,4194304,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit=4194304, allowed_mime_types=array['image/png','image/jpeg','image/webp'];

-- IMPORTANT: After making a staff account using Supabase Authentication > Users,
-- copy their UUID and run the following separately with the ACTUAL UUID:
-- insert into public.admin_users (id) values ('REPLACE_WITH_REAL_USER_UUID');
