import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { validWebhook } from '@/lib/paymongo';
export const runtime='nodejs';
export async function POST(req:Request){
 const raw=await req.text();if(raw.length>150000)return new Response('Payload too large',{status:413});
 let event:any;try{event=JSON.parse(raw);}catch{return new Response('Bad JSON',{status:400});}
 const attr=event?.data?.attributes;
 if(!attr || !validWebhook(raw,req.headers.get('paymongo-signature')||'',Boolean(attr.livemode)))return new Response('Unauthorized',{status:401});
 if(attr.type!=='checkout_session.payment.paid')return NextResponse.json({ok:true});
 const session=attr.data;
 const code=session?.attributes?.reference_number;
 const id=session?.id;
 const paid=(session?.attributes?.payments||[]).find((p:any)=>p?.attributes?.status==='paid');
 if(typeof code!=='string'||typeof id!=='string'||!paid?.id)return new Response('Malformed payment event',{status:400});
 const db=supabaseAdmin();if(!db)return new Response('Server not configured',{status:503});
 const {data:order,error}=await db.from('orders').select('id,quoted_total,checkout_status').eq('code',code).eq('paymongo_checkout_id',id).eq('checkout_method','qrph').maybeSingle();
 if(error||!order)return new Response('Unknown order',{status:404});
 if(order.checkout_status==='paid')return NextResponse.json({ok:true});
 // Only mark paid after verifying provider-signed event and the exact expected amount.
 const amount=Number(paid?.attributes?.amount),currency=paid?.attributes?.currency;
 if(amount!==Math.round(Number(order.quoted_total)*100)||currency!=='PHP')return new Response('Payment amount mismatch',{status:409});
 const {error:updateError}=await db.from('orders').update({checkout_status:'paid',paid_at:new Date().toISOString(),paymongo_payment_id:paid.id}).eq('id',order.id).eq('checkout_status','awaiting_payment');
 if(updateError)return new Response('Database update failed',{status:500});
 return NextResponse.json({ok:true});
}
