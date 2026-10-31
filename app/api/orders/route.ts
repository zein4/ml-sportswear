import { randomUUID } from 'node:crypto';
import { newAccessToken } from '@/lib/workflow';
import { NextResponse } from 'next/server';
import { validateOrder } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getLivePrices, itemTotal } from '@/lib/garment-prices';
import { confirmedPricing } from '@/lib/paymongo';
import { loadStorefront } from '@/lib/storefront';

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
    let serverTotal:number|null=null;
    try{const prices=await getLivePrices(supabase);serverTotal=itemTotal(prices,checked.data.garment,checked.data.sizes);}
    catch(e){console.error('Order size price lookup failed:',e);return invalid('Official size prices are unavailable. Please contact the shop.',503);}
    if(serverTotal===null)return invalid('Prices for one or more sizes are missing. Please contact the shop.',503);
    const displayedTotal=(parsed&&typeof parsed==='object')?(parsed as Record<string,unknown>).displayedTotal:null;
    if(typeof displayedTotal!=='number'||!Number.isFinite(displayedTotal)||Math.round(displayedTotal*100)!==Math.round(serverTotal*100))
      return invalid('The shop updated a size price. Refresh your design, review the new total, then order again.',409);
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
    if(checkoutMethod==='qrph'){let ready=false;try{ready=(await loadStorefront()).hasQR;}catch{}if(!ready)return invalid('GCash QR is not yet available. Please choose Cash on Delivery or contact ML Sportswear.',503);}
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
    return NextResponse.json({code, trackingToken:access.token},{status:201});
  } catch(e) {
    console.error('Order submission failure:',e);
    return invalid('Unable to send request. Please verify the Supabase setup, storage bucket and file sizes.',500);
  }
}
