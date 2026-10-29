import type { SupabaseClient } from '@supabase/supabase-js';
import { GARMENTS, type GarmentId } from './catalog';

export type LivePrices = Record<GarmentId, number>;
export async function getLivePrices(db: SupabaseClient): Promise<Partial<LivePrices>> {
  const { data, error } = await db.from('garment_prices').select('garment_id,unit_price');
  if (error) throw new Error('Cannot load garment_prices: ' + error.message);
  const prices: Partial<LivePrices> = {};
  for (const row of data || []) {
    if (!GARMENTS.some(g => g.id === row.garment_id)) continue;
    const price = Number(row.unit_price);
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) continue;
    prices[row.garment_id as GarmentId] = price;
  }
  return prices;
}
export function allPricesReady(prices: Partial<LivePrices>): prices is LivePrices {
  return GARMENTS.every(g => typeof prices[g.id] === 'number' && Number.isFinite(prices[g.id]));
}
