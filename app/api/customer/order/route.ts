import { NextResponse } from 'next/server';
import { customerOrder, publicOrderSnapshot } from '@/lib/customer-order';
import { cancelCodOrder } from '@/lib/cancel-order';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});

export async function POST(req:Request) {
  let body: {code?:unknown;token?:unknown;action?:unknown;reason?:unknown;detail?:unknown};
  try { body=await req.json(); } catch {return reply('Invalid request.',400);}
  const found=await customerOrder(body);
  if (!found) return reply('Order link is invalid or no longer available.',404);
  const {db,order}=found;
  if (body.action==='approve') {
    if (order.status!=='quoted' || order.customer_approved_at || Number(order.quoted_total)<=0 || !(order.gcash_instructions || order.bank_instructions))
      return reply('This quotation is not available for approval.',409);
    const {data,error}=await db.from('orders').update({status:'approved',customer_approved_at:new Date().toISOString()})
      .eq('id',order.id).eq('status','quoted').is('customer_approved_at',null).select('id').maybeSingle();
    if (error || !data) return reply('Approval could not be recorded. Please refresh.',409);
  } else if (body.action==='cancel_checkout') {
    const result=await cancelCodOrder(db,order,body.reason,body.detail,'Buyer');
    if(!result.ok)return reply(result.message,409);
  } else if (body.action!=='view') return reply('Invalid action.',400);
  const {data:updated,error:updatedError}=await db.from('orders').select('*').eq('id',order.id).single();
  if(updatedError || !updated) return reply('Could not load this order.',500);
  try {return NextResponse.json({order:await publicOrderSnapshot(db,updated)},{headers:{'Cache-Control':'no-store'}});}
  catch{return reply('Could not load this order.',500);}
}
