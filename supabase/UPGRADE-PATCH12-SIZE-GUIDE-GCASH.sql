-- PATCH 12 — RUN ONCE in the CURRENT ML Sportswear Supabase project.
-- Does not delete or replace orders, users, product prices, or existing files.
CREATE TABLE IF NOT EXISTS public.storefront_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  size_chart jsonb NOT NULL DEFAULT '{}'::jsonb,
  gcash_qr_path text,
  gcash_name text NOT NULL DEFAULT '',
  gcash_number text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storefront_settings FROM anon, authenticated;
INSERT INTO public.storefront_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
-- The QR is intended to be publicly visible to customers. Uploads remain server-side staff-only.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('ml-gcash-qr','ml-gcash-qr',true,2097152,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=true,file_size_limit=2097152,allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp'];
-- No storage upload/update/delete policies for anon or authenticated users.
-- Only validated staff API requests using the server service role can upload or replace QR files.
NOTIFY pgrst, 'reload schema';
