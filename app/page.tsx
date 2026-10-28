import Link from 'next/link';
import { ArrowUpRight, MoveRight, Sparkles, Shirt, Palette, FileUp, ClipboardCheck } from 'lucide-react';
import { GarmentPreview } from '@/components/GarmentPreview';

const categories = [
  { number: '01', title: 'Sando', caption: 'For every game day.', kind: 'sando' as const, color: '#3157c9' },
  { number: '02', title: 'T-Shirts', caption: 'Make it yours, every day.', kind: 'tshirt' as const, color: '#bf3345' },
  { number: '03', title: 'Shorts', caption: 'Move without limits.', kind: 'shorts' as const, color: '#246353' },
  { number: '04', title: 'Jersey Sets', caption: 'One team, one look.', kind: 'set' as const, color: '#171a28' },
];

export default function Home() {
  return <>
    <section className="home-hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> CUSTOM SPORTSWEAR, REIMAGINED</div>
        <h1>Wear your<br/><em>own</em> identity<span className="accent-period">.</span></h1>
        <p>Your team, your colors, your rules. Create personalized sportswear in a few simple steps, then send your design for a quotation.</p>
        <div className="hero-actions"><Link href="/customize" className="button button-dark">Start your design <ArrowUpRight size={18}/></Link><a href="#collection" className="text-link">Explore garments <MoveRight size={18}/></a></div>
        <div className="hero-mini"><div className="hero-avatar">ML</div><span>DESIGNED BY YOU <b>·</b> MADE BY ML SPORTSWEAR</span></div>
      </div>
      <div className="hero-art"><div className="hero-art-top"><span>THE CUSTOM EDITION</span><span>2026 / ML</span></div><div className="hero-art-inner"><div className="hero-orbit hero-orbit-one"/><div className="hero-orbit hero-orbit-two"/><GarmentPreview garment="sando" color="#3157c9" accentColor="#f3f1e9" printColor="#f3f1e9" playerName="VALERA" playerNumber="07" teamName="ML TEAM" view="front" mini/></div><div className="hero-art-bottom"><span>001 / BUILT DIFFERENT</span><span className="hero-star"><Sparkles size={24}/></span></div></div>
    </section>
    <section className="benefits-row" aria-label="Benefits"><div><span>01 /</span> Your design, your story</div><div><span>02 /</span> Instant garment preview</div><div><span>03 /</span> Easy quote requests</div></section>
    <section id="collection" className="collection-section"><div className="section-kicker">WHAT WILL YOU MAKE?</div><div className="section-heading"><h2>Start with a blank canvas.</h2><p>Pick the piece. We’ll help you make it yours.</p></div><div className="collection-grid">
      {categories.map((c) => <Link href={`/customize?garment=${c.kind}`} className="category-card" key={c.number}><div className="category-card-top"><span>{c.number} / COLLECTION</span><ArrowUpRight size={19}/></div><div className="category-preview"><GarmentPreview garment={c.kind} color={c.color} accentColor="#f3f1e9" printColor="#f3f1e9" playerName="TEAM" playerNumber="10" teamName="ML TEAM" view="front" mini/></div><div className="category-bottom"><div><h3>{c.title}</h3><p>{c.caption}</p></div><span className="category-arrow">↗</span></div></Link>)}
    </div></section>
    <section id="how-it-works" className="how-section how-seven"><div><div className="section-kicker">FROM DESIGN TO DELIVERY</div><h2>Seven simple<br/>steps.</h2><p>Personalize first. ML Sportswear confirms the quote before you approve and pay. Follow the order from production through delivery.</p><Link href="/customize" className="button button-light">Start designing <ArrowUpRight size={18}/></Link><Link href="/track" className="how-track-link">Already ordered? Track it ↗</Link></div><div className="how-steps">
      {[
        ['01','Design & request','Choose colors, upload designs, then submit a request.'],
        ['02','Staff reviews','The business confirms the final quotation.'],
        ['03','Approve quotation','Review and accept the final price and terms.'],
        ['04','Choose payment','Select GCash or bank transfer, deposit or full.'],
        ['05','Submit proof','Transfer funds manually and upload payment proof.'],
        ['06','Staff verifies','Payment is checked before production begins.'],
        ['07','Track progress','Follow production, pickup or delivery updates.'],
      ].map(([n,title,copy])=><div key={n}><span className="how-icon"><ClipboardCheck size={23}/></span><span>{n}</span><h3>{title}</h3><p>{copy}</p></div>)}
    </div></section>
        <section className="bottom-banner"><div><div className="section-kicker">READY TO CREATE?</div><h2>Your team deserves<br/>a look of its own.</h2></div><Link href="/customize" className="button button-dark">Customize your sportswear <ArrowUpRight size={18}/></Link></section>
  </>;
}
