import { supabaseAdmin, supabasePublic } from '@/lib/supabase-server';
import { cleanChart } from '@/lib/storefront-shared';
export async function loadStorefront(){
  const db=supabaseAdmin(); if(!db)throw Error('Storefront configuration is unavailable.');
  const {data,error}=await db.from('storefront_settings').select('size_chart,gcash_qr_path,gcash_name,gcash_number,updated_at').eq('id',1).maybeSingle();
  if(error)throw Error('Storefront settings table is missing. Run the Patch 12 SQL.');
  const path=typeof data?.gcash_qr_path==='string'?data.gcash_qr_path:'';
  return {sizeChart:cleanChart(data?.size_chart??{})??{},gcash:{qrUrl:path?db.storage.from('ml-gcash-qr').getPublicUrl(path).data.publicUrl:null,name:String(data?.gcash_name||''),number:String(data?.gcash_number||'')},hasQR:!!path,updatedAt:data?.updated_at||null};
}
export async function staffAccess(req:Request) {
  const db=supabaseAdmin(),pub=supabasePublic();
  if(!db||!pub)return {error:'Supabase environment variables are missing.',status:503} as const;
  const bearer=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!bearer)return {error:'Sign in as staff first.',status:401} as const;
  const {data:auth,error}=await pub.auth.getUser(bearer);
  if(error||!auth.user)return {error:'Session expired. Sign in again.',status:401} as const;
  const {data:staff,error:staffError}=await db.from('admin_users').select('id').eq('id',auth.user.id).maybeSingle();
  if(staffError||!staff)return {error:'You are not authorized to manage shop settings.',status:403} as const;
  return {db,staffId:auth.user.id};
}
