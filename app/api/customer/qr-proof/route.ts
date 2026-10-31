import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { customerOrder, publicOrderSnapshot } from '@/lib/customer-order';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 const length=Number(req.headers.get('content-length')||0);
 if(length>5*1024*1024)return fail('Receipt is too large.',413);
 const form=await req.formData().catch(()=>null);if(!form)return fail('Invalid receipt form.',400);
 const found=await customerOrder({code:form.get('code'),token:form.get('token')});
 if(!found)return fail('Invalid or expired private tracking link.',404);
 const {db,order}=found;
 if(order.checkout_method!=='qrph'||order.checkout_status!=='awaiting_payment'||order.status==='cancelled')return fail('This order is not awaiting GCash payment.',409);
 const total=Number(order.quoted_total);
 if(!Number.isFinite(total)||total<=0)return fail('Order amount is unavailable.',409);
 const {data:previous,error:previousError}=await db.from('order_payments').select('status').eq('order_id',order.id);
 if(previousError)return fail('Could not check previous payments.',500);
 if((previous||[]).some(p=>p.status==='submitted'))return fail('Your receipt is already pending staff verification.',409);
 if((previous||[]).some(p=>p.status==='verified'))return fail('Payment has already been verified.',409);
 const reference=String(form.get('reference')||'').trim();if(reference.length>100)return fail('Reference is too long.',400);
 const file=form.get('proof');
 const kinds:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
 if(!(file instanceof File)||!kinds[file.type]||file.size<16||file.size>4*1024*1024)return fail('Upload a JPG, PNG, WebP or PDF receipt (max 4 MB).',400);
 const bytes=Buffer.from(await file.arrayBuffer());
 const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
  file.type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
  file.type==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':bytes.toString('ascii',0,5)==='%PDF-';
 if(!valid)return fail('Receipt type does not match the file content.',400);
 const id=randomUUID(),path=`${order.id}/${id}.${kinds[file.type]}`;
 const {error:uploadError}=await db.storage.from('payment-proofs').upload(path,bytes,{upsert:false,contentType:file.type});
 if(uploadError)return fail('Could not upload receipt. Please retry.',500);
 const {error}=await db.from('order_payments').insert({id,order_id:order.id,stage:'initial',payment_option:'full',method:'gcash',expected_amount:total,customer_reference:reference,proof_path:path,status:'submitted'});
 if(error){await db.storage.from('payment-proofs').remove([path]);return fail('Could not submit receipt. Please refresh and try again.',409);}
 return NextResponse.json({ok:true,order:await publicOrderSnapshot(db,order)},{status:201,headers:{'Cache-Control':'no-store'}});
}
