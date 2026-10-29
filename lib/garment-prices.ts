import type { SupabaseClient } from '@supabase/supabase-js';
import { GARMENTS, SIZES, type GarmentId, type Size, type SizeCounts } from './catalog';

// Each garment and size has its own price. Missing prices disable checkout rather
// than silently falling back to old sample values.
export type SizePriceMap = Record<Size, number>;
export type LivePrices = Record<GarmentId, SizePriceMap>;
export type PartialLivePrices = Partial<Record<GarmentId, Partial<SizePriceMap>>>;

export function validPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1000000 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.00001;
}
export async function getLivePrices(db: SupabaseClient): Promise<PartialLivePrices> {
  const {data,error} = await db.from('garment_size_prices').select('garment_id,size,unit_price');
  if (error) throw new Error('Cannot load garment_size_prices: '+error.message);
  const result: PartialLivePrices = {};
  for (const row of data || []) {
    if (!GARMENTS.some(g=>g.id === row.garment_id) || !SIZES.some(s=>s === row.size)) continue;
    const n=Number(row.unit_price);
    if (!validPrice(n)) continue;
    const g=row.garment_id as GarmentId;
    result[g] ??= {};
    result[g]![row.size as Size]=n;
  }
  return result;
}
export function allPricesReady(prices: PartialLivePrices): prices is LivePrices {
  return GARMENTS.every(g => SIZES.every(size=>validPrice(prices[g.id]?.[size])));
}
export function itemTotal(prices: PartialLivePrices, garment: GarmentId, quantities: SizeCounts): number | null {
  let cents=0;
  for (const size of SIZES) {
    if (!validPrice(prices[garment]?.[size])) return null;
    cents += Math.round(prices[garment]![size]! * 100) * quantities[size];
  }
  return cents / 100;
}
export function lowestPrice(prices: PartialLivePrices, garment: GarmentId): number | null {
  const values=SIZES.map(s=>prices[garment]?.[s]).filter(validPrice);
  return values.length ? Math.min(...values) : null;
}
