import { NextResponse } from 'next/server';
import { supabaseAdmin, supabasePublic } from '@/lib/supabase-server';
import { GARMENTS } from '@/lib/catalog';
import { getLivePrices } from '@/lib/garment-prices';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (error: string, status: number) => NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
async function authorize(request:Request) {
  const db = supabaseAdmin(), publicDb = supabasePublic();
  if (!db || !publicDb) return { response: reply('Supabase is not configured.',503) };
  const access = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!access) return { response: reply('Please sign in as staff.',401) };
  const {data:auth,error:authError} = await publicDb.auth.getUser(access);
  if (authError || !auth.user) return {response:reply('Staff login expired.',401)};
  const { data:record,error:staffError } = await db.from('admin_users').select('id').eq('id',auth.user.id).maybeSingle();
  if (staffError || !record) return { response: reply('Not authorized to manage shop prices.',403) };
  return {db, adminId:auth.user.id};
}
export async function GET(request:Request) {
  const auth = await authorize(request); if (auth.response) return auth.response;
  try {
    return NextResponse.json({ prices: await getLivePrices(auth.db!) },{headers:{'Cache-Control':'no-store'}});
  } catch (e) { console.error('Staff price listing:',e); return reply('Could not load prices. Run UPGRADE-ADMIN-PRICES.sql in Supabase.',500); }
}
export async function PATCH(request:Request) {
  const auth = await authorize(request); if (auth.response) return auth.response;
  let input:unknown;
  try {input=await request.json();} catch {return reply('Invalid request.',400);}
  if (!input || typeof input !== 'object') return reply('Invalid pricing details.',400);
  const {garmentId,unitPrice}=input as Record<string,unknown>;
  if (typeof garmentId !== 'string' || !GARMENTS.some(g=>g.id===garmentId)) return reply('Choose a valid garment.',400);
  // Reject text, zero, negative, infinity, too many decimals, and unrealistic amounts.
  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 1000000 || Math.abs(unitPrice*100-Math.round(unitPrice*100))>0.00001) {
    return reply('Enter a price above ₱0, up to two decimal places.',400);
  }
  const cleaned = Math.round(unitPrice*100)/100;
  const {error} = await auth.db!.from('garment_prices').upsert({garment_id:garmentId,unit_price:cleaned,updated_by:auth.adminId,updated_at:new Date().toISOString()},{onConflict:'garment_id'});
  if (error) {console.error('Admin pricing update failed:',error);return reply('Unable to save price. Check the Supabase table and try again.',500);}
  return NextResponse.json({ok:true,garmentId,unitPrice:cleaned},{headers:{'Cache-Control':'no-store'}});
}
