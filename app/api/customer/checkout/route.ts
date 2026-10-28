import { NextResponse } from 'next/server';
import { customerOrder } from '@/lib/customer-order';
import { createCheckoutSession } from '@/lib/paymongo';
export const runtime='nodejs';
export async function POST(req:Request){
  const body=await req.json().catch(()=>null);
  const found=await customerOrder(body||{});
  if(!found)return NextResponse.json({error:'Invalid private order link.'},{status:404});
  const {db,order}=found;
  if(order.checkout_method!=='qrph')return NextResponse.json({error:'Not a QR payment order.'},{status:409});
  if(order.checkout_status==='paid')return NextResponse.json({error:'Already paid.'},{status:409});
  if(order.paymongo_checkout_url)return NextResponse.json({checkoutUrl:order.paymongo_checkout_url});
  try {
    const session=await createCheckoutSession({code:order.code,amount:Number(order.quoted_total),garment:order.garment,quantity:order.quantity,origin:new URL(req.url).origin});
    const {data,error}=await db.from('orders').update({paymongo_checkout_id:session.id,paymongo_checkout_url:session.url}).eq('id',order.id).is('paymongo_checkout_id',null).select('id').maybeSingle();
    if(error)return NextResponse.json({error:'Unable to prepare GCash checkout.'},{status:500});
    if(!data){const {data:current}=await db.from('orders').select('paymongo_checkout_url').eq('id',order.id).single();return NextResponse.json({checkoutUrl:current?.paymongo_checkout_url||null});}
    return NextResponse.json({checkoutUrl:session.url});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not start payment.'},{status:502});}
}
