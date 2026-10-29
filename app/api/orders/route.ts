import { randomUUID } from 'node:crypto';
import { newAccessToken } from '@/lib/workflow';
import { NextResponse } from 'next/server';
import { validateOrder } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getLivePrices } from '@/lib/garment-prices';
import { confirmedPricing, paymongoReady, createCheckoutSession } from '@/lib/paymongo';

export const runtime = 'nodejs';
const MAX_FILE = 4 * 1024 * 1024;
const FILE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
function invalid(message: string, status=400) { return NextResponse.json({error: message},{status}); }

export async function POST(request: Request) {
  const supabase = supabaseAdmin();
  if (!supabase) return invalid('Order submission is not yet connected to Supabase. Follow the README setup steps.', 503);
  try {
    const form = await request.formData();
    const text = form.get('payload');
    if (typeof text !== 'string' || text.length > 14000) return invalid('Invalid order details.');
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return invalid('Invalid order JSON.'); }
    const checked = validateOrder(parsed);
    if (!checked.data) return invalid(checked.error || 'Invalid details.');
    const {checkoutMethod,deliveryAddress}=checked.data;
    // Trust the server/database price ONLY, never the customer's browser total.
    let currentPrice:number|undefined;
    try {const prices=await getLivePrices(supabase);currentPrice=prices[checked.data.garment];}
    catch(e){console.error('Order price lookup failed:',e);return invalid('Official prices are unavailable. Please contact the shop.',503);}
    if(currentPrice===undefined) return invalid('This garment does not have an official price yet. Please contact the shop.',503);
    const displayedUnitPrice=(parsed && typeof parsed==='object')?(parsed as Record<string,unknown>).displayedUnitPrice:null;
    if(typeof displayedUnitPrice !== 'number' || !Number.isFinite(displayedUnitPrice) || Math.abs(displayedUnitPrice-currentPrice)>0.00001)
      return invalid('The shop updated its prices. Refresh the design page, review the new total, then place your order again.',409);
    const serverTotal=Math.round(currentPrice*checked.quantity!*100)/100;
    // Associate orders with a verified logged-in user. Never trust an ID from the form.
    let customerId:string|null=null;
    const authHeader=request.headers.get('authorization');
    if(authHeader){
      if(!authHeader.startsWith('Bearer '))return invalid('Please sign in again.',401);
      const {data:{user},error:authError}=await supabase.auth.getUser(authHeader.slice(7));
      if(authError||!user)return invalid('Your customer session expired. Please log in again.',401);
      customerId=user.id;
    }
    if (checkoutMethod && process.env.NODE_ENV==='production' && !confirmedPricing()) return invalid('Checkout is not open until ML Sportswear confirms the actual price list.',503);
    if(checkoutMethod==='qrph'&&!paymongoReady())return invalid('GCash checkout is not enabled yet. Choose Cash on Delivery or ask the shop to enable PayMongo.',503);
    const front = form.get('frontDesign');
    const back = form.get('backDesign');
    for (const file of [front, back]) {
      if (file !== null && (!(file instanceof File) || !FILE_TYPES[file.type] || file.size > MAX_FILE || file.size === 0)) return invalid('Design files must be PNG, JPG, or WebP, 4 MB or less.');
    }
    const id = randomUUID();
    const access = newAccessToken();
    const code = 'ML-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + id.slice(0,8).toUpperCase();
    const uploads: string[] = [];
    async function upload(file: FormDataEntryValue | null, side: 'front'|'back') {
      if (!(file instanceof File)) return null;
      const path = `${id}/${side}.${FILE_TYPES[file.type]}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase!.storage.from('design-uploads').upload(path, bytes, { contentType: file.type, upsert:false });
      if (error) throw Error('Design upload failed: ' + error.message);
      uploads.push(path);
      return path;
    }
    let frontPath: string|null=null, backPath:string|null=null;
    try { frontPath=await upload(front,'front'); backPath=await upload(back,'back'); } catch(e) {
      if (uploads.length) await supabase.storage.from('design-uploads').remove(uploads);
      throw e;
    }
    const d=checked.data;
    const { error } = await supabase.from('orders').insert({
      id, code, customer_id:customerId, garment:d.garment, color:d.color, accent_color:d.accentColor, print_color:d.printColor,
      player_name:d.playerName, player_number:d.playerNumber, team_name:d.teamName,
      sizes:d.sizes, quantity:checked.quantity, roster:d.roster, notes:d.notes,
      contact_name:d.contactName, email:d.email, phone:d.phone, organization:d.organization,
      estimated_total:serverTotal, front_design_path:frontPath, back_design_path:backPath, artwork_layout:d.artworkLayout, status:checkoutMethod?'approved':'new', tracking_token_hash:access.hash,
      ...(checkoutMethod?{quoted_total:serverTotal,checkout_method:checkoutMethod,checkout_status:checkoutMethod==='cod'?'cod_pending':'awaiting_payment',delivery_address:deliveryAddress}:{}),
    });
    if (error) {
      if (uploads.length) await supabase.storage.from('design-uploads').remove(uploads);
      console.error('Order database error:', error.message);
      return invalid('The request could not be saved. Please try again.', 500);
    }
    if (checkoutMethod==='qrph') {
      try {
        const session=await createCheckoutSession({code,amount:serverTotal,garment:d.garment,quantity:checked.quantity!,origin:new URL(request.url).origin});
        const {error:sessionError}=await supabase.from('orders').update({paymongo_checkout_id:session.id,paymongo_checkout_url:session.url}).eq('id',id).eq('checkout_status','awaiting_payment');
        if(sessionError){console.error('Could not save checkout session',sessionError.message);return invalid('Order saved but GCash checkout could not be prepared. Open your private order link to retry.',500);}
        return NextResponse.json({code,trackingToken:access.token,checkoutUrl:session.url},{status:201});
      }catch(e){ console.error('Checkout setup error',e);return NextResponse.json({code,trackingToken:access.token,checkoutError:'Order saved but payment page is temporarily unavailable. Use your tracking link to try again.'},{status:201}); }
    }
    return NextResponse.json({code, trackingToken:access.token},{status:201});
  } catch(e) {
    console.error('Order submission failure:',e);
    return invalid('Unable to send request. Please verify the Supabase setup, storage bucket and file sizes.',500);
  }
}
