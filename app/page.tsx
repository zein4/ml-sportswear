import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Sparkles, Palette, UploadCloud, PackageCheck, ShieldCheck, Shirt, Truck, Wallet, Check, Star, MoveUpRight, Layers3, Heart, CircleUserRound } from 'lucide-react';
import { GarmentPreview } from '@/components/GarmentPreview';

const categories=[
  {num:'01',title:'Game-day Sando',short:'Built for the court.',kind:'sando' as const,color:'#6742e5',tag:'COURT ESSENTIAL',bg:'purple'},
  {num:'02',title:'Signature Tee',short:'Your everyday statement.',kind:'tshirt' as const,color:'#283e86',tag:'EVERYDAY FAVORITE',bg:'blue'},
  {num:'03',title:'Match Shorts',short:'The finishing touch.',kind:'shorts' as const,color:'#ca435f',tag:'COMPLETE THE LOOK',bg:'rose'},
  {num:'04',title:'Team Jersey Set',short:'Everything, in sync.',kind:'set' as const,color:'#226d6b',tag:'FULL TEAM LOOK',bg:'mint'},
];
const steps=[
  {icon:<Shirt size={23}/>,n:'01',title:'Choose your style',copy:'Select Sando, Tee, Shorts or a complete set.'},
  {icon:<Palette size={23}/>,n:'02',title:'Make it yours',copy:'Pick colors, add names, numbers and upload logos.'},
  {icon:<Wallet size={23}/>,n:'03',title:'Checkout your way',copy:'Select the available payment option at checkout.'},
  {icon:<Truck size={23}/>,n:'04',title:'Follow your order',copy:'Check production and delivery progress in one place.'},
];
export default function Home(){return <>
  <div className="v7-shop-wrap">
    <div className="v7-top-ticker"><span><Sparkles size={13}/> YOUR COLORS. YOUR TEAM. YOUR IDENTITY.</span><span>DESIGNED BY YOU, MADE FOR YOUR GAME <ArrowUpRight size={13}/></span></div>
    <section className="v7-shop-hero"><div className="v7-hero-content">
      <span className="v7-eyebrow"><span className="v7-eyebrow-pip"/> THE CUSTOM SPORTSWEAR STUDIO</span>
      <h1>Different teams.<br/><em>One-of-a-kind</em><br/>looks.</h1>
      <p>Your team deserves more than a basic uniform. Explore our pieces, create your colors and turn your idea into something worth wearing.</p>
      <div className="v7-hero-buttons"><Link href="/customize" className="v7-primary-cta">Customize now <ArrowUpRight size={18}/></Link><a href="#the-collection" className="v7-secondary-cta">Shop the collection <ArrowRight size={18}/></a></div>
      <div className="v7-hero-proof"><span className="v7-proof-stars"><Star size={15}/><Star size={15}/><Star size={15}/></span><div><strong>Made for personal expression</strong><small>Individual pieces or your whole squad</small></div></div>
    </div><div className="v7-hero-showcase"><div className="v7-showcase-top"><span>ML / CUSTOM DIVISION</span><span>01—04</span></div>
      <div className="v7-showcase-halo"><div className="v7-halo-a"/><div className="v7-halo-b"/><GarmentPreview garment="set" color="#6541dc" accentColor="#efe9ff" printColor="#efe9ff" playerName="SPORTSWEAR" playerNumber="08" teamName="ML TEAM" view="front" mini/></div>
      <span className="v7-float-tag v7-float-tag-left"><Palette size={14}/> YOUR COLORWAY</span>
      <span className="v7-float-tag v7-float-tag-right"><Check size={14}/> PERSONALIZED</span>
      <div className="v7-showcase-foot"><span>THE UNIFORM IS YOURS TO DEFINE.</span><span>↗</span></div>
    </div></section>
    <div className="v7-shop-strip"><span><Layers3 size={17}/> 4 CUSTOM GARMENT TYPES</span><span><Sparkles size={17}/> PREVIEW YOUR DESIGN</span><span><ShieldCheck size={17}/> PRIVATE CUSTOMER ACCOUNTS</span><span><PackageCheck size={17}/> ORDER TRACKING</span></div>
    <section className="v7-shop-collection" id="the-collection"><div className="v7-section-top"><div><span className="v7-small-label">01 / THE COLLECTION</span><h2>Find your <em>fit.</em></h2><p>Your idea starts with the perfect piece.</p></div><Link href="/customize" className="v7-subtle-link">Explore all options <ArrowUpRight size={17}/></Link></div>
      <div className="v7-category-grid">{categories.map(c=><Link key={c.num} href={`/customize?garment=${c.kind}`} className={`v7-category-card v7-category-${c.bg}`}>
        <div className="v7-category-top"><span>{c.tag}</span><span>{c.num} / 04</span></div>
        <div className="v7-category-art"><div className="v7-category-ring"/><GarmentPreview garment={c.kind} color={c.color} accentColor="#f5f1ff" printColor="#f9f6ff" playerName="YOUR NAME" playerNumber="10" teamName="ML SPORTS" view="front" mini/></div>
        <div className="v7-category-info"><div><h3>{c.title}</h3><p>{c.short}</p></div><span className="v7-category-go"><ArrowUpRight size={20}/></span></div>
      </Link>)}</div></section>
    <section className="v7-creative-band"><div className="v7-creative-icons"><span><UploadCloud size={25}/></span><span><Palette size={25}/></span><span><Heart size={25}/></span></div><div><span className="v7-small-label">MORE THAN BASIC</span><h2>Every detail tells<br/>your story.</h2><p>Make the colors yours. Upload your logo. Add your team name, player number, and personal touches. See it all on the garment preview before you order.</p><Link href="/customize" className="v7-primary-cta">Open the design studio <ArrowUpRight size={18}/></Link></div><div className="v7-creative-tiles"><span className="v7-colortile v7-tile-one">#6541DC</span><span className="v7-colortile v7-tile-two">#D14565</span><span className="v7-colortile v7-tile-three">#235F68</span><span className="v7-colortile v7-tile-four">#E7C56E</span><div className="v7-creative-stamp">YOUR DESIGN<br/><strong>YOUR RULES.</strong></div></div></section>
    <section className="v7-how" id="how-it-works"><div className="v7-section-top"><div><span className="v7-small-label">02 / HOW IT WORKS</span><h2>From idea to <em>game day.</em></h2><p>One easy journey, from picking your piece to tracking your order.</p></div></div><div className="v7-steps-grid">{steps.map(step=><div className="v7-step-card" key={step.n}><div className="v7-step-top"><span className="v7-step-icon">{step.icon}</span><small>{step.n} / 04</small></div><h3>{step.title}</h3><p>{step.copy}</p></div>)}</div></section>
    <section className="v7-member-banner"><div className="v7-member-symbol"><CircleUserRound size={61} strokeWidth={1}/><span>ML MEMBER</span></div><div><span className="v7-small-label">YOUR OWN SPACE</span><h2>Good things happen<br/>when you join the team.</h2><p>Create an account to see your orders together, check delivery updates and get back to designing. Browsing stays free, no account required.</p></div><Link href="/signup" className="v7-member-button">Create your account <ArrowUpRight size={18}/></Link></section>
    <section className="v7-closing"><div><span className="v7-small-label">THE NEXT LOOK IS YOURS</span><h2>Ready to make<br/>something <em>original?</em></h2></div><Link href="/customize" className="v7-primary-cta">Let's create it <MoveUpRight size={19}/></Link></section>
  </div>
</>}
