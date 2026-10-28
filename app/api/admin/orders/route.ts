import { NextResponse } from 'next/server';
import { supabaseAdmin, supabasePublic } from '@/lib/supabase-server';
import { newAccessToken, trackingLink, moneyRound, PRODUCTION_STATUSES, SHIPPING_STATUSES, verifiedAmount } from '@/lib/workflow';
import { cancelCodOrder } from '@/lib/cancel-order';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const bad=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
const asString=(value:unknown,max=1000)=>typeof value==='string'?value.trim().slice(0,max):'';
const isId=(value:unknown)=>typeof value==='string'&&/^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value);
async function staff(req:Request) {
  const db=supabaseAdmin();const pub=supabasePublic();
  if(!db||!pub)return {error:bad('Supabase configuration missing.',503)};
  const token=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token)return {error:bad('Sign in to continue.',401)};
  const {data,error}=await pub.auth.getUser(token);
  if(error||!data.user)return {error:bad('Your session expired. Please sign in.',401)};
  const {data:authorized,error:checkError}=await db.from('admin_users').select('id').eq('id',data.user.id).maybeSingle();
  if(checkError||!authorized)return {error:bad('Staff account not authorized.',403)};
  return {db};
}
export async function GET(req:Request) {
  const a=await staff(req);if(a.error)return a.error;
  const db=a.db!;
  const {data,error}=await db.from('orders').select('*').order('created_at',{ascending:false}).limit(200);
  if(error)return bad('Could not load orders. Run supabase/UPGRADE-V3.sql if needed.',500);
  const ids=(data||[]).map(o=>o.id);
  const {data:payments,error:pError}=ids.length?await db.from('order_payments').select('*').in('order_id',ids).order('created_at',{ascending:false}):{data:[],error:null};
  if(pError)return bad('Could not load payment records. Run the V3 database upgrade.',500);
  const orders=await Promise.all((data||[]).map(async order=>{
    const related=(payments||[]).filter(p=>p.order_id===order.id);
    const processed=await Promise.all(related.map(async p=>{
      const {data:signed}=await db.storage.from('payment-proofs').createSignedUrl(p.proof_path,60*15);
      return {...p,proof_url:signed?.signedUrl||null};
    }));
    const out:Record<string,unknown>={...order,payments:processed,has_tracking_link:Boolean(order.tracking_token_hash)};
    delete out.tracking_token_hash;
    for(const [field,target] of [['front_design_path','front_design_url'],['back_design_path','back_design_url']]){
      if(typeof order[field]==='string'){
        const {data:signed}=await db.storage.from('design-uploads').createSignedUrl(order[field] as string,60*15);
        out[target]=signed?.signedUrl||null;
      }
    }
    return out;
  }));
  return NextResponse.json({orders},{headers:{'Cache-Control':'no-store'}});
}
export async function PATCH(req:Request) {
  const a=await staff(req);if(a.error)return a.error;
  const db=a.db!;
  let body:Record<string,unknown>;
  try {body=await req.json();}catch{return bad('Invalid request.',400);}
  if(!isId(body.id))return bad('Invalid order identifier.',400);
  const id=body.id as string;
  const {data:order,error}=await db.from('orders').select('*').eq('id',id).maybeSingle();
  if(error||!order)return bad('Order not found.',404);
  const action=body.action;
  if (action === 'cancel_checkout') {
    const result = await cancelCodOrder(db, order, body.reason, body.detail, 'Admin');
    return result.ok ? NextResponse.json({ok: true}) : bad(result.message, 409);
  }
  if(action==='fulfillment_checkout') {
    if(order.status==='cancelled'||order.checkout_status==='cancelled')return bad('Cancelled orders cannot be fulfilled.',409);
    if(!['cod','qrph'].includes(order.checkout_method))return bad('Not a checkout order.',409);
    const prod=asString(body.production_status,30),delivery=asString(body.delivery_status,30),reference=asString(body.delivery_reference,160);
    if(!PRODUCTION_STATUSES.includes(prod as typeof PRODUCTION_STATUSES[number])||!SHIPPING_STATUSES.includes(delivery as typeof SHIPPING_STATUSES[number]))return bad('Invalid production / delivery status.',400);
    if(order.checkout_method==='qrph'&&order.checkout_status!=='paid')return bad('Wait for verified GCash payment before production.',409);
    if(prod==='not_started'&&delivery!=='not_ready')return bad('Start production first.',400);
    if(delivery!=='not_ready'&&prod!=='ready')return bad('Mark the garments as ready before shipping.',400);
    if(order.checkout_method==='cod'&&delivery==='delivered'&&order.checkout_status==='cod_pending'&&body.cod_collected!==true)return bad('Confirm cash was actually collected before completing COD.',409);
    const update:Record<string,unknown>={production_status:prod,delivery_status:delivery,delivery_reference:reference,status:delivery==='delivered'?'completed':prod==='not_started'?'approved':'in_production'};
    if(order.checkout_method==='cod'&&delivery==='delivered'&&order.checkout_status==='cod_pending'){update.checkout_status='cod_collected';update.paid_at=new Date().toISOString();}
    const {data:changed,error:saveError}=await db.from('orders').update(update).eq('id',id)
      .eq('checkout_status',order.checkout_status).eq('production_status',order.production_status)
      .eq('delivery_status',order.delivery_status).neq('status','cancelled')
      .select('id').maybeSingle();
    return saveError||!changed?bad('Order changed while you were editing. Refresh before saving progress.',409):NextResponse.json({ok:true});
  }
  if(action==='tracking_link') {
    if(order.tracking_token_hash && body.confirmRotate !== true)return bad('Confirm rotation before replacing a private customer link.',409);
    const access=newAccessToken();
    const {error:saveError}=await db.from('orders').update({tracking_token_hash:access.hash}).eq('id',id);
    if(saveError)return bad('Could not create a tracking link.',500);
    return NextResponse.json({trackingLink:trackingLink(order.code,access.token,new URL(req.url).origin)});
  }
  if(action==='review') {
    const status=body.status;
    if(!['new','reviewing','cancelled'].includes(String(status)))return bad('Invalid review status.',400);
    if(!['new','reviewing','quoted'].includes(order.status)||order.customer_approved_at)return bad('This order is already approved or in production.',409);
    const {error:saveError}=await db.from('orders').update({status}).eq('id',id).is('customer_approved_at',null);
    if(saveError)return bad('Unable to update review status.',500);
    return NextResponse.json({ok:true});
  }
  if(action==='quote') {
    if(!['new','reviewing','quoted'].includes(order.status)||order.customer_approved_at)return bad('Approved quotations cannot be edited. Contact the customer directly.',409);
    const total=Number(body.quoted_total),deposit=Number(body.deposit_percent);
    if(!Number.isFinite(total)||total<=0||total>10000000||Math.abs(Math.round(total*100)-total*100)>0.00001)return bad('Enter a valid final quote in pesos (up to two decimals).',400);
    if(!Number.isInteger(deposit)||deposit<1||deposit>100)return bad('Deposit percent must be between 1 and 100.',400);
    const gcash=asString(body.gcash_instructions,700),bank=asString(body.bank_instructions,700),note=asString(body.quote_notes,1200);
    if(!gcash&&!bank)return bad('Add official GCash or bank payment instructions before issuing a quote.',400);
    const {error:saveError}=await db.from('orders').update({status:'quoted',quoted_total:moneyRound(total),deposit_percent:deposit,gcash_instructions:gcash,bank_instructions:bank,quote_notes:note,quote_issued_at:new Date().toISOString()})
      .eq('id',id).is('customer_approved_at',null);
    if(saveError)return bad('Could not issue the quotation.',500);
    return NextResponse.json({ok:true});
  }
  const {data:payments,error:paymentError}=await db.from('order_payments').select('*').eq('order_id',id);
  if(paymentError)return bad('Could not load payments.',500);
  if(action==='payment_review') {
    if(!isId(body.payment_id) || !['verified','rejected'].includes(String(body.decision)))return bad('Invalid payment verification.',400);
    const payment=(payments||[]).find(p=>p.id===body.payment_id);
    if(!payment || payment.status!=='submitted')return bad('This payment is no longer pending.',409);
    const {data:updated,error:saveError}=await db.from('order_payments').update({status:body.decision,reviewed_at:new Date().toISOString()})
      .eq('id',payment.id).eq('status','submitted').select('id').maybeSingle();
    if(saveError||!updated)return bad('Payment update failed. Refresh the list.',409);
    return NextResponse.json({ok:true});
  }
  if(action==='fulfillment') {
    if(!order.customer_approved_at)return bad('Customer must approve the quotation first.',409);
    const prod=asString(body.production_status,30),delivery=asString(body.delivery_status,30),reference=asString(body.delivery_reference,160);
    if(!PRODUCTION_STATUSES.includes(prod as typeof PRODUCTION_STATUSES[number])||!SHIPPING_STATUSES.includes(delivery as typeof SHIPPING_STATUSES[number]))return bad('Invalid production or delivery status.',400);
    const paid=verifiedAmount(payments||[]);
    const finalTotal=Number(order.quoted_total);
    if(paid<=0)return bad('Verify the initial payment before starting production.',409);
    if(prod==='not_started'&&delivery!=='not_ready')return bad('Start production before arranging delivery.',400);
    if(delivery!=='not_ready'&&prod!=='ready')return bad('Mark production as ready before updating delivery.',400);
    if(['shipped','delivered'].includes(delivery)&&moneyRound(finalTotal-paid)>0)return bad('The full balance must be verified before shipping or completing the order.',409);
    const status=delivery==='delivered'?'completed':prod==='not_started'?'approved':'in_production';
    const {error:saveError}=await db.from('orders').update({production_status:prod,delivery_status:delivery,delivery_reference:reference,status})
      .eq('id',id);
    if(saveError)return bad('Could not update production or delivery.',500);
    return NextResponse.json({ok:true});
  }
  return bad('Unsupported staff action.',400);
}
