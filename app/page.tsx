import './patch9-shared.css';
import './patch10-aesthetic.css';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Ruler, Sparkles, Paintbrush, Truck, LockKeyhole, MoveUpRight } from 'lucide-react';
import { GarmentPreview } from '@/components/GarmentPreview';
import { Patch9HeroStage } from '@/components/Patch9HeroStage';
import { Patch9Motion } from '@/components/Patch9Motion';
import { Patch9Collection } from '@/components/Patch9Collection';
import styles from './page.module.css';

const steps=[
  {no:'01',label:'Find your piece',description:'Browse Sando, T-Shirt, Shorts, or a team set.'},
  {no:'02',label:'Make it personal',description:'Play with colors, logos, jersey names and numbers.'},
  {no:'03',label:'Place your order',description:'Choose an available checkout option and confirm.'},
  {no:'04',label:'Follow the journey',description:'Track production and delivery from your account.'},
];
export default function Home() {return <>
  <div className={`${styles.home} ml9-visual-root`}><Patch9Motion/>
    <div className={styles.ticker}><span>ML SPORTSWEAR / PHILIPPINES</span><span>BUILT FOR YOUR TEAM <Sparkles size={13}/></span><span>THE CUSTOM COLLECTION / 2026</span></div>
    <section className={styles.hero}>
      <div className={styles.heroText}><span className={styles.eyebrow}><span className={styles.pulse}/> THE ART OF CUSTOM SPORT</span>
        <h1>Wear your<br/><em>identity.</em></h1><p>Not just another uniform. A canvas for your team, your colors, and every detail that makes you different.</p>
        <div className={styles.heroActions}><Link href="/collection" className={styles.primary}>Explore the collection <ArrowUpRight size={18}/></Link><Link href="/customize" className={styles.secondary}>Start designing <ArrowRight size={18}/></Link></div>
        <div className={styles.heroBottom}><span>01 / THE ML COLLECTION</span><span>SCROLL TO DISCOVER ↓</span></div>
      </div>
      <div className={styles.heroDisplay}><Patch9HeroStage/></div>
    </section>
    <section className={styles.marquee} aria-label="Custom garment highlights"><div>{Array.from({length:2}).map((_,i)=><span key={i} className={styles.marqueeSet}><span>CREATE</span><i>✳</i><span>PERSONALIZE</span><i>✳</i><span>PLAY</span><i>✳</i><span>REPEAT</span><i>✳</i></span>)}</div></section>
    <Patch9Collection />
    <section className={styles.editorial} data-ml9-reveal><div className={styles.editorialCopy}><span className={styles.eyebrow}>BEHIND THE DESIGN / 02</span><h2>Not off<br/>the <i>rack.</i></h2><p>Choose your own colorway. Upload the logo. Put your name on it. We give you the tools to design something nobody else has.</p><Link href="/customize" className={styles.primary}>Enter the design studio <MoveUpRight size={18}/></Link></div><div className={styles.editorialArt}><div className={styles.artTop}><span>CUSTOM / 01</span><span>FRONT / BACK</span></div><div className={styles.artGrid}><div className={styles.artShirt}><GarmentPreview garment="sando" color="#6650b5" accentColor="#eee7ff" printColor="#fff" playerName="VILLAR" playerNumber="24" teamName="ML TEAM" view="front" mini /></div><div className={styles.artShirt}><GarmentPreview garment="sando" color="#6650b5" accentColor="#eee7ff" printColor="#fff" playerName="VILLAR" playerNumber="24" teamName="ML TEAM" view="back" mini /></div></div><div className={styles.artBottom}><Paintbrush size={16}/> THE DESIGN IS ALL YOURS.</div></div></section>
    <section className={styles.story} id="how-it-works" data-ml9-reveal><div className={styles.storyTitle}><span className={styles.eyebrow}>THE PROCESS / 03</span><h2>From the first sketch<br/>to <i>game day.</i></h2><p>Easy to design. Simple to order. All your updates in one place.</p></div><div className={styles.stepGrid}>{steps.map(s=><div key={s.no} className={styles.step}><span>{s.no}</span><h3>{s.label}</h3><p>{s.description}</p></div>)}</div></section>
    <section className={styles.links} data-ml9-reveal><Link href="/size-guide"><Ruler size={23}/><span><strong>Not sure about size?</strong><small>Learn how to measure before ordering</small></span><ArrowUpRight size={19}/></Link><Link href="/account"><LockKeyhole size={23}/><span><strong>Your account. Your orders.</strong><small>Sign in for order updates in one place</small></span><ArrowUpRight size={19}/></Link><Link href="/track"><Truck size={23}/><span><strong>Already ordered?</strong><small>Track production and delivery progress</small></span><ArrowUpRight size={19}/></Link></section>
    <section className={styles.last} data-ml9-reveal><span>READY TO STAND OUT?</span><h2>Make your<br/><i>mark.</i></h2><p>Your next design starts here.</p><Link href="/customize" className={styles.primary}>Create your look <ArrowUpRight size={19}/></Link></section>
  </div>
</>}
