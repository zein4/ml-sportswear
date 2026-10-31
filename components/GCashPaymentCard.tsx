'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Clock3, QrCode, ShieldCheck, UploadCloud } from 'lucide-react';
import { money } from '@/lib/catalog';

type GCashInfo={qrUrl:string|null;name:string;number:string};
type Props={code:string;token:string;amount:number;status?:string;proofPending?:boolean;onSubmitted?:()=>void};
export function GCashPaymentCard({code,token,amount,status,proofPending=false,onSubmitted}:Props){
 const [info,setInfo]=useState<GCashInfo|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [file,setFile]=useState<File|null>(null),[reference,setReference]=useState('');
 useEffect(()=>{let alive=true;void fetch('/api/storefront',{cache:'no-store'}).then(r=>r.json()).then(j=>{if(alive)setInfo(j.gcash||null);}).catch(()=>{if(alive)setInfo(null);});return()=>{alive=false;};},[]);
 const paid=status==='paid';
 async function submit(e:FormEvent){
  e.preventDefault();if(!file||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const form=new FormData();form.set('code',code);form.set('token',token);form.set('reference',reference);form.set('proof',file);
   const res=await fetch('/api/customer/qr-proof',{method:'POST',body:form});const data=await res.json();
   if(!res.ok)throw Error(data.error||'Could not submit proof.');
   setNotice('Receipt submitted. Your order will remain unpaid until staff verifies the GCash transaction.');setFile(null);setReference('');onSubmitted?.();
  }catch(e){setError(e instanceof Error?e.message:'Could not submit receipt.');}finally{setBusy(false);}
 }
 return <section className="ml12-gcash-card" aria-label="GCash QR payment">
  <div className="ml12-gcash-title"><QrCode size={24}/><div><h3>Pay using the official shop QR</h3><p>Scan with GCash, then submit your payment receipt.</p></div></div>
  {paid?<div className="ml12-pay-note"><CheckCircle2 size={19}/> Payment verified by ML Sportswear.</div>:
   <>
    {info?.qrUrl?<div className="ml12-qr-details"><a href={info.qrUrl} target="_blank" rel="noreferrer" title="Open QR in new tab"><img src={info.qrUrl} alt="ML Sportswear official GCash payment QR" width="240" height="240"/></a><div><span className="ml12-qr-tag">OFFICIAL SHOP PAYMENT</span>{info.name&&<p>Account name <strong>{info.name}</strong></p>}{info.number&&<p>GCash number <strong>{info.number}</strong></p>}<p>Amount to transfer</p><b className="ml12-qr-amount">{amount>0?money(amount):'See order total in tracking'}</b><small>Open the QR on another device to scan, or save it for use inside GCash. Verify the recipient in the GCash app before sending.</small></div></div>:<p className="ml12-pay-warning">The shop has not uploaded its QR yet. Please do not send money to any unverified account. Contact ML Sportswear for assistance.</p>}
    {proofPending?<div className="ml12-pay-note"><Clock3 size={18}/> Receipt received. Awaiting staff confirmation in GCash.</div>:info?.qrUrl&&<form onSubmit={submit} className="ml12-proof-form"><label>GCash transaction reference (optional)<input value={reference} maxLength={100} onChange={e=>setReference(e.target.value)} placeholder="Enter GCash reference number"/></label><label>Upload payment receipt<input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="button button-dark" type="submit" disabled={busy||!file}><UploadCloud size={17}/>{busy?'Submitting…':'Submit receipt for verification'}</button></form>}
    <p className="ml12-pay-disclaimer"><ShieldCheck size={15}/> Uploading a receipt does not confirm payment. Staff must check the actual incoming transaction before processing the order.</p>
   </>}
  {error&&<p className="request-error" role="alert">{error}</p>}{notice&&<p className="workflow-success" role="status">{notice}</p>}
 </section>;
}
