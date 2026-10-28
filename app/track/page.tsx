'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, CreditCard, Factory, FileCheck2, PackageCheck, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { money } from '@/lib/catalog';

type Payment = { id:string;stage:string;payment_option:string;method:string;expected_amount:number;status:string;created_at:string };
type CustomerOrder = {code:string;garment:string;quantity:number;team_name:string;status:string;quote_notes:string;quoted_total:number|null;deposit_percent:number;gcash_instructions:string;bank_instructions:string;quote_issued_at:string|null;customer_approved_at:string|null;production_status:string;delivery_status:string;delivery_reference:string;verified_amount:number;balance:number|null;payments:Payment[]};
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
  const verifiedFirst=order?.payments.some(p=>p.stage==='initial'&&p.status==='verified')||false;
  const pending=order?.payments.some(p=>p.status==='submitted')||false;
  const paid=Number(order?.verified_amount||0);
  const total=Number(order?.quoted_total||0);
  const remaining=Math.max(0,Math.round((total-paid)*100)/100);
  const due=verifiedFirst||option==='full'?remaining:Math.min(remaining,Math.round(total*Number(order?.deposit_percent||50))/100);
  const selectedInstructions=method==='gcash'?order?.gcash_instructions:order?.bank_instructions;
  const approved=Boolean(order?.customer_approved_at);
  const activeStep=order?.delivery_status==='delivered'?7:order?.production_status!=='not_started'?7:paid>0?6:pending?5:approved?3:order?.status==='quoted'?2:1;
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
