import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { loadStorefront, staffAccess } from '@/lib/storefront';
import { cleanChart } from '@/lib/storefront-shared';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const err=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 const auth=await staffAccess(req);if('error'in auth)return err(auth.error || 'Staff access required.',auth.status || 403);
 try{return NextResponse.json(await loadStorefront(),{headers:{'Cache-Control':'no-store'}});}catch(e){return err(e instanceof Error?e.message:'Cannot load settings.',500);}
}
export async function PATCH(req:Request){
 const auth=await staffAccess(req);if('error'in auth)return err(auth.error || 'Staff access required.',auth.status || 403);
 const json:unknown=await req.json().catch(()=>null);
 if(!json||typeof json!=='object'||!('sizeChart'in json))return err('Size guide data is missing.',400);
 const chart=cleanChart((json as {sizeChart:unknown}).sizeChart);
 if(!chart)return err('Enter measurements in cm, greater than 0 and up to 300, with at most 1 decimal place.',400);
 const {error}=await auth.db.from('storefront_settings').update({size_chart:chart,updated_at:new Date().toISOString()}).eq('id',1);
 if(error)return err('Could not save size guide. Run the Patch 12 SQL first.',500);
 return NextResponse.json({ok:true});
}
function matchesImage(bytes:Buffer,type:string){
 if(type==='image/png')return bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==='image/jpeg')return bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==='image/webp')return bytes.length>12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 return false;
}
export async function POST(req:Request){
 const auth=await staffAccess(req);if('error'in auth)return err(auth.error || 'Staff access required.',auth.status || 403);
 const length=Number(req.headers.get('content-length')||0);if(length>3*1024*1024)return err('Upload must be 2 MB or smaller.',413);
 const body=await req.formData().catch(()=>null);if(!body)return err('Invalid upload.',400);
 const name=String(body.get('name')||'').trim(),number=String(body.get('number')||'').trim();
 if(name.length>100||number.length>30|| (number&&!/^\+?[0-9\s-]{8,30}$/.test(number)))return err('Check the GCash name or phone number.',400);
 const file=body.get('qr');const clear=body.get('remove')==='true';
 if(clear && file instanceof File)return err('Choose either a new QR or remove the current QR.',400);
 let uploaded:string|null=null;
 if(file instanceof File){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<20||file.size>2*1024*1024)return err('QR must be a PNG, JPG or WebP image, up to 2 MB.',400);
  const bytes=Buffer.from(await file.arrayBuffer());if(!matchesImage(bytes,file.type))return err('File content does not match an accepted image type.',400);
  const ext=file.type==='image/png'?'png':file.type==='image/jpeg'?'jpg':'webp';uploaded=`qr/${randomUUID()}.${ext}`;
  const {error:uploadError}=await auth.db.storage.from('ml-gcash-qr').upload(uploaded,bytes,{contentType:file.type,upsert:false,cacheControl:'3600'});
  if(uploadError)return err('Unable to upload QR. Check the Supabase Storage bucket.',500);
 }
 const {data:old,error:readError}=await auth.db.from('storefront_settings').select('gcash_qr_path').eq('id',1).maybeSingle();
 if(readError){if(uploaded)await auth.db.storage.from('ml-gcash-qr').remove([uploaded]);return err('Run the Patch 12 SQL before saving.',500);}
 const updates:Record<string,unknown>={gcash_name:name,gcash_number:number,updated_at:new Date().toISOString()};
 if(uploaded)updates.gcash_qr_path=uploaded;
 if(clear)updates.gcash_qr_path=null;
 const {error}=await auth.db.from('storefront_settings').upsert({id:1,...updates},{onConflict:'id'});
 if(error){if(uploaded)await auth.db.storage.from('ml-gcash-qr').remove([uploaded]);return err('Could not save shop settings.',500);}
 if((uploaded||clear)&&old?.gcash_qr_path&&old.gcash_qr_path!==uploaded){await auth.db.storage.from('ml-gcash-qr').remove([old.gcash_qr_path]);}
 return NextResponse.json({ok:true,settings:await loadStorefront()},{headers:{'Cache-Control':'no-store'}});
}
