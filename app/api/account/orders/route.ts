import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { cancelCodOrder } from '@/lib/cancel-order';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  const db=supabaseAdmin();if(!db)return NextResponse.json({error:'Database unavailable.'},{status:503});
  const bearer=request.headers.get('authorization')||'';
  if(!bearer.startsWith('Bearer '))return NextResponse.json({error:'Sign in required.'},{status:401});
  const {data:{user},error:authError}=await db.auth.getUser(bearer.slice(7));
  if(authError||!user)return NextResponse.json({error:'Please sign in again.'},{status:401});
  const {data,error}=await db.from('orders')
    .select('id,code,created_at,garment,quantity,estimated_total,quoted_total,status,production_status,delivery_status,checkout_method,checkout_status')
    .eq('customer_id',user.id).order('created_at',{ascending:false}).limit(100);
  if(error){console.error('Customer orders lookup:',error.message);return NextResponse.json({error:'Could not load order history. Has the V5 database upgrade been run?'},{status:500});}
  return NextResponse.json({orders:data||[]},{headers:{'Cache-Control':'private, no-store'}});
}

export async function PATCH(request:Request){
  const db=supabaseAdmin();if(!db)return NextResponse.json({error:'Database unavailable.'},{status:503});
  const bearer=request.headers.get('authorization')||'';
  if(!bearer.startsWith('Bearer '))return NextResponse.json({error:'Sign in required.'},{status:401});
  const {data:{user},error:authError}=await db.auth.getUser(bearer.slice(7));
  if(authError||!user)return NextResponse.json({error:'Please sign in again.'},{status:401});
  const body=await request.json().catch(()=>null);
  if(!body||typeof body.id!=='string'||!/^[a-f\d-]{36}$/i.test(body.id))return NextResponse.json({error:'Invalid order.'},{status:400});
  // Verify that the authenticated customer OWNS this order. Never trust customer_id in a request.
  const {data:order,error}=await db.from('orders').select('id,checkout_method,checkout_status,status,production_status,delivery_status')
    .eq('id',body.id).eq('customer_id',user.id).maybeSingle();
  if(error||!order)return NextResponse.json({error:'Order not found in your account.'},{status:404});
  const result=await cancelCodOrder(db,order,body.reason,body.detail,'Buyer');
  return NextResponse.json(result,{status:result.ok?200:409,headers:{'Cache-Control':'private, no-store'}});
}
