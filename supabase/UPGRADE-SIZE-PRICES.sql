-- ML Sportswear size-based garment pricing. Run once in EXISTING Supabase SQL Editor.
-- Preserves order records, customer accounts, and the previous garment_prices table.
CREATE TABLE IF NOT EXISTS public.garment_size_prices (
  garment_id text NOT NULL CHECK (garment_id IN ('sando','tshirt','shorts','set')),
  size text NOT NULL CHECK (size IN ('XS','S','M','L','XL','2XL')),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0 AND unit_price <= 1000000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (garment_id,size)
);
ALTER TABLE public.garment_size_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.garment_size_prices FROM anon, authenticated;
-- Only carry across REAL prices already entered by the shop owner in V8.
-- All six sizes initially inherit each garment's old price, then staff can edit sizes independently.
-- If V8 is not installed, execute UPGRADE-ADMIN-PRICES.sql first.
INSERT INTO public.garment_size_prices (garment_id,size,unit_price)
SELECT g.garment_id, s.size, g.unit_price
FROM public.garment_prices AS g
CROSS JOIN (VALUES ('XS'),('S'),('M'),('L'),('XL'),('2XL')) AS s(size)
WHERE g.garment_id IN ('sando','tshirt','shorts','set')
ON CONFLICT (garment_id,size) DO NOTHING;
-- Inspect before enabling live sales:
SELECT garment_id,size,unit_price FROM public.garment_size_prices
ORDER BY garment_id, array_position(ARRAY['XS','S','M','L','XL','2XL'],size);
