import { supabaseAdmin } from '@/lib/supabase-server';
import { ACCESS_PATTERN, ORDER_CODE_PATTERN, hashAccessToken } from '@/lib/workflow';

export type CustomerCredentials = { code?: unknown; token?: unknown };
export async function customerOrder(creds: CustomerCredentials) {
  const db = supabaseAdmin();
  const code = typeof creds.code === 'string' ? creds.code.trim() : '';
  const token = typeof creds.token === 'string' ? creds.token.trim() : '';
  if (!db || !ACCESS_PATTERN.test(token) || !ORDER_CODE_PATTERN.test(code)) return null;
  const {data,error} = await db.from('orders').select('*').eq('code',code).eq('tracking_token_hash',hashAccessToken(token)).maybeSingle();
  if(error || !data) return null;
  return {db,order:data};
}

export async function publicOrderSnapshot(db: NonNullable<ReturnType<typeof supabaseAdmin>>, order: Record<string,unknown>) {
  const {data:payments,error}=await db.from('order_payments').select('id,stage,payment_option,method,expected_amount,status,created_at,reviewed_at').eq('order_id',order.id).order('created_at',{ascending:false});
  if (error) throw new Error('Unable to load payment summary.');
  const verified = (payments||[]).filter(p=>p.status==='verified').reduce((sum,p)=>sum+Number(p.expected_amount),0);
  const total = order.quoted_total === null ? null : Number(order.quoted_total);
  const balance = total === null ? null : Math.max(0,Math.round((total-verified)*100)/100);
  return {
    code:order.code, garment:order.garment,quantity:order.quantity,team_name:order.team_name,
    status:order.status, quote_notes:order.quote_notes,quoted_total:total,deposit_percent:order.deposit_percent,
    gcash_instructions:order.gcash_instructions,bank_instructions:order.bank_instructions,
    quote_issued_at:order.quote_issued_at,customer_approved_at:order.customer_approved_at,
    production_status:order.production_status,delivery_status:order.delivery_status,
    delivery_reference:order.delivery_reference,verified_amount:Math.round(verified*100)/100,
    balance,payments:payments||[],
  };
}
