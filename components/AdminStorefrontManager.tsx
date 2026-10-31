'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, ImagePlus, Ruler, Save, ShieldCheck, Trash2, Wallet } from 'lucide-react';
import { GARMENTS, SIZES } from '@/lib/catalog';
import { MEASURES, MEASURE_LABELS, type SizeChart } from '@/lib/storefront-shared';

type Settings={sizeChart:SizeChart;gcash:{qrUrl:string|null;name:string;number:string};hasQR:boolean};
export function AdminStorefrontManager({token}:{token:string}){
 const [settings,setSettings]=useState<Settings|null>(null),[chart,setChart]=useState<SizeChart>({}),[garment,setGarment]=useState<string>('sando');
 const [name,setName]=useState(''),[number,setNumber]=useState(''),[qr,setQr]=useState<File|null>(null);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=async()=>{
  setLoading(true);try{const res=await fetch('/api/admin/storefront',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});const j=await res.json();if(!res.ok)throw Error(j.error||'Unable to load settings.');setSettings(j);setChart(j.sizeChart||{});setName(j.gcash?.name||'');setNumber(j.gcash?.number||'');}
  catch(e){setError(e instanceof Error?e.message:'Could not load settings.');}finally{setLoading(false);}
 };
 useEffect(()=>{if(token)void load();},[token]);
 async function saveChart(){
  setSaving(true);setError('');setMessage('');try{const res=await fetch('/api/admin/storefront',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({sizeChart:chart})});const j=await res.json();if(!res.ok)throw Error(j.error||'Cannot save guide.');setMessage('Size guide saved. Buyers can now view the updated measurements.');}catch(e){setError(e instanceof Error?e.message:'Save failed.');}finally{setSaving(false);}
 }
 async function savePayment(e:FormEvent,remove=false){
  e.preventDefault();if(remove&&!window.confirm('Remove the shop QR? Customers will no longer be able to place new QR orders until a replacement is uploaded.'))return;
  setSaving(true);setError('');setMessage('');try{
   const form=new FormData();form.set('name',name);form.set('number',number);if(qr&&!remove)form.set('qr',qr);if(remove)form.set('remove','true');
   const res=await fetch('/api/admin/storefront',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});const j=await res.json();if(!res.ok)throw Error(j.error||'Cannot save QR.');
   setSettings(j.settings);setQr(null);setMessage(remove?'QR removed. GCash checkout is temporarily unavailable.':'GCash details saved. Buyers can see the current QR.');
  }catch(e){setError(e instanceof Error?e.message:'Unable to save QR.');}finally{setSaving(false);}
 }
 const update=(size:string,field:string,value:string)=>{
  const next={...chart,[garment]:{...(chart[garment]||{}),[size]:{...(chart[garment]?.[size]||{})}}};
  if(value.trim()==='')delete (next[garment][size] as Record<string,number>)[field];
  else (next[garment][size] as Record<string,number>)[field]=Number(value);
  setChart(next);
 };
 return <section className="ml12-admin-tools" aria-label="Store settings">
  <div className="ml12-admin-tools-title"><div><span className="section-kicker">MANAGE YOUR STOREFRONT</span><h2>Size guide & GCash settings</h2><p>Update measurements and your official payment QR without editing website code.</p></div></div>
  {loading?<p>Loading shop settings…</p>:<div className="ml12-admin-tool-grid">
   <div className="ml12-admin-panel"><div className="ml12-panel-heading"><Ruler size={21}/><div><h3>Editable size guide</h3><p>All measurements are in centimeters. Leave unknown values blank.</p></div></div>
    <label className="ml12-field">Garment<select value={garment} onChange={e=>setGarment(e.target.value)}>{GARMENTS.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
    <div className="ml12-table-scroll"><table className="ml12-size-table"><thead><tr><th>Size</th>{MEASURES.map(k=><th key={k}>{MEASURE_LABELS[k]} (cm)</th>)}</tr></thead><tbody>{SIZES.map(size=><tr key={size}><th>{size}</th>{MEASURES.map(k=><td key={k}><input aria-label={`${size} ${MEASURE_LABELS[k]}`} type="number" min="0.1" max="300" step="0.1" placeholder="—" value={chart[garment]?.[size]?.[k]??''} onChange={e=>update(size,k,e.target.value)}/></td>)}</tr>)}</tbody></table></div>
    <button type="button" className="button button-dark ml12-action" disabled={saving} onClick={()=>void saveChart()}><Save size={16}/>{saving?'Saving…':'Save size guide'}</button>
   </div>
   <div className="ml12-admin-panel"><div className="ml12-panel-heading"><Wallet size={21}/><div><h3>GCash QR payment</h3><p>Upload a new QR at any time. Only staff can change it.</p></div></div>
    <form onSubmit={e=>void savePayment(e)} className="ml12-admin-payment-form"><label>Official GCash account name<input value={name} maxLength={100} placeholder="Shop's verified name" onChange={e=>setName(e.target.value)}/></label><label>GCash number<input value={number} maxLength={30} placeholder="e.g. 09XXXXXXXXX" onChange={e=>setNumber(e.target.value)}/></label>
     {settings?.gcash.qrUrl?<div className="ml12-admin-qr"><img src={settings.gcash.qrUrl} width="200" height="200" alt="Current official shop GCash QR"/><span><CheckCircle2 size={16}/> Current QR displayed to buyers</span></div>:<div className="ml12-qr-empty">No GCash QR uploaded yet</div>}
     <label className="ml12-upload-label"><ImagePlus size={17}/> {qr?qr.name:'Choose QR image (PNG, JPG, WebP · max 2 MB)'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setQr(e.target.files?.[0]||null)}/></label>
     <button type="submit" disabled={saving} className="button button-dark ml12-action"><Save size={16}/>{saving?'Saving…':qr?'Upload and replace QR':'Save account details'}</button>{settings?.hasQR&&<button type="button" className="ml12-remove" disabled={saving} onClick={e=>void savePayment(e,true)}><Trash2 size={15}/> Remove old QR</button>}
    </form><p className="ml12-staff-warning"><ShieldCheck size={16}/> Staff must independently verify each incoming GCash payment before marking an order paid.</p>
   </div>
  </div>}
  {error&&<p className="request-error" role="alert">{error}</p>}{message&&<p className="workflow-success" role="status"><CheckCircle2 size={16}/>{message}</p>}
 </section>;
}
