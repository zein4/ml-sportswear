import { createHash, randomBytes } from 'node:crypto';

export const ACCESS_PATTERN = /^[a-f0-9]{64}$/;
export const ORDER_CODE_PATTERN = /^ML-\d{8}-[A-F0-9]{8}$/;
export const PAYMENT_TYPES = ['gcash','bank_transfer'] as const;
export const SHIPPING_STATUSES = ['not_ready','ready_for_pickup','shipped','delivered'] as const;
export const PRODUCTION_STATUSES = ['not_started','in_production','ready'] as const;

export function newAccessToken() {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashAccessToken(token) };
}
export function hashAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export function moneyRound(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
export function verifiedAmount(payments: {status:string;expected_amount:number|string}[]) {
  return moneyRound(payments.filter(p=>p.status==='verified').reduce((a,p)=>a + Number(p.expected_amount),0));
}
export function trackingLink(code:string,token:string,origin:string) {
  return `${origin}/track#code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`;
}
