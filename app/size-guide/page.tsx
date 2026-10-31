import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Ruler, ShieldCheck } from 'lucide-react';
import { GARMENTS, SIZES } from '@/lib/catalog';
import { loadStorefront } from '@/lib/storefront';
import { MEASURES, MEASURE_LABELS, type SizeChart } from '@/lib/storefront-shared';
export const metadata:Metadata={title:'Official Size Guide | ML Sportswear Philippines'};
export const dynamic='force-dynamic';
export default async function SizeGuidePage(){
 const chart:SizeChart=await loadStorefront().then(s=>s.sizeChart).catch(()=>({}));
 return <main className="ml12-guide-page"><Link href="/customize" className="ml12-guide-back"><ArrowLeft size={16}/> Back to customizer</Link><div className="ml12-guide-head"><span className="section-kicker">ML SPORTSWEAR / MEASUREMENT GUIDE</span><h1>Find your <em>perfect fit.</em></h1><p>Compare your measurements with the shop's official garment chart. All measurements below are in centimeters (cm).</p></div>
 {GARMENTS.map(g=>{const entries=chart[g.id]||{};const any=SIZES.some(size=>MEASURES.some(k=>entries[size]?.[k]));return <section className="ml12-guide-section" key={g.id}><div><h2>{g.label}</h2><p>These are garment measurements, not general body measurements.</p></div>{any?<div className="ml12-table-scroll"><table className="ml12-size-table"><thead><tr><th>Size</th>{MEASURES.map(k=><th key={k}>{MEASURE_LABELS[k]} (cm)</th>)}</tr></thead><tbody>{SIZES.map(size=><tr key={size}><th>{size}</th>{MEASURES.map(k=><td key={k}>{entries[size]?.[k]??'—'}</td>)}</tr>)}</tbody></table></div>:<p className="ml12-guide-pending">The shop has not published the official measurements for this garment. Please contact ML Sportswear before choosing a size.</p>}</section>;})}
 <p className="ml12-guide-note"><ShieldCheck size={17}/> Size and fit may vary by production pattern. Confirm special sizing with the shop before placing a large group order.</p><Link className="button button-dark" href="/customize"><Ruler size={18}/> Choose your size</Link></main>;
}
