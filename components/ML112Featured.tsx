'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, X, Eye } from 'lucide-react';
import styles from './ML112Featured.module.css';

type Garment = 'sando' | 'tshirt' | 'shorts' | 'set';
type Featured = { id: string; title: string; description: string; image: string; category: string; garment: Garment | null; };
const featured: Featured[] = [
  { id: "swiftbac", title: "Purple Studio Basketball Jersey", description: "Purple jersey presented in studio lighting", image: "/ml113/purple-lit-jersey.webp", category: "Basketball jerseys", garment: "sando" },
  { id: "dagesham", title: "Pink Team Basketball Set", description: "Pink and white basketball uniform sample", image: "/ml113/kci-pink.webp", category: "Basketball sets", garment: "set" },
  { id: "dongbang", title: "Sky Blue Basketball Jersey", description: "Blue jersey on a display hanger", image: "/ml113/blue-studio-jersey.webp", category: "Basketball jerseys", garment: "sando" },
  { id: "court-green", title: "Green & White Court Set", description: "Green and white jersey and shorts sample", image: "/ml113/green-celtics-set.webp", category: "Basketball sets", garment: "set" },
  { id: "blue-jacket", title: "Blue & White Team Jacket", description: "Blue and white full-sublimation jacket mockup", image: "/ml113/blue-white-zip-jacket.webp", category: "Jackets", garment: null },
];
type Prices = Partial<Record<Garment, Partial<Record<'XS'|'S'|'M'|'L'|'XL'|'2XL', number>>>>;
const fmt = (v: number) => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(v);

export function ML112Featured() {
  const [selected,setSelected] = useState<number | null>(null);
  const [saved,setSaved] = useState<string[]>([]);
  const [prices,setPrices] = useState<Prices>({});
  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem('ml112-favorites') || '[]'); if(Array.isArray(stored)) setSaved(stored.filter(x=>typeof x==='string')); } catch {}
    const controller=new AbortController();
    fetch('/api/prices',{signal:controller.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.prices) setPrices(data.prices);}).catch(()=>{});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(selected===null)return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.key==='Escape')setSelected(null);
      if(e.key==='ArrowLeft')setSelected(i=>i===null?null:(i+featured.length-1)%featured.length);
      if(e.key==='ArrowRight')setSelected(i=>i===null?null:(i+1)%featured.length);
    };
    window.addEventListener('keydown',onKey);
    const prior=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{window.removeEventListener('keydown',onKey);document.body.style.overflow=prior;};
  },[selected]);
  const item=selected!==null?featured[selected]:null;
  const startingPrice=(g:Garment|null)=>{
    if(!g)return null;
    const valid=Object.values(prices[g]||{}).filter((p):p is number=>typeof p==='number'&&Number.isFinite(p)&&p>0);
    return valid.length?Math.min(...valid):null;
  };
  const toggleFavorite=(id:string)=>{
    setSaved(current=>{
      const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
      try{localStorage.setItem('ml112-favorites',JSON.stringify(next));}catch{}
      return next;
    });
  };
  const contact=(f:Featured)=>`mailto:mlgenapp@gmail.com?subject=${encodeURIComponent('ML Sportswear inquiry: '+f.title)}`;
  return <section className={styles.section} id="featured-designs" aria-label="Featured sportswear designs">
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>FEATURED COLLECTIONS</span><h2>OUR BEST DESIGNS</h2><p>Sample artwork from ML Sportswear Philippines</p></div>
      <Link href="/collection" className={styles.viewAll}>View all designs <ArrowRight size={17}/></Link>
    </div>
    <div className={styles.grid}>{featured.map((f,index)=>{
      const amount=startingPrice(f.garment);
      return <article key={f.id} className={styles.card} style={{animationDelay:`${index*55}ms`}}>
        <div className={styles.imageWrap}>
          <button type="button" className={styles.visual} aria-label={`Quick view ${f.title}`} onClick={()=>setSelected(index)}>
            <Image src={f.image} alt={`${f.title} — ML Sportswear sample artwork`} fill sizes="(max-width:600px) 45vw,(max-width:1100px) 29vw, 19vw" quality={88}/>
          </button>
          <span className={styles.sample}>SAMPLE DESIGN</span>
          <button type="button" className={`${styles.heart} ${saved.includes(f.id)?styles.on:''}`} onClick={()=>toggleFavorite(f.id)} aria-label={`${saved.includes(f.id)?'Remove':'Save'} ${f.title} ${saved.includes(f.id)?'from':'to'} saved designs`} aria-pressed={saved.includes(f.id)} title="Saved on this device only"><Heart size={19} fill={saved.includes(f.id)?'currentColor':'none'}/></button>
        </div>
        <div className={styles.body}><strong>{f.title}</strong><span className={styles.rate}>{amount!==null?`From ${fmt(amount)}`:f.garment?'See official size prices':'Ask for a quote'}</span><button type="button" className={styles.quick} onClick={()=>setSelected(index)}><Eye size={15}/> QUICK VIEW</button></div>
      </article>;
    })}</div>
    <p className={styles.caption}>Mockups for design inspiration. Prices, when available, come from the shop’s live size-price table, not the example prices in the reference image.</p>
    {item&&<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Quick view ${item.title}`}>
        <div className={styles.dialogImage}><Image src={item.image} alt={`${item.title} detailed design view`} fill sizes="(max-width:700px) 95vw, 50vw" quality={90}/><div className={styles.modalArrows}><button type="button" onClick={()=>setSelected(i=>i===null?null:(i+featured.length-1)%featured.length)} aria-label="Previous design"><ChevronLeft/></button><button type="button" onClick={()=>setSelected(i=>i===null?null:(i+1)%featured.length)} aria-label="Next design"><ChevronRight/></button></div></div>
        <div className={styles.dialogInfo}><button type="button" className={styles.close} onClick={()=>setSelected(null)} aria-label="Close"><X/></button><span className={styles.eyebrow}>ML SPORTSWEAR / DESIGN PREVIEW</span><h3>{item.title}</h3><span className={styles.infoCategory}>{item.category}</span><p>{item.description}</p><p className={styles.priceText}>{startingPrice(item.garment)!==null?`Starting at ${fmt(startingPrice(item.garment)!)}`:'Confirm price with the shop'}</p><p className={styles.notice}>This is a design presentation, not a guarantee of the final printed product. Choose sizes in the design studio to see the current pricing.</p>
        {item.garment?<Link className={styles.cta} href={`/customize?garment=${item.garment}`}>Customize this garment <ArrowRight size={17}/></Link>:<a className={styles.cta} href={contact(item)}>Ask about this style <ArrowRight size={17}/></a>}
        </div>
      </div>
    </div>}
  </section>;
}
