import type { SupabaseClient } from '@supabase/supabase-js';

/** Central guard shared by staff, buyer tracking links, and signed-in My Orders. */
export const CANCELLATION_REASONS = [
  'Changed my mind', 'Ordered by mistake', 'Wrong size or design',
  'Wrong delivery details', 'Customer requested cancellation',
  'Duplicate or accidental order', 'Item or design unavailable',
  'Delivery or address issue', 'Other',
] as const;

type CancelOrder = {
  id: string; checkout_method?: string | null; checkout_status?: string | null;
  status?: string | null; production_status?: string | null; delivery_status?: string | null;
};

export function canCancelCod(order: CancelOrder) {
  return order.checkout_method === 'cod'
    && order.checkout_status === 'cod_pending'
    && order.status !== 'cancelled'
    && order.production_status === 'not_started'
    && order.delivery_status === 'not_ready';
}

export async function cancelCodOrder(db: SupabaseClient, order: CancelOrder, reasonValue: unknown, detailValue: unknown, actor: 'Buyer' | 'Admin') {
  if (!canCancelCod(order)) return { ok: false, message: 'This order can no longer be cancelled online. Contact ML Sportswear for assistance.' };
  const reason = typeof reasonValue === 'string' ? reasonValue.trim() : '';
  const detail = typeof detailValue === 'string' ? detailValue.trim().replace(/[\r\n]+/g, ' ') : '';
  if (!CANCELLATION_REASONS.includes(reason as typeof CANCELLATION_REASONS[number]))
    return { ok: false, message: 'Choose a valid reason for cancelling.' };
  if (detail.length > 110) return { ok: false, message: 'Additional details must be 110 characters or fewer.' };
  const note = `Cancellation reason: ${actor} · ${reason}${detail ? ` · ${detail}` : ''}`.slice(0, 160);
  // Atomic conditional write: the buyer cannot cancel an order that moved into production,
  // became paid, or was cancelled by staff while this request was being submitted.
  const { data, error } = await db.from('orders')
    .update({ status: 'cancelled', checkout_status: 'cancelled', delivery_reference: note })
    .eq('id', order.id)
    .eq('checkout_method', 'cod')
    .eq('checkout_status', 'cod_pending')
    .eq('production_status', 'not_started')
    .eq('delivery_status', 'not_ready')
    .neq('status', 'cancelled')
    .select('id').maybeSingle();
  if (error || !data) return { ok: false, message: 'The order changed or cancellation could not be saved. Refresh and try again.' };
  return { ok: true, message: 'Order cancelled successfully.' };
}
