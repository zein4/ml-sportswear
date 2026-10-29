import { NextResponse } from 'next/server';
import { supabaseAdmin, supabasePublic } from '@/lib/supabase-server';
import { GARMENTS, SIZES, type GarmentId, type Size } from '@/lib/catalog';
import { getLivePrices, validPrice } from '@/lib/garment-prices';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
async function authorize(request:Request) {
  const db=supabaseAdmin(), publicDb=supabasePublic();
  if(!db||!publicDb)return {response:reply('Supabase is not configured.',503)};
  const token=request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token)return {response:reply('Please sign in as staff.',401)};
  const {data:auth,error:authError}=await publicDb.auth.getUser(token);
  if(authError||!auth.user)return {response:reply('Staff login expired.',401)};
  const {data:staff,error:staffError}=await db.from('admin_users').select('id').eq('id',auth.user.id).maybeSingle();
  if(staffError||!staff)return {response:reply('Not authorized to manage prices.',403)};
  return {db,adminId:auth.user.id};
}
export async function GET(request:Request){
  const auth=await authorize(request);if(auth.response)return auth.response;
  try{return NextResponse.json({prices:await getLivePrices(auth.db!)},{headers:{'Cache-Control':'no-store'}});}
  catch(e){console.error('Size price listing:',e);return reply('Could not load prices. Run UPGRADE-SIZE-PRICES.sql.',500);}
}
export async function PATCH(request:Request){
  const auth=await authorize(request);if(auth.response)return auth.response;
  let payload:unknown;
  try{payload=await request.json();}catch{return reply('Invalid JSON.',400);}
  if(!payload||typeof payload!=='object')return reply('Invalid price request.',400);
  const {garmentId,sizePrices}=payload as Record<string,unknown>;
  if(typeof garmentId!=='string'||!GARMENTS.some(g=>g.id===garmentId))return reply('Invalid garment.',400);
  if(!sizePrices||typeof sizePrices!=='object'||Array.isArray(sizePrices))return reply('Enter the prices for each size.',400);
  const p=sizePrices as Record<string,unknown>;
  if(Object.keys(p).length!==SIZES.length||!SIZES.every(s=>validPrice(p[s])))return reply('All six sizes need valid prices greater than ₱0, max two decimal places.',400);
  const rows=SIZES.map(size=>({garment_id:garmentId as GarmentId,size:size as Size,unit_price:Math.round((p[size] as number)*100)/100,updated_by:auth.adminId,updated_at:new Date().toISOString()}));
  const {error}=await auth.db!.from('garment_size_prices').upsert(rows,{onConflict:'garment_id,size'});
  if(error){console.error('Size prices update:',error);return reply('Unable to save. Check the size-price table and retry.',500);}
  return NextResponse.json({ok:true,garmentId,sizePrices:Object.fromEntries(rows.map(r=>[r.size,r.unit_price]))},{headers:{'Cache-Control':'no-store'}});
}
