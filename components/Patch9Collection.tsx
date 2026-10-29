'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Ruler, RotateCw, Shirt, Sparkles } from 'lucide-react';
import { GarmentPreview } from '@/components/GarmentPreview';
import { GARMENTS, PALETTE, SIZES, money, type GarmentId, type Size } from '@/lib/catalog';
import type { LivePrices } from '@/lib/garment-prices';
import styles from './Patch9Collection.module.css';

type Product = { id: GarmentId; eyebrow: string; tagline: string; description: string; color: string };
const products: Product[] = [
  { id: 'sando', eyebrow: '01 / COURT EDITION', tagline: 'Built for your next game.', description: 'Sleeveless sportswear that makes your team identity stand out on the court.', color: '#6446bc' },
  { id: 'tshirt', eyebrow: '02 / THE EVERYDAY EDIT', tagline: 'Wear your idea.', description: 'A custom everyday tee for clubs, crews, events, and game days.', color: '#252b47' },
  { id: 'shorts', eyebrow: '03 / MATCH DAY', tagline: 'Complete your look.', description: 'Bring your shorts into the same color story as the rest of your team.', color: '#9b314f' },
  { id: 'set', eyebrow: '04 / TEAM UNIFORM', tagline: 'Designed as one.', description: 'A coordinated sando-and-shorts set for a complete team look.', color: '#276b71' },
];
const swatches = ['#6446bc','#252b47','#9b314f','#276b71','#f3efe8','#b4a7d8'];

export function Patch9Collection({ standalone = false }: { standalone?: boolean }) {
  const [selected, setSelected] = useState<GarmentId>('tshirt');
  const [color, setColor] = useState('#252b47');
  const [size, setSize] = useState<Size>('M');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [guide, setGuide] = useState(false);
  const [prices, setPrices] = useState<LivePrices | null>(null);
  const [priceUnavailable, setPriceUnavailable] = useState(false);
  const current = products.find(x => x.id === selected)!;
  const item = GARMENTS.find(x => x.id === selected)!;
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('garment');
    const found = products.find(x => x.id === next);
    if(found){setSelected(found.id);setColor(found.color);}
    let live = true;
    fetch('/api/prices', { cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error('Prices not yet available'); return r.json(); })
      .then(j => { if(live) setPrices(j.prices as LivePrices); })
      .catch(() => { if(live) setPriceUnavailable(true); });
    return () => { live=false; };
  }, []);
  const selectProduct = (id: GarmentId) => {
    const p = products.find(x => x.id === id)!;
    setSelected(id); setColor(p.color); setSide('front');
  };
  const idx = products.findIndex(x=>x.id===selected);
  const move = (offset:number) => selectProduct(products[(idx+products.length+offset)%products.length].id);
  const params = new URLSearchParams({garment:selected,color,size});
  const customizeHref = `/customize?${params.toString()}`;
  return <section className={styles.section} id="the-collection" aria-label="Explore custom sportswear collection">
    <div className={styles.heading}>
      <div><span className={styles.kicker}>THE ML EDIT / VOL. 01</span><h2>Discover <i>the collection.</i></h2><p>Choose your silhouette. Try a color. Then make it yours in the design studio.</p></div>
      <div className={styles.pager}><span>0{idx+1} <em>/ 04</em></span><button type="button" aria-label="Previous garment" onClick={()=>move(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label="Next garment" onClick={()=>move(1)}><ChevronRight size={18}/></button></div>
    </div>
    <div className={styles.tiles} data-ml9-reveal role="group" aria-label="Choose a garment">
      {products.map((p,i)=><button key={p.id} type="button" onClick={()=>selectProduct(p.id)} className={`${styles.tile} ${p.id===selected?styles.selected:''}`} aria-pressed={p.id===selected}>
        <span className={styles.tileIndex}>0{i+1} / 04</span><span className={styles.tileArt} style={{backgroundColor:p.id==='tshirt'?'#d6d7e3':p.id==='sando'?'#d7c7ed':p.id==='shorts'?'#f0d4db':'#c9dfe1'}}><GarmentPreview garment={p.id} color={p.color} accentColor="#f6f3f1" printColor="#f6f3f1" playerName="YOUR NAME" playerNumber="24" teamName="ML TEAM" view="front" mini/></span>
        <span className={styles.tileFoot}><strong>{GARMENTS.find(g=>g.id===p.id)!.label}</strong><ArrowUpRight size={15}/></span>
      </button>)}
    </div>
    <div className={styles.detail} data-ml9-reveal>
      <div className={styles.previewArea}>
        <div className={styles.gridlines}/><span className={styles.artCorner}>ML / DESIGN PREVIEW</span><span className={styles.artSerial}>CUSTOM / 0{idx+1}</span>
        <div key={`${selected}-${side}-${color}`} className={styles.previewGarment}><GarmentPreview garment={selected} color={color} accentColor="#f5f1ec" printColor={color==='#f3efe8'?'#252b47':'#f9f7f2'} playerName="PLAYER" playerNumber="24" teamName="ML TEAM" view={side} mini /></div>
        <div className={styles.viewSwitch} role="group" aria-label="Preview side"><button type="button" onClick={()=>setSide('front')} className={side==='front'?styles.on:''} aria-pressed={side==='front'}>Front</button><button type="button" onClick={()=>setSide('back')} className={side==='back'?styles.on:''} aria-pressed={side==='back'}>Back</button></div>
      </div>
      <div className={styles.detailInfo}>
        <span className={styles.kicker}>{current.eyebrow}</span>
        <h3>{item.label}<span className={styles.dot}>.</span></h3><p className={styles.tagline}>{current.tagline}</p><p className={styles.description}>{current.description}</p>
        <div className={styles.price}>{prices?.[selected]?.[size] ? <><strong>{money(prices[selected][size])}</strong><small>{size} size · live shop price</small></> : <><strong>Price on request</strong><small>{priceUnavailable?'Official prices are being prepared.':'Checking official prices…'}</small></>}</div>
        <div className={styles.field}><span className={styles.fieldLabel}>01 / Choose your color</span><div className={styles.colors}>{swatches.map(c=><button key={c} type="button" onClick={()=>setColor(c)} className={color===c?styles.activeColor:''} style={{backgroundColor:c}} aria-label={`Choose ${c} color`} aria-pressed={color===c}>{color===c?<Check size={15} color={c==='#f3efe8'?'#1c1c2c':'white'}/>:null}</button>)}</div></div>
        <div className={styles.field}><div className={styles.sizeHeader}><span className={styles.fieldLabel}>02 / Pick a size</span><button type="button" onClick={()=>setGuide(true)} className={styles.guideLink}><Ruler size={15}/> Size guide</button></div><div className={styles.sizes}>{SIZES.map(s=><button key={s} type="button" onClick={()=>setSize(s)} className={size===s?styles.activeSize:''} aria-pressed={size===s}>{s}</button>)}</div></div>
        <Link href={customizeHref} className={styles.designCta}>Customize this piece <ArrowUpRight size={20}/></Link>
        <p className={styles.helper}><Sparkles size={14}/> Next, upload your design, add names and numbers, and choose quantities. Size selections can be changed in the studio.</p>
      </div>
    </div>
    {standalone ? <div className={styles.bottom}><Link href="/size-guide" className={styles.bottomLink}>How to find your fit <ArrowRight size={16}/></Link><Link href="/track" className={styles.bottomLink}>Track an existing order <ArrowRight size={16}/></Link></div> : null}
    {guide ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setGuide(false);}}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="size-guide-title"><div className={styles.modalHead}><h3 id="size-guide-title">Find your fit</h3><button type="button" aria-label="Close size guide" onClick={()=>setGuide(false)}>×</button></div><p>ML Sportswear offers XS to 2XL. Exact garment measurements depend on the approved pattern, so confirm the official chart with the shop before ordering.</p><div className={styles.measure}><Ruler size={21}/><div><strong>Measure before ordering</strong><span>Compare chest, garment length, waist, and inseam measurements with a piece of clothing that fits you well.</span></div></div><Link className={styles.modalLink} href="/size-guide">Read the full measuring guide <ArrowRight size={16}/></Link></div></div> : null}
  </section>;
}
