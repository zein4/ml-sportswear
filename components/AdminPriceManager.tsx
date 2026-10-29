'use client';
import {useCallback,useEffect,useState} from 'react';
import {AlertTriangle,CheckCircle2,RefreshCcw,Save,Tags} from 'lucide-react';
import {GARMENTS,SIZES,type GarmentId,type Size,money} from '@/lib/catalog';
import type {PartialLivePrices} from '@/lib/garment-prices';
import styles from './AdminPriceManager.module.css';
const blank=()=>Object.fromEntries(SIZES.map(s=>[s,''])) as Record<Size,string>;
type Drafts=Record<GarmentId,Record<Size,string>>;
const starting=():Drafts=>Object.fromEntries(GARMENTS.map(g=>[g.id,blank()])) as Drafts;
export function AdminPriceManager({token}:{token:string}){
  const [prices,setPrices]=useState<PartialLivePrices>({});
  const [drafts,setDrafts]=useState<Drafts>(starting);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<GarmentId|null>(null);
  const [error,setError]=useState('');const [success,setSuccess]=useState('');
  const reload=useCallback(async()=>{
    if(!token)return;
    setLoading(true);setError('');
    try{
      const res=await fetch('/api/admin/prices',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      const json=await res.json();if(!res.ok)throw Error(json.error||'Unable to load prices.');
      const current=json.prices as PartialLivePrices;
      setPrices(current);
      setDrafts(Object.fromEntries(GARMENTS.map(g=>[g.id,Object.fromEntries(SIZES.map(size=>[size,current[g.id]?.[size]===undefined?'':String(current[g.id]?.[size])]))])) as Drafts);
    }catch(e){setError(e instanceof Error?e.message:'Could not load prices.');}
    finally{setLoading(false);}
  },[token]);
  useEffect(()=>{void reload();},[reload]);
  function edit(garment:GarmentId,size:Size,value:string){setDrafts(p=>({...p,[garment]:{...p[garment],[size]:value}}));setSuccess('');}
  async function save(garment:GarmentId){
    const fields=drafts[garment];
    if(!SIZES.every(size=>/^\d+(?:\.\d{1,2})?$/.test(fields[size]?.trim()||'')&&Number(fields[size])>0&&Number(fields[size])<=1000000)){
      setError('Enter a valid price for all six sizes, above ₱0 and up to two decimals.');return;
    }
    setError('');setSuccess('');setSaving(garment);
    try{
      const sizePrices=Object.fromEntries(SIZES.map(s=>[s,Number(fields[s])]));
      const res=await fetch('/api/admin/prices',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({garmentId:garment,sizePrices})});
      const json=await res.json();if(!res.ok)throw Error(json.error||'Save failed.');
      setPrices(prev=>({...prev,[garment]:json.sizePrices}));
      setSuccess(`${GARMENTS.find(g=>g.id===garment)?.label} size prices saved. New orders now use these amounts.`);
    }catch(e){setError(e instanceof Error?e.message:'Could not save prices.');}
    finally{setSaving(null);}
  }
  const count=GARMENTS.reduce((n,g)=>n+SIZES.filter(size=>prices[g.id]?.[size]!==undefined).length,0);
  return <section className={styles.panel} aria-label="Manage prices by garment size">
    <div className={styles.header}><div><div className={styles.kicker}><Tags size={16}/> LIVE CATALOG / ADMIN</div><h2>Prices by size<span>.</span></h2><p>Change XS to 2XL independently. Your shop updates immediately without editing VS Code.</p></div><button className={styles.refresh} type="button" disabled={loading||!!saving} onClick={()=>void reload()}><RefreshCcw size={16}/> Refresh</button></div>
    <div className={styles.summary}><CheckCircle2 size={17}/> {count} / {GARMENTS.length*SIZES.length} size prices configured. {count===24?'All garment sizes are ready for new orders.':'Set missing values before enabling checkout.'}</div>
    <div className={styles.rows}>{GARMENTS.map(g=><div className={styles.item} key={g.id}>
      <div className={styles.itemHeading}><div className={styles.id}>ML / {g.code}</div><div><h3>{g.label}</h3><p>{g.descriptor} · Price per piece</p></div><span className={styles.ready}>{SIZES.filter(s=>prices[g.id]?.[s]!==undefined).length}/6 SET</span></div>
      <div className={styles.sizeGrid}>{SIZES.map(size=><label className={styles.edit} key={size}><span>{size}</span><div><b>₱</b><input type="number" step="0.01" min="0.01" max="1000000" inputMode="decimal" placeholder="0.00" aria-label={`${g.label} ${size} price`} value={drafts[g.id][size]} disabled={loading||!!saving} onChange={e=>edit(g.id,size,e.target.value)}/></div><small>{prices[g.id]?.[size]===undefined?'Not set':`Current ${money(prices[g.id]![size]!)}`}</small></label>)}</div>
      <div className={styles.itemBottom}><span>Changes affect new checkouts. Previous orders keep their original total.</span><button type="button" className={styles.save} disabled={loading||!!saving} onClick={()=>void save(g.id)}>{saving===g.id?'Saving…':<><Save size={15}/> Save {g.label} prices</>}</button></div>
    </div>)}</div>
    {error&&<div className={styles.error} role="alert"><AlertTriangle size={17}/>{error}</div>}
    {success&&<div className={styles.success} role="status"><CheckCircle2 size={17}/>{success}</div>}
    <p className={styles.hint}>Size pricing covers garment units only. Delivery fees and special printing charges are not included unless separately configured. Buyers will be asked to refresh if a price changes during checkout.</p>
  </section>;
}
