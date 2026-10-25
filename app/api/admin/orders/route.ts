import { NextResponse } from 'next/server';
import { supabaseAdmin, supabasePublic } from '@/lib/supabase-server';

export const runtime = 'nodejs';
const STATUSES = ['new','reviewing','quoted','approved','in_production','completed','cancelled'];
const resultError = (error:string,status:number) => NextResponse.json({error},{status});
async function verifyAdmin(request: Request) {
  const admin = supabaseAdmin();
  const pub = supabasePublic();
  if (!admin || !pub) return {error: resultError('Supabase configuration missing.',503)};
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return {error:resultError('Sign in to continue.',401)};
  const { data, error } = await pub.auth.getUser(token);
  if (error || !data.user) return {error:resultError('Your session has expired.',401)};
  const { data: authorized, error: checkError } = await admin.from('admin_users').select('id').eq('id',data.user.id).maybeSingle();
  if (checkError || !authorized) return {error:resultError('Staff account not authorized.',403)};
  return {admin};
}
export async function GET(request: Request) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  const {data,error} = await auth.admin!.from('orders').select('*').order('created_at',{ascending:false}).limit(200);
  if (error) return resultError('Could not load requests.',500);
  const orders = await Promise.all((data||[]).map(async (order) => {
    const out: Record<string,unknown> = {...order};
    for (const [key,target] of [['front_design_path','front_design_url'],['back_design_path','back_design_url']]) {
      if (typeof order[key] === 'string') {
        const {data:signed} = await auth.admin!.storage.from('design-uploads').createSignedUrl(order[key] as string,60*30);
        out[target] = signed?.signedUrl || null;
      }
    }
    return out;
  }));
  return NextResponse.json({orders});
}
export async function PATCH(request: Request) {
  const auth = await verifyAdmin(request); if (auth.error) return auth.error;
  let body: {id?:string;status?:string};
  try {body=await request.json();}catch{return resultError('Invalid status update.',400);}
  if (!body.id || !/^[a-f0-9-]{36}$/i.test(body.id) || !STATUSES.includes(body.status||'')) return resultError('Invalid request or status.',400);
  const {data,error}=await auth.admin!.from('orders').update({status:body.status}).eq('id',body.id).select('id,status').maybeSingle();
  if (error || !data) return resultError('Could not update request.',500);
  return NextResponse.json({order:data});
}
