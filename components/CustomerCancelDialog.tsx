'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Ban, X } from 'lucide-react';

const reasons = ['Changed my mind', 'Ordered by mistake', 'Wrong size or design', 'Wrong delivery details', 'Other'] as const;
export function CustomerCancelDialog({orderCode, busy, onClose, onConfirm, errorText}:{orderCode:string;busy:boolean;onClose:()=>void;onConfirm:(reason:string,detail:string)=>Promise<boolean>;errorText?:string}) {
  const [reason,setReason]=useState<string>(reasons[0]);
  const [detail,setDetail]=useState('');
  const [understood,setUnderstood]=useState(false);
  const [localBusy,setLocalBusy]=useState(false);
  useEffect(()=>{
    const handleKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy&&!localBusy)onClose();};
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  },[busy,localBusy,onClose]);
  async function submit(event:FormEvent) {
    event.preventDefault();if(!understood||busy||localBusy)return;
    setLocalBusy(true);
    try {if(await onConfirm(reason,detail))onClose();}
    finally {setLocalBusy(false);}
  }
  const locked=busy||localBusy;
  return <div className="v6-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!locked)onClose();}}>
    <section role="dialog" aria-modal="true" aria-labelledby="v6-buyer-cancel-title" className="v6-confirm-modal">
      <form onSubmit={e=>void submit(e)}>
        <div className="v6-modal-close-row"><div className="v6-modal-symbol"><AlertTriangle size={23}/></div><button type="button" aria-label="Close" className="v6-icon-button" disabled={locked} onClick={onClose}><X size={19}/></button></div>
        <span className="section-kicker">ORDER CANCELLATION</span>
        <h2 id="v6-buyer-cancel-title">Cancel your order?</h2>
        <p>You're about to cancel <strong>{orderCode}</strong>. No payment will be collected for this unpaid COD order. Cancellation cannot be undone from this page.</p>
        <label>Why are you cancelling?<select autoFocus value={reason} onChange={e=>setReason(e.target.value)} disabled={locked} required>{reasons.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
        <label>Additional details (optional)<textarea value={detail} onChange={e=>setDetail(e.target.value)} maxLength={110} rows={2} disabled={locked} placeholder="Let the shop know what happened…"/></label>
        {errorText&&<div className="v6-modal-error" role="alert">{errorText}</div>}
        <label className="v6-confirm-check"><input type="checkbox" checked={understood} disabled={locked} onChange={e=>setUnderstood(e.target.checked)} required/> I understand that this order will no longer be produced or delivered.</label>
        <div className="v6-modal-actions"><button className="small-button" type="button" disabled={locked} onClick={onClose}>Keep my order</button><button className="v6-confirm-danger" type="submit" disabled={!understood||locked}><Ban size={16}/>{locked?'Cancelling…':'Confirm cancellation'}</button></div>
      </form>
    </section>
  </div>;
}
