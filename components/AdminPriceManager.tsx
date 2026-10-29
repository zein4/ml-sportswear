'use client';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, CircleAlert, RefreshCcw, Save, Tags } from 'lucide-react';
import { GARMENTS, type GarmentId, money } from '@/lib/catalog';
import type { LivePrices } from '@/lib/garment-prices';
import styles from './AdminPriceManager.module.css';

type PartialPrices=Partial<LivePrices>;
export function AdminPriceManager({token}:{token:string}) {
  const [prices,setPrices]=useState<PartialPrices>({});
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const reload=useCallback(async()=>{
    if(!token)return;
    setLoading(true);setError('');
    try {
      const res=await fetch('/api/admin/prices',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw Error(data.error||'Unable to load prices.');
      const current:PartialPrices=data.prices||{};
      setPrices(current);
      setDrafts(Object.fromEntries(GARMENTS.map(g=>[g.id,current[g.id]===undefined?'':String(current[g.id])] )));
    }catch(e){setError(e instanceof Error?e.message:'Cannot load pricing.');}
    finally{setLoading(false);}
  },[token]);
  useEffect(()=>{void reload();},[reload]);
  async function save(id:GarmentId){
    const input=drafts[id]?.trim()||'';
    const price=Number(input);
    if(!input || !Number.isFinite(price) || price<=0 || price>1000000 || !/^\d+(?:\.\d{1,2})?$/.test(input)) {setError('Enter a valid amount above ₱0 with no more than 2 decimal places.');return;}
    setError('');setSuccess('');setSaving(id);
    try {
      const res=await fetch('/api/admin/prices',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({garmentId:id,unitPrice:price})});
      const data=await res.json();
      if(!res.ok)throw Error(data.error||'Could not save price.');
      setPrices(prev=>({...prev,[id]:data.unitPrice}));
      setDrafts(prev=>({...prev,[id]:String(data.unitPrice)}));
      setSuccess(`${GARMENTS.find(g=>g.id===id)?.label} price updated. Customer checkout will use ${money(data.unitPrice)} per piece.`);
    }catch(e){setError(e instanceof Error?e.message:'Unable to save.');}
    finally{setSaving(null);}
  }
  const configured=GARMENTS.filter(g=>prices[g.id]!==undefined).length;
  return <section className={styles.panel} aria-label="Manage garment prices">
    <div className={styles.header}><div><div className={styles.kicker}><Tags size={15}/> CATALOG CONTROL</div><h2>Manage Prices</h2><p>Update the price per piece here. No VS Code or redeployment needed.</p></div><button className={styles.refresh} type="button" disabled={loading||Boolean(saving)} onClick={()=>void reload()}><RefreshCcw size={15}/> Refresh</button></div>
    <div className={styles.summary}><BadgeCheck size={16}/>{configured===GARMENTS.length?'All 4 items have prices. New customer orders use these live rates.':`${configured} of ${GARMENTS.length} prices configured. Finish all four to open checkout.`}</div>
    <div className={styles.rows}>{GARMENTS.map(g=><div className={styles.item} key={g.id}>
      <div className={styles.name}><span className={styles.id}>{g.code}</span><div><strong>{g.label}</strong><small>{g.descriptor}</small></div></div>
      <div className={styles.old}><small>Current price</small><strong>{prices[g.id]===undefined?'Not set':money(prices[g.id]!)}</strong></div>
      <label className={styles.edit}><span>New price (PHP)</span><div><b>₱</b><input aria-label={`${g.label} new price`} type="number" min="0.01" max="1000000" step="0.01" placeholder="Enter price" value={drafts[g.id]??''} disabled={loading||Boolean(saving)} onChange={e=>setDrafts(p=>({...p,[g.id]:e.target.value}))}/></div></label>
      <button type="button" className={styles.save} disabled={loading||Boolean(saving)||!drafts[g.id]?.trim()} onClick={()=>void save(g.id)}>{saving===g.id?'Saving…':<><Save size={15}/> Save</>}</button>
    </div>)}</div>
    {error&&<div className={styles.error} role="alert"><CircleAlert size={16}/>{error}</div>}
    {success&&<div className={styles.success} role="status"><Check size={16}/>{success}</div>}
    <p className={styles.hint}>Changes apply to <b>new</b> orders. Orders already placed keep their original total. Prices exclude delivery unless a delivery fee is separately configured. Do not edit a price while a customer is paying; an out-of-date checkout will ask the customer to refresh.</p>
  </section>;
}
