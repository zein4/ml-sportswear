'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, FileCheck2, Link2, Wallet, X } from 'lucide-react';
import { money } from '@/lib/catalog';
import type {StaffOrder} from '@/lib/admin-types';
import { SHIPPING_STATUSES, PRODUCTION_STATUSES } from './workflow-constants';

type Action=(action:string,extra:Record<string,unknown>)=>Promise<Record<string,unknown>|null>;
export function OrderWorkflowPanel({order,busy,save,onClose}:{order:StaffOrder;busy:boolean;save:Action;onClose:()=>void}){
  const [finalPrice,setFinalPrice]=useState(String(order.quoted_total??''));
  const [deposit,setDeposit]=useState(String(order.deposit_percent||50));
  const [quoteNotes,setQuoteNotes]=useState(order.quote_notes||'');
  const [gcash,setGcash]=useState(order.gcash_instructions||'');
  const [bank,setBank]=useState(order.bank_instructions||'');
  const [production,setProduction]=useState(order.production_status||'not_started');
  const [delivery,setDelivery]=useState(order.delivery_status||'not_ready');
  const [deliveryRef,setDeliveryRef]=useState(order.delivery_reference||'');
  const [link,setLink]=useState('');
  const paid=useMemo(()=>order.payments.filter(p=>p.status==='verified').reduce((sum,p)=>sum+Number(p.expected_amount),0),[order.payments]);
  const outstanding=Math.max(0,Math.round((Number(order.quoted_total||0)-paid)*100)/100);
  useEffect(()=>{
    setFinalPrice(String(order.quoted_total??''));setDeposit(String(order.deposit_percent||50));setQuoteNotes(order.quote_notes||'');setGcash(order.gcash_instructions||'');setBank(order.bank_instructions||'');setProduction(order.production_status||'not_started');setDelivery(order.delivery_status||'not_ready');setDeliveryRef(order.delivery_reference||'');setLink('');
  },[order.id,order.quoted_total,order.deposit_percent,order.quote_notes,order.gcash_instructions,order.bank_instructions,order.production_status,order.delivery_status,order.delivery_reference]);
  const canEditQuote=['new','reviewing','quoted'].includes(order.status)&&!order.customer_approved_at;
  async function makeLink(){
    if(order.has_tracking_link&&!window.confirm('Create a new private tracking link? The customer’s old link will stop working.'))return;
    const data=await save('tracking_link',{confirmRotate:order.has_tracking_link});
    if(typeof data?.trackingLink==='string')setLink(data.trackingLink);
  }
  return <section className="workflow-admin" aria-label={`Manage order ${order.code}`}><div className="workflow-admin-header"><div><span className="section-kicker">STAFF / ORDER WORKFLOW</span><h2>{order.code}</h2><p>{order.contact_name} · {order.email} · {order.phone}</p></div><button type="button" className="small-button" onClick={onClose}><X size={15}/> Close</button></div>
    {['new','reviewing','quoted'].includes(order.status) && !order.customer_approved_at && <div className="workflow-actions workflow-review-controls"><span className="hint">Review stage: <strong>{order.status}</strong></span><button type="button" className="small-button" disabled={busy} onClick={()=>void save('review',{status:'reviewing'})}>Mark reviewing</button><button type="button" className="small-button" disabled={busy} onClick={()=>{if(window.confirm('Cancel this quotation request?'))void save('review',{status:'cancelled'});}}>Cancel request</button></div>}
    <div className="workflow-admin-grid">
      <div className="customer-card"><h3><Link2 size={19}/> Customer tracking link</h3><p>Customers receive a private link after submitting an order. For older orders or a lost link, issue a replacement and share it privately.</p><button type="button" className="small-button" disabled={busy} onClick={()=>void makeLink()}>{order.has_tracking_link?'Replace lost tracking link':'Create tracking link'}</button>
        {link&&<div className="workflow-link"><input readOnly value={link} aria-label="New private tracking link"/><button type="button" className="small-button" onClick={()=>void navigator.clipboard.writeText(link)}><Copy size={14}/> Copy</button><small>This link is displayed once. Copy it before closing the panel.</small></div>}
      </div>
      <div className="customer-card"><h3><FileCheck2 size={19}/> Issue final quotation</h3><p>Sample estimate {money(order.estimated_total)}. Only the final quotation below will be offered for customer approval.</p><div className="workflow-form-grid"><label>Final price (₱)<input type="number" min="0.01" max="10000000" step="0.01" disabled={!canEditQuote} value={finalPrice} onChange={e=>setFinalPrice(e.target.value)}/></label><label>Down payment (%)<input type="number" min="1" max="100" step="1" disabled={!canEditQuote} value={deposit} onChange={e=>setDeposit(e.target.value)}/></label></div>
        <label>Quote notes / terms<textarea rows={2} maxLength={1200} disabled={!canEditQuote} value={quoteNotes} onChange={e=>setQuoteNotes(e.target.value)} placeholder="Production timeline, inclusions and other agreed terms"/></label>
        <label>Official GCash instructions<textarea rows={2} maxLength={700} disabled={!canEditQuote} value={gcash} onChange={e=>setGcash(e.target.value)} placeholder="Official name and GCash number, entered by ML Sportswear staff"/></label>
        <label>Official bank transfer instructions<textarea rows={2} maxLength={700} disabled={!canEditQuote} value={bank} onChange={e=>setBank(e.target.value)} placeholder="Official bank name, account name and account number"/></label>
        {canEditQuote?<button type="button" className="button button-dark" disabled={busy||!finalPrice||(!gcash&&!bank)} onClick={()=>void save('quote',{quoted_total:Number(finalPrice),deposit_percent:Number(deposit),quote_notes:quoteNotes,gcash_instructions:gcash,bank_instructions:bank})}>Issue / update quotation</button>:<p className="workflow-success"><CheckCircle2 size={16}/> Quotation is locked after customer approval.</p>}
        <p className="hint">Never enter placeholder payment details on a public live website.</p>
      </div>
      <div className="customer-card"><h3><Wallet size={19}/> Payment verification</h3><div className="payment-summary"><div><small>Verified</small><b>{money(paid)}</b></div><div><small>Outstanding</small><b>{order.quoted_total===null?'Not quoted':money(outstanding)}</b></div></div>
        {order.payments.length===0?<p>No payment proof has been submitted.</p>:order.payments.map(p=><div key={p.id} className="staff-payment"><div><strong>{p.stage==='initial'?'Initial payment':'Balance payment'} · {money(Number(p.expected_amount))}</strong><small>{p.method==='gcash'?'GCash':'Bank'} · {p.status} {p.customer_reference?`· Ref ${p.customer_reference}`:''}</small></div>{p.proof_url&&<a href={p.proof_url} target="_blank" rel="noopener noreferrer">View private proof</a>}
          {p.status==='submitted'&&<div className="workflow-actions"><button type="button" className="small-button" disabled={busy} onClick={()=>{if(window.confirm('Have you independently verified the amount was actually received?'))void save('payment_review',{payment_id:p.id,decision:'verified'});}}>Verify received payment</button><button type="button" className="small-button" disabled={busy} onClick={()=>void save('payment_review',{payment_id:p.id,decision:'rejected'})}>Reject proof</button></div>}
        </div>)}
        <p className="hint">A screenshot or transfer reference is NOT confirmation that money was received. Check the official business account first.</p>
      </div>
      <div className="customer-card"><h3><CheckCircle2 size={19}/> Production & delivery</h3><p>Customer approval: {order.customer_approved_at?'Approved':'Waiting'} · Payment: {paid>0?'Initial payment verified':'Not verified'}</p>
        <div className="workflow-form-grid"><label>Production<select value={production} onChange={e=>setProduction(e.target.value)}>{PRODUCTION_STATUSES.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label><label>Delivery<select value={delivery} onChange={e=>setDelivery(e.target.value)}>{SHIPPING_STATUSES.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label></div>
        <label>Tracking number or pickup details<input maxLength={160} value={deliveryRef} onChange={e=>setDeliveryRef(e.target.value)} placeholder="Courier number or confirmed pickup details"/></label>
        <button type="button" className="button button-dark" disabled={busy||!order.customer_approved_at||paid<=0} onClick={()=>void save('fulfillment',{production_status:production,delivery_status:delivery,delivery_reference:deliveryRef})}>Save production updates</button>
        <p className="hint">Production requires verified payment. Shipping and final delivery also require the full balance to be verified.</p>
      </div>
    </div>
  </section>;
}
