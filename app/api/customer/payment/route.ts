import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { customerOrder, publicOrderSnapshot } from '@/lib/customer-order';
import { moneyRound, verifiedAmount } from '@/lib/workflow';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX_FILE=4*1024*1024;
const types:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'};
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
function matchesMagic(buffer:Buffer,type:string) {
  if(type==='image/png')return buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(type==='image/jpeg')return buffer[0]===255 && buffer[1]===216 && buffer[2]===255;
  if(type==='image/webp')return buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
  if(type==='application/pdf')return buffer.toString('ascii',0,5)==='%PDF-';
  return false;
}
export async function POST(req:Request) {
  const incomingSize=Number(req.headers.get('content-length')||0);
  if (incomingSize > 5*1024*1024) return reply('Payment upload is too large.',413);
  let form:FormData;
  try {form=await req.formData();}catch{return reply('Invalid payment details.',400);}
  const found=await customerOrder({code:form.get('code'),token:form.get('token')});
  if(!found)return reply('Order link is invalid.',404);
  const {db,order}=found;
  if(!order.customer_approved_at || !['approved','in_production'].includes(order.status))return reply('Approve the final quotation first.',409);
  const total=Number(order.quoted_total);
  if(!Number.isFinite(total)||total<=0)return reply('Final quote is unavailable.',409);
  const method=form.get('method');
  const option=form.get('payment_option');
  const reference=typeof form.get('reference')==='string'?String(form.get('reference')).trim():'';
  if(!['gcash','bank_transfer'].includes(String(method)) || !['deposit','full','balance'].includes(String(option)) || reference.length>100)return reply('Invalid payment choice.',400);
  if((method==='gcash'&&!order.gcash_instructions)||(method==='bank_transfer'&&!order.bank_instructions))return reply('This payment method is not currently available.',409);
  const proof=form.get('proof');
  if(!(proof instanceof File)||!types[proof.type]||proof.size<8||proof.size>MAX_FILE)return reply('Upload a PNG, JPG, WebP or PDF proof (maximum 4 MB).',400);
  const buffer=Buffer.from(await proof.arrayBuffer());
  if(!matchesMagic(buffer,proof.type))return reply('The proof file content does not match its type.',400);
  const {data:payments,error:paymentError}=await db.from('order_payments').select('id,status,expected_amount,stage').eq('order_id',order.id);
  if(paymentError)return reply('Unable to check earlier payments.',500);
  if((payments||[]).some(p=>p.status==='submitted'))return reply('A payment is already awaiting staff verification.',409);
  const paid=verifiedAmount(payments||[]);
  const remaining=moneyRound(total-paid);
  if(remaining<=0)return reply('This order has already been paid in full.',409);
  const initialPaid=(payments||[]).some(p=>p.status==='verified'&&p.stage==='initial');
  if(initialPaid && option!=='balance')return reply('Please choose the remaining balance payment.',400);
  if(!initialPaid && option==='balance')return reply('Choose a deposit or full payment first.',400);
  const amount=initialPaid||option==='full'?remaining:Math.min(remaining,moneyRound(total*Number(order.deposit_percent)/100));
  if(amount<=0)return reply('Invalid payment amount.',400);
  const paymentId=randomUUID();
  const path=`${order.id}/${paymentId}.${types[proof.type]}`;
  const {error:uploadError}=await db.storage.from('payment-proofs').upload(path,buffer,{contentType:proof.type,upsert:false});
  if(uploadError)return reply('Could not upload the payment proof. Please try again.',500);
  const {error:insertError}=await db.from('order_payments').insert({id:paymentId,order_id:order.id,stage:initialPaid?'balance':'initial',payment_option:option,method,expected_amount:amount,customer_reference:reference,proof_path:path,status:'submitted'});
  if(insertError){await db.storage.from('payment-proofs').remove([path]);return reply('Could not record payment. Check if another payment is pending.',409);}
  try{return NextResponse.json({order:await publicOrderSnapshot(db,order)},{status:201,headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});}
}
