import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { allPricesReady, getLivePrices } from '@/lib/garment-prices';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Pricing service unavailable.' }, { status: 503, headers: {'Cache-Control':'no-store'} });
  try {
    const prices = await getLivePrices(db);
    if (!allPricesReady(prices)) return NextResponse.json({ error: 'The shop is setting up its official prices. Please check again later.' }, { status: 503, headers: {'Cache-Control':'no-store'} });
    return NextResponse.json({ prices }, { headers: {'Cache-Control':'no-store'} });
  } catch (e) {
    console.error('Public pricing lookup failed:', e);
    return NextResponse.json({ error: 'Could not load prices. Ask staff to run the price-table upgrade.' }, { status: 503, headers: {'Cache-Control':'no-store'} });
  }
}
