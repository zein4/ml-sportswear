'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle, Ban, CheckCircle2, ClipboardList, CreditCard, FileImage,
  Mail, MapPin, PackageCheck, Phone, ShieldCheck, Truck, X,
} from 'lucide-react';
import type { StaffOrder } from '@/lib/admin-types';
import { GARMENTS, money } from '@/lib/catalog';

type Action = (action: string, extra: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
const REASONS = [
  'Customer requested cancellation',
  'Duplicate or accidental order',
  'Item or design unavailable',
  'Delivery or address issue',
  'Other',
] as const;
const pretty = (value: string | undefined | null) => (value || 'Not yet updated').replaceAll('_', ' ');

export function CheckoutOrderPanel({ order, busy, save, onClose }: { order: StaffOrder; busy: boolean; save: Action; onClose: () => void }) {
  const [production, setProduction] = useState(order.production_status);
  const [delivery, setDelivery] = useState(order.delivery_status);
  const [details, setDetails] = useState(order.delivery_reference || '');
  const [collected, setCollected] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('Customer requested cancellation');
  const [reasonDetail, setReasonDetail] = useState('');
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    setProduction(order.production_status);
    setDelivery(order.delivery_status);
    setDetails(order.delivery_reference || '');
    setCollected(false);
    setConfirmOpen(false);
    setUnderstood(false);
    setReason('Customer requested cancellation');
    setReasonDetail('');
  }, [order.id, order.production_status, order.delivery_status, order.delivery_reference]);

  const cod = order.checkout_method === 'cod';
  const paid = order.checkout_status === 'paid' || order.checkout_status === 'cod_collected';
  const cancelled = order.status === 'cancelled' || order.checkout_status === 'cancelled';
  const canCancel = cod && !cancelled && order.checkout_status === 'cod_pending'
    && order.production_status === 'not_started' && order.delivery_status === 'not_ready';
  const cannotCancelWhy = !cod ? 'Online payments and refunds must be handled with the payment provider.'
    : paid ? 'This order has been paid. Handle refunds or disputes outside this tool.'
    : order.production_status !== 'not_started' || order.delivery_status !== 'not_ready'
      ? 'Production or delivery has started. Contact the customer before arranging a cancellation.'
      : 'This order cannot be cancelled automatically.';
  const garment = GARMENTS.find(g => g.id === order.garment)?.label || order.garment;
  const sizeList = Object.entries(order.sizes || {}).filter(([, n]) => n > 0);
  const cancellationReason = cancelled && order.delivery_reference?.startsWith('Cancellation reason:')
    ? order.delivery_reference.replace('Cancellation reason:', '').trim() : '';

  async function cancelOrder(e: FormEvent) {
    e.preventDefault();
    if (!canCancel || !understood || busy) return;
    const response = await save('cancel_checkout', { reason, detail: reasonDetail });
    if (response?.ok) {
      setConfirmOpen(false);
      setUnderstood(false);
    }
  }

  return <section className="workflow-admin v6-manage" aria-label={`Manage order ${order.code}`}>
    <header className="workflow-admin-header v6-order-header">
      <div>
        <span className="section-kicker">ORDER DETAIL / STAFF WORKSPACE</span>
        <div className="v6-order-title"><h2>{order.code}</h2><span className={`v6-pill ${cancelled ? 'v6-pill-danger' : paid ? 'v6-pill-good' : 'v6-pill-warm'}`}>{cancelled ? 'Cancelled' : paid ? 'Payment confirmed' : cod ? 'COD pending' : 'Awaiting payment'}</span></div>
        <p>Placed {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} · {order.quantity} piece{order.quantity !== 1 ? 's' : ''} · {garment}</p>
      </div>
      <button type="button" className="small-button" onClick={onClose}><X size={16} /> Close</button>
    </header>

    <div className="v6-order-snapshot" aria-label="Order overview">
      <div><span>Total amount</span><strong>{money(Number(order.quoted_total ?? order.estimated_total))}</strong></div>
      <div><span>Payment method</span><strong>{cod ? 'Cash on Delivery' : 'GCash / QR Ph'}</strong></div>
      <div><span>Production</span><strong>{pretty(order.production_status)}</strong></div>
      <div><span>Delivery</span><strong>{pretty(order.delivery_status)}</strong></div>
    </div>

    <div className="v6-manage-grid">
      <div className="v6-manage-column">
        <section className="v6-detail-card">
          <div className="v6-detail-heading"><div className="v6-icon-tile"><ClipboardList size={19}/></div><div><h3>Customer & shipping</h3><p>Information submitted at checkout</p></div></div>
          <div className="v6-info-pair"><span>Customer</span><strong>{order.contact_name}</strong></div>
          <div className="v6-contact-links"><a href={`mailto:${order.email}`}><Mail size={14}/> {order.email}</a><a href={`tel:${order.phone}`}><Phone size={14}/> {order.phone}</a></div>
          <div className="v6-address"><MapPin size={17}/><span><small>Delivery address</small>{order.delivery_address || 'No address entered'}</span></div>
        </section>

        <section className="v6-detail-card">
          <div className="v6-detail-heading"><div className="v6-icon-tile"><FileImage size={19}/></div><div><h3>Customization details</h3><p>What the customer ordered</p></div></div>
          <div className="v6-spec-grid">
            <div><span>Garment</span><strong>{garment}</strong></div>
            <div><span>Quantity</span><strong>{order.quantity} pieces</strong></div>
            <div><span>Team name</span><strong>{order.team_name || 'Not specified'}</strong></div>
            <div><span>Player / Number</span><strong>{[order.player_name, order.player_number].filter(Boolean).join(' · ') || 'Not specified'}</strong></div>
          </div>
          <div className="v6-label">Selected sizes</div>
          <div className="v6-size-chips">{sizeList.length ? sizeList.map(([size, count]) => <span key={size}>{size} <b>×{count}</b></span>) : <span>Not specified</span>}</div>
          <div className="v6-label">Garment colors</div>
          <div className="v6-color-row"><span><i style={{background: order.color || '#7c60f9'}}/> Main</span><span><i style={{background: order.accent_color || '#fff'}}/> Trim</span><span><i style={{background: order.print_color || '#fff'}}/> Print</span></div>
          {(order.front_design_url || order.back_design_url) && <div className="v6-artwork-links">{order.front_design_url && <a href={order.front_design_url} target="_blank" rel="noreferrer">View front design ↗</a>}{order.back_design_url && <a href={order.back_design_url} target="_blank" rel="noreferrer">View back design ↗</a>}</div>}
          {order.notes && <div className="v6-notes"><span>Customer notes</span><p>{order.notes}</p></div>}
        </section>
      </div>

      <div className="v6-manage-column">
        <section className="v6-detail-card v6-action-card">
          <div className="v6-detail-heading"><div className="v6-icon-tile"><Truck size={19}/></div><div><h3>Production & delivery</h3><p>Update what the customer sees in tracking</p></div></div>
          {cancelled ? <div className="v6-cancelled-note"><Ban size={19}/><div><strong>Order cancelled</strong><p>No production or delivery changes are allowed.{cancellationReason ? ` Reason: ${cancellationReason}` : ''}</p></div></div> : <>
            {!cod && !paid && <div className="v6-inform"><ShieldCheck size={16}/> Await verified GCash payment before starting production.</div>}
            <div className="workflow-form-grid v6-form-grid">
              <label>Production stage<select value={production} disabled={busy} onChange={e => setProduction(e.target.value)}><option value="not_started">Not started</option><option value="in_production">In production</option><option value="ready">Ready</option></select></label>
              <label>Delivery stage<select value={delivery} disabled={busy} onChange={e => setDelivery(e.target.value)}><option value="not_ready">Not ready</option><option value="ready_for_pickup">Ready for pickup</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></label>
            </div>
            <label className="v6-full-label">Courier, tracking, or pickup details<input placeholder="e.g. Tracking no. / estimated pickup date" value={details} maxLength={160} disabled={busy} onChange={e => setDetails(e.target.value)}/></label>
            {cod && delivery === 'delivered' && !paid && <label className="cod-collection"><input type="checkbox" checked={collected} onChange={e => setCollected(e.target.checked)}/> Cash actually collected upon delivery</label>}
            <button type="button" className="button button-dark v6-save-button" disabled={busy || (!cod && !paid) || (cod && delivery === 'delivered' && !paid && !collected)} onClick={() => void save('fulfillment_checkout', { production_status: production, delivery_status: delivery, delivery_reference: details, cod_collected: collected })}><PackageCheck size={17}/> {busy ? 'Saving…' : 'Save order progress'}</button>
            <p className="hint">COD payment is recorded only when cash is received. QR payments are confirmed by the provider.</p>
          </>}
        </section>

        <section className="v6-detail-card v6-danger-zone">
          <div className="v6-detail-heading"><div className="v6-icon-tile v6-icon-warning"><AlertTriangle size={19}/></div><div><h3>Cancellation & order safety</h3><p>Keep your order records accurate</p></div></div>
          {cancelled ? <p className="v6-small-explainer">This order is already cancelled. Its record is preserved in Supabase and customers can see the cancellation on their tracking page.</p> : canCancel ? <>
            <p className="v6-small-explainer">If the customer changes their mind or placed a duplicate order, you can cancel this unpaid COD order before production begins.</p>
            <button type="button" className="v6-cancel-trigger" disabled={busy} onClick={() => setConfirmOpen(true)}><Ban size={16}/> Cancel this order</button>
          </> : <div className="v6-inform"><ShieldCheck size={17}/>{cannotCancelWhy}</div>}
        </section>
      </div>
    </div>

    {confirmOpen && <div className="v6-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setConfirmOpen(false); }}>
      <div className="v6-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="v6-cancel-heading">
        <form onSubmit={e => void cancelOrder(e)}>
          <div className="v6-modal-symbol"><AlertTriangle size={25}/></div>
          <span className="section-kicker">CONFIRM CANCELLATION</span>
          <h3 id="v6-cancel-heading">Cancel this COD order?</h3>
          <p>Order <strong>{order.code}</strong> will be marked <strong>Cancelled</strong>. The customer will see the change on their tracking page. The order will stay in your records.</p>
          <label>Reason for cancellation<select autoFocus required value={reason} disabled={busy} onChange={e => setReason(e.target.value as typeof reason)}>{REASONS.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
          <label>Optional details<textarea value={reasonDetail} maxLength={110} disabled={busy} rows={2} placeholder="Short note (optional)" onChange={e => setReasonDetail(e.target.value)}/></label>
          <label className="v6-confirm-check"><input type="checkbox" required checked={understood} disabled={busy} onChange={e => setUnderstood(e.target.checked)}/> I understand this action stops fulfillment of this order.</label>
          <div className="v6-modal-actions"><button type="button" className="small-button" disabled={busy} onClick={() => setConfirmOpen(false)}>Keep order</button><button type="submit" className="v6-confirm-danger" disabled={!understood || busy}><Ban size={16}/> {busy ? 'Cancelling…' : 'Yes, cancel order'}</button></div>
        </form>
      </div>
    </div>}
  </section>;
}
