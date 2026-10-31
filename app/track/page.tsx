'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Ban, ClipboardList, CreditCard, Factory, FileCheck2, PackageCheck, RefreshCw, ShieldCheck, Truck, MapPin, Shirt, Ruler, Package, Info } from 'lucide-react';
import { CustomerCancelDialog } from '@/components/CustomerCancelDialog';
import { GARMENTS } from '@/lib/catalog';
import { money } from '@/lib/catalog';
import { GCashPaymentCard } from '@/components/GCashPaymentCard';

type Payment = { id:string;stage:string;payment_option:string;method:string;expected_amount:number;status:string;created_at:string };
type CustomerOrder = {code:string;garment:string;quantity:number;team_name:string;player_name?:string;player_number?:string;sizes?:Record<string,number>;color?:string;accent_color?:string;print_color?:string;status:string;quote_notes:string;quoted_total:number|null;deposit_percent:number;gcash_instructions:string;bank_instructions:string;quote_issued_at:string|null;customer_approved_at:string|null;production_status:string;delivery_status:string;delivery_reference:string;verified_amount:number;balance:number|null;payments:Payment[];checkout_method?:string|null;checkout_status?:string;checkout_url?:string|null;delivery_address?:string;paid_at?:string|null};
const stages=[
  ['Design submitted','Your customization request was received.'],
  ['Quote prepared','Staff reviews your design and sets the final price.'],
  ['Quote approved','You accept the confirmed price before paying.'],
  ['Payment method chosen','Choose GCash or bank transfer and the amount to pay.'],
  ['Payment proof submitted','Upload proof for your deposit or full amount.'],
  ['Payment verified','Staff checks the transfer before production begins.'],
  ['Production & delivery','Follow your item until it is ready, shipped or delivered.'],
];
export default function TrackPage() {
  const [code,setCode]=useState(''),[token,setToken]=useState('');
  const [order,setOrder]=useState<CustomerOrder|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [method,setMethod]=useState<'gcash'|'bank_transfer'>('gcash');
  const [option,setOption]=useState<'deposit'|'full'|'balance'>('deposit');
  const [reference,setReference]=useState(''),[file,setFile]=useState<File|null>(null);
  const [manualCode,setManualCode]=useState(''),[manualToken,setManualToken]=useState('');
  const [cancelOpen,setCancelOpen]=useState(false);
  const load=useCallback(async(c:string,t:string,action='view')=>{
    setBusy(true);setError('');setMessage('');
    try {
      const res=await fetch('/api/customer/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:c,token:t,action}),cache:'no-store'});
      const json=await res.json(); if(!res.ok)throw Error(json.error||'Could not load the order.');
      setOrder(json.order);if(action==='approve')setMessage('Quotation approved. You can now submit your payment proof.');
    }catch(e){setError(e instanceof Error?e.message:'Could not load the order.');}finally{setBusy(false);}
  },[]);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.hash.slice(1));
    const c=params.get('code')||'',t=params.get('token')||'';
    if(c&&t){setCode(c);setToken(t);void load(c,t);}
  },[load]);
  function access(e:FormEvent){e.preventDefault();const c=manualCode.trim(),t=manualToken.trim();setCode(c);setToken(t);window.location.hash=`code=${encodeURIComponent(c)}&token=${encodeURIComponent(t)}`;void load(c,t);}
  async function submitPayment(e:FormEvent){
    e.preventDefault();if(!file||!order)return setError('Please select a payment proof file.');
    setBusy(true);setError('');setMessage('');
    try {
      const form=new FormData();form.set('code',code);form.set('token',token);form.set('method',method);form.set('payment_option',option);form.set('reference',reference);form.set('proof',file);
      const res=await fetch('/api/customer/payment',{method:'POST',body:form});const j=await res.json();
      if(!res.ok)throw Error(j.error||'Could not submit payment proof.');
      setFile(null);setReference('');setOrder(j.order||order);setMessage('Proof received. Staff must verify the payment before it is marked paid.');
    }catch(e){setError(e instanceof Error?e.message:'Could not submit proof.');}finally{setBusy(false);}
  }
  const canCancelOrder = Boolean(order?.checkout_method === 'cod' && order.checkout_status === 'cod_pending'
    && order.status !== 'cancelled' && order.production_status === 'not_started'
    && order.delivery_status === 'not_ready');
  async function cancelCustomerOrder(reason:string,detail:string):Promise<boolean> {
    if(!canCancelOrder)return false;
    setBusy(true);setError('');setMessage('');
    try {
      const res=await fetch('/api/customer/order',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code,token,action:'cancel_checkout',reason,detail}),cache:'no-store'});
      const json=await res.json();if(!res.ok)throw Error(json.error||'Unable to cancel your order.');
      setOrder(json.order);setMessage('Your COD order has been cancelled.');return true;
    } catch(e){setError(e instanceof Error?e.message:'Unable to cancel order.');return false;}
    finally{setBusy(false);}
  }
  const verifiedFirst=order?.payments.some(p=>p.stage==='initial'&&p.status==='verified')||false;
  const pending=order?.payments.some(p=>p.status==='submitted')||false;
  const paid=Number(order?.verified_amount||0);
  const total=Number(order?.quoted_total||0);
  const remaining=Math.max(0,Math.round((total-paid)*100)/100);
  const due=verifiedFirst||option==='full'?remaining:Math.min(remaining,Math.round(total*Number(order?.deposit_percent||50))/100);
  const selectedInstructions=method==='gcash'?order?.gcash_instructions:order?.bank_instructions;
  const approved=Boolean(order?.customer_approved_at);
  const activeStep=order?.delivery_status==='delivered'?7:order?.production_status!=='not_started'?7:paid>0?6:pending?5:approved?3:order?.status==='quoted'?2:1;
  if(order?.checkout_method) {
    const cancelled=order.status==='cancelled'||order.checkout_status==='cancelled';
    const cod=order.checkout_method==='cod', paid=order.checkout_status==='paid'||order.checkout_status==='cod_collected';
    const garment=GARMENTS.find(g=>g.id===order.garment)?.label||order.garment;
    const sizes=Object.entries(order.sizes||{}).filter(([,qty])=>Number(qty)>0);
    const steps=[
      {label:'Order placed',complete:true},
      {label:'In production',complete:order.production_status==='in_production'||order.production_status==='ready'},
      {label:'Ready to deliver',complete:order.production_status==='ready'||order.delivery_status!=='not_ready'},
      {label:'Out for delivery',complete:order.delivery_status==='shipped'||order.delivery_status==='delivered'},
      {label:'Delivered',complete:order.delivery_status==='delivered'},
    ];
    return <main className="track-page v6-buyer-portal">
      <div className="v6-buyer-hero"><div><span className="section-kicker">ML SPORTSWEAR / MY ORDER</span><h1>{cancelled?'Order cancelled.':<>Your order, <em>your way.</em></>}</h1><p>{cancelled?'This order is closed. No delivery is scheduled.':'A clear view of your customized sportswear, payment, and delivery progress.'}</p></div><div className="v6-hero-illustration"><Package size={48}/></div></div>
      <section className="customer-card v6-buyer-order-card"><div className="track-card-heading"><div><span className="section-kicker">ORDER REFERENCE</span><h2>{order.code}</h2><p>{order.quantity} piece{order.quantity===1?'':'s'} · {garment} · {order.team_name||'Custom design'}</p></div><div className="v6-buyer-top-actions"><span className={`v6-pill ${cancelled?'v6-pill-danger':paid?'v6-pill-good':'v6-pill-purple'}`}>{cancelled?'Cancelled':paid?'Payment confirmed':cod?'COD · Not paid':'Awaiting payment'}</span><button type="button" className="small-button" disabled={busy} onClick={()=>void load(code,token)}><RefreshCw size={14}/> Refresh</button></div></div>
      {cancelled?<div className="v6-track-cancelled"><Ban size={25}/><div><strong>Your order was cancelled</strong><p>There is no payment or delivery due. The order remains in your history for reference.</p>{order.delivery_reference?.startsWith('Cancellation reason:')&&<p className="v6-track-reason">{order.delivery_reference}</p>}</div></div>:<>
        <div className="v6-section-heading"><h3>Order journey</h3><span>Updated by ML Sportswear</span></div>
        <div className="v6-buyer-progress">{steps.map((step,i)=><div key={step.label} className={`v6-journey-step ${step.complete?'is-done':''}`}><div className="v6-journey-dot">{step.complete?<CheckCircle2 size={18}/>:String(i+1).padStart(2,'0')}</div><span>{step.label}</span></div>)}</div>
        <div className="v6-buyer-status-grid"><div><span><CreditCard size={16}/> Payment</span><strong>{cod?(paid?'COD collected':'Cash on Delivery'):(paid?'Paid':(order.payments.some(p=>p.status==='submitted')?'Receipt under review':'Awaiting GCash payment'))}</strong></div><div><span><Factory size={16}/> Production</span><strong>{order.production_status.replaceAll('_',' ')}</strong></div><div><span><Truck size={16}/> Delivery</span><strong>{order.delivery_status.replaceAll('_',' ')}</strong></div></div>
      </>}
      </section>
      <div className="v6-buyer-columns"><section className="customer-card v6-buyer-detail-card"><div className="v6-section-heading"><h3><Shirt size={19}/> Your custom sportswear</h3></div><div className="v6-buyer-product"><div className="v6-product-icon" style={{borderColor:order.color||'var(--line)'}}><Shirt size={40} color={order.color||'var(--blue)'}/></div><div><strong>{garment}</strong><span>{order.team_name||'Personalized design'} · Quantity {order.quantity}</span><b>{money(Number(order.quoted_total||0))}</b></div></div><div className="v6-detail-pairs"><div><span>Player name</span><strong>{order.player_name||'—'}</strong></div><div><span>Jersey number</span><strong>{order.player_number||'—'}</strong></div></div><div className="v6-size-row"><Ruler size={16}/><span>Sizes</span><div>{sizes.length?sizes.map(([size,qty])=><span key={size}>{size} ×{qty}</span>):<em>Not specified</em>}</div></div><div className="v6-buyer-swatches"><span>Colors</span>{[order.color,order.accent_color,order.print_color].filter(Boolean).map((color,index)=><i key={index} style={{backgroundColor:color}} title={`${['Main','Trim','Print'][index]} ${color}`}/>)}</div></section>
      <section className="customer-card v6-buyer-detail-card"><div className="v6-section-heading"><h3><MapPin size={19}/> Shipping & payment</h3></div><div className="v6-buyer-shipping"><span>Delivery address</span><strong>{order.delivery_address||'Not provided'}</strong></div><div className="v6-buyer-shipping"><span>Payment method</span><strong>{cod?'Cash on Delivery':'GCash / QR Ph'}</strong></div>{order.delivery_reference&&!order.delivery_reference.startsWith('Cancellation reason:')&&<div className="v6-buyer-shipping"><span>Courier / pickup details</span><strong>{order.delivery_reference}</strong></div>}<div className="v6-buyer-total"><span>Total amount</span><strong>{money(Number(order.quoted_total||0))}</strong></div><p className="v6-small-explainer">{cod?'For COD, pay the courier when your item arrives.':paid?'Your online payment has been confirmed.':'Scan the official shop GCash QR and upload your receipt. Staff verifies payment manually.'}</p>{!cancelled&&!cod&&<GCashPaymentCard code={code} token={token} amount={Number(order.quoted_total||0)} status={order.checkout_status||''} proofPending={order.payments.some(p=>p.status==='submitted')} onSubmitted={()=>void load(code,token)}/>} </section></div>
      {!cancelled&&<section className="customer-card v6-buyer-help-card"><div><div className="v6-section-heading"><h3><Info size={19}/> Need to change your order?</h3></div><p>Orders can be cancelled directly while COD payment is pending and production hasn't started. For design changes or paid orders, contact ML Sportswear.</p></div>{canCancelOrder?<button type="button" className="v6-cancel-trigger" disabled={busy} onClick={()=>setCancelOpen(true)}><Ban size={16}/> Cancel order</button>:<span className="v6-pill">Online cancellation unavailable</span>}</section>}
      {error&&<div className="request-error" role="alert">{error}</div>}{message&&<div className="workflow-success" role="status">{message}</div>}
      <p className="hint v6-tracking-privacy"><ShieldCheck size={15}/> Your tracking link is private. Don't share it publicly.</p>
      {cancelOpen&&<CustomerCancelDialog orderCode={order.code} busy={busy} onClose={()=>setCancelOpen(false)} onConfirm={cancelCustomerOrder} errorText={error}/>}
    </main>;
  }
  return <main className="track-page"><div className="track-intro"><span className="section-kicker">ML SPORTSWEAR / CUSTOMER PORTAL</span><h1>Track your <em>order.</em></h1><p>Approve the final quote, submit payment proof, then follow production and delivery using your private link.</p></div>
    {!order&&<section className="customer-card"><h2><ShieldCheck size={22}/> Open your private tracking link</h2><p>Use the link shown after you submitted your request, or enter the reference and private access key here.</p><form onSubmit={access} className="track-access"><label>Order reference<input value={manualCode} onChange={e=>setManualCode(e.target.value)} placeholder="ML-20261026-XXXXXXXX" required/></label><label>Private access key<input value={manualToken} onChange={e=>setManualToken(e.target.value)} placeholder="64-character private key" required/></label><button className="button button-dark" disabled={busy}>Open order <ArrowRight size={17}/></button></form></section>}
    {order&&<>
      <section className="customer-card"><div className="track-card-heading"><div><span className="section-kicker">ORDER REFERENCE</span><h2>{order.code}</h2><p>{order.quantity} item(s) · {order.team_name||'Custom garment'} · {order.garment}</p></div><button type="button" className="small-button" disabled={busy} onClick={()=>void load(code,token)}><RefreshCw size={15}/> Refresh</button></div>
        <div className="track-timeline">{stages.map(([title,detail],idx)=><div key={title} className={`track-step ${activeStep>=idx+1?'track-step-done':''}`}><span className="track-step-dot">{activeStep>=idx+1?<CheckCircle2 size={17}/>:String(idx+1).padStart(2,'0')}</span><div><strong>{title}</strong><p>{detail}</p></div></div>)}</div>
        <div className="track-status-grid"><div><small>Order stage</small><b>{order.status.replaceAll('_',' ')}</b></div><div><small>Production</small><b>{order.production_status.replaceAll('_',' ')}</b></div><div><small>Delivery</small><b>{order.delivery_status.replaceAll('_',' ')}</b></div></div>
        {order.delivery_reference&&<p className="hint">Delivery / pickup details: {order.delivery_reference}</p>}
      </section>
      <section className="customer-card"><h2><ClipboardList size={22}/> Final quotation</h2>
        {order.quoted_total===null?<p>ML Sportswear is reviewing your customization. No payment is required until a final price is issued.</p>:<><div className="track-price"><span>Final confirmed price</span><strong>{money(total)}</strong></div><p className="hint">{order.quote_notes||'Review the approved design and payment terms before continuing.'}</p>
          {!approved&&order.status==='quoted'?<button type="button" disabled={busy} className="button button-dark" onClick={()=>void load(code,token,'approve')}>I approve this quotation <FileCheck2 size={17}/></button>:approved?<p className="workflow-success"><CheckCircle2 size={17}/> You approved this quotation.</p>:<p>This quotation is not currently available for approval. Contact the business for details.</p>}
        </>}
      </section>
      {approved&&<section className="customer-card"><h2><CreditCard size={22}/> Payment and balance</h2><div className="payment-summary"><div><small>Verified payment</small><b>{money(paid)}</b></div><div><small>Balance remaining</small><b>{money(remaining)}</b></div></div>
        {order.payments.length>0&&<div className="payment-records">{order.payments.map(p=><div key={p.id}><span>{p.stage==='balance'?'Balance':'Initial'} · {p.method==='gcash'?'GCash':'Bank transfer'} · {money(Number(p.expected_amount))}</span><strong>{p.status.replaceAll('_',' ')}</strong></div>)}</div>}
        {pending?<p className="workflow-wait">Your payment proof is awaiting staff verification. You do not need to submit it again.</p>:remaining<=0?<p className="workflow-success"><CheckCircle2 size={17}/> Fully paid and verified.</p>:<form className="payment-form" onSubmit={submitPayment}>
          <p>Choose your payment option. This website <strong>does not collect or process money</strong>. Transfer funds using only ML Sportswear's verified instructions, then upload your receipt.</p>
          <div className="payment-controls"><label>Payment method<select value={method} onChange={e=>setMethod(e.target.value as 'gcash'|'bank_transfer')}><option value="gcash" disabled={!order.gcash_instructions}>GCash</option><option value="bank_transfer" disabled={!order.bank_instructions}>Bank transfer</option></select></label><label>Amount to pay<select value={verifiedFirst?'balance':option} disabled={verifiedFirst} onChange={e=>setOption(e.target.value as 'deposit'|'full'|'balance')}>{verifiedFirst?<option value="balance">Remaining balance</option>:<><option value="deposit">{order.deposit_percent}% down payment</option><option value="full">Pay in full</option></>}</select></label></div>
          <div className="payment-due"><span>Amount to transfer</span><strong>{money(due)}</strong></div>
          <div className="payment-instructions"><strong>Payment instructions from ML Sportswear</strong><p>{selectedInstructions||'This payment method is unavailable. Please select the other method.'}</p></div>
          <label>Payment reference <small>(optional)</small><input maxLength={100} value={reference} onChange={e=>setReference(e.target.value)} placeholder="GCash / bank reference"/></label>
          <label>Proof of transfer (PNG, JPG, WebP or PDF up to 4 MB)<input type="file" required accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
          <button type="submit" className="button button-dark" disabled={busy||!selectedInstructions||!file}>Submit payment proof <ArrowRight size={17}/></button><p className="hint">Uploading proof does not mean payment is verified. Staff will review it.</p>
        </form>}
      </section>}
      <section className="customer-card"><h2><Factory size={22}/> Production and delivery updates</h2><div className="tracking-milestones"><p><CheckCircle2 size={16}/> Design request recorded</p><p><FileCheck2 size={16}/> {approved?'Final quote approved':'Awaiting customer approval'}</p><p><ShieldCheck size={16}/> {paid>0?'Payment verified':'Awaiting payment verification'}</p><p><Factory size={16}/> Production: {order.production_status.replaceAll('_',' ')}</p><p><Truck size={16}/> Delivery: {order.delivery_status.replaceAll('_',' ')}</p><p><PackageCheck size={16}/> {order.delivery_status==='delivered'?'Order delivered':'Delivery pending'}</p></div></section>
    </>}
    {error&&<div className="request-error" role="alert">{error}</div>}{message&&<div className="workflow-success" role="status">{message}</div>}
    <p className="hint">Keep your tracking URL private. If you lose it, contact ML Sportswear and provide your order reference.</p>
  </main>;
}
