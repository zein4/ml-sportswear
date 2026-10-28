import { createHmac, timingSafeEqual } from 'node:crypto';

export function paymongoReady() { return Boolean(process.env.PAYMONGO_SECRET_KEY); }
export function confirmedPricing() { return process.env.CHECKOUT_PRICING_CONFIRMED === 'true'; }

export async function createCheckoutSession(input:{code:string;amount:number;garment:string;quantity:number;origin:string}) {
  const secret=process.env.PAYMONGO_SECRET_KEY;
  if (!secret) throw new Error('GCash / QR Ph checkout has not been connected by the shop. Choose COD for now.');
  if (!Number.isFinite(input.amount)||input.amount<=0) throw new Error('Invalid order price.');
  const res=await fetch('https://api.paymongo.com/v2/checkout_sessions',{
    method:'POST', headers:{Authorization:`Basic ${Buffer.from(secret+':').toString('base64')}`,'Content-Type':'application/json'},
    body:JSON.stringify({data:{attributes:{line_items:[{name:`ML Sportswear ${input.garment} · ${input.code}`,amount:Math.round(input.amount*100),currency:'PHP',quantity:1}],payment_method_types:['qrph','gcash'],success_url:`${input.origin}/payment-return?result=success`,cancel_url:`${input.origin}/payment-return?result=cancel`,reference_number:input.code,send_email_receipt:false}}}),
    cache:'no-store'
  });
  const json=await res.json().catch(()=>({}));
  const id=json?.data?.id, url=json?.data?.attributes?.checkout_url;
  if(!res.ok||typeof id!=='string'||typeof url!=='string'||!url.startsWith('https://checkout.paymongo.com/')){
    console.error('PayMongo checkout request failed',res.status,JSON.stringify(json).slice(0,800));
    throw new Error('GCash checkout could not start. Please check PayMongo configuration or choose COD.');
  }
  return {id,url};
}

export function validWebhook(raw:string,header:string,livemode:boolean) {
  const secret=process.env.PAYMONGO_WEBHOOK_SECRET;
  if(!secret)return false;
  const sig=Object.fromEntries(header.split(',').map(part=>part.trim().split('=',2)));
  if(!sig.t || !/^\d{10,13}$/.test(sig.t))return false;
  if(Math.abs(Date.now()/1000 - Number(sig.t)) > 300)return false;
  const expected=createHmac('sha256',secret).update(`${sig.t}.${raw}`).digest('hex');
  const actual=livemode?sig.li:sig.te;
  if(!actual||actual.length!==expected.length||!/^[a-f0-9]+$/i.test(actual))return false;
  return timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));
}
