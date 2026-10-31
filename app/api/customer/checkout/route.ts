import { NextResponse } from 'next/server';
import { customerOrder } from '@/lib/customer-order';
export const runtime='nodejs';
export async function POST(req:Request){
  const body=await req.json().catch(()=>null);
  const found=await customerOrder(body||{});
  if(!found)return NextResponse.json({error:'Invalid private order link.'},{status:404});
  const {order}=found;
  // Preserve access for existing PayMongo sessions created before the shop moved to manual QR.
  if(order.checkout_method==='qrph'&&order.checkout_status==='awaiting_payment'&&order.paymongo_checkout_url)
    return NextResponse.json({checkoutUrl:order.paymongo_checkout_url});
  return NextResponse.json({error:'New GCash QR orders are paid through the private order-tracking page. Scan the shop QR and upload a receipt there for staff verification.'},{status:410,headers:{'Cache-Control':'no-store'}});
}
