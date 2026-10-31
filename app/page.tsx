import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeCheck, Brush, HeartHandshake, Palette, Shirt, Truck, UsersRound, Gem, Wrench, ClipboardCheck } from 'lucide-react';
import { ML112Featured } from '@/components/ML112Featured';
import { ML112HeroArt } from '@/components/ML112HeroArt';
import styles from './ML112Home.module.css';

export const metadata: Metadata = {
  title:'ML Sportswear Philippines | Custom jerseys, sportswear and team uniforms',
  description:'Explore the ML Sportswear Philippines collection of custom sportswear designs, personalize your garment, choose sizes, and track an order.',
};
const categories=[
 {label:'Basketball sets',src:'/ml113/purple-white-set.webp',href:'/collection?category=Basketball%20sets'},
 {label:'Long sleeves',src:'/ml113/gray-long-sleeve.webp',href:'/collection?category=Long%20sleeves'},
 {label:'T-Shirts',src:'/ml113/white-legends-shirt.webp',href:'/collection?category=T-Shirts'},
 {label:'Hoodies',src:'/ml113/green-team-hoodie.webp',href:'/collection?category=Hoodies%20%26%20jackets'},
 {label:'Custom designs',src:'/ml113/blue-studio-jersey.webp',href:'/customize'},
];
export default function Home(){return <div className={styles.page}>
 <section className={styles.hero} aria-labelledby="hero-title">
   <div className={styles.heroArt}><ML112HeroArt/></div>
   <div className={styles.heroText}><p className={styles.eyebrow}>TEAMWEAR. YOUR WAY.</p>
    <h1 id="hero-title">CUSTOM SPORTSWEAR<br/><span>MADE FOR YOUR TEAM.</span></h1>
    <p className={styles.heroLead}>Premium quality. Fully customizable.<br/>Built for teams, built for enthusiasts.</p>
    <div className={styles.actions}><Link href="/collection" className={styles.primary}>SHOP COLLECTION <ArrowRight size={17}/></Link><Link href="/customize" className={styles.secondary}><Shirt size={18}/> CUSTOMIZE NOW</Link></div>
    <div className={styles.benefits}><span><Gem size={21}/> PREMIUM<br/>QUALITY</span><span><Wrench size={21}/> FULL<br/>CUSTOMIZATION</span><span><Truck size={21}/> DELIVERY<br/>OPTIONS</span><span><UsersRound size={21}/> TEAMS &<br/>ORGANIZATIONS</span></div>
   </div>
 </section>
 <nav className={styles.categoryBar} aria-label="Shop categories">{categories.map(c=><Link href={c.href} key={c.label} className={styles.category}><div className={styles.categoryPicture}><Image src={c.src} alt="" width={120} height={120}/></div><strong>{c.label}</strong><ArrowRight size={16} className={styles.categoryArrow}/></Link>)}</nav>
 <ML112Featured/>
 <section className={styles.bottomCta} aria-label="Customize sportswear"><div className={styles.bottomPhoto}><div className={styles.bottomText}><small>MAKE IT YOURS</small><h2>CUSTOMIZE<br/>WITHOUT LIMITS</h2><p>Your design. Your colors. Your team.</p><Link href="/customize" className={styles.primary}>START CUSTOMIZING <ArrowRight size={16}/></Link></div></div><div className={styles.whiteFeature}><div><Brush size={24}/><span>CUSTOM<br/>DESIGNS</span></div><div><Shirt size={24}/><span>ANY NAME<br/>ANY NUMBER</span></div><div><Palette size={24}/><span>WIDE COLOR<br/>OPTIONS</span></div><div><HeartHandshake size={24}/><span>FOR TEAMS<br/>& EVENTS</span></div></div></section>
 <section className={styles.help} id="how-it-works"><strong>How it works</strong><span><BadgeCheck size={17}/> Choose a design</span><span><Brush size={17}/> Customize your garment</span><span><ClipboardCheck size={17}/> Review and place your order</span><Link href="/track">Track order <ArrowRight size={16}/></Link></section>
 <p className={styles.mockupNote}>Photos show sample designs and presentation mockups. Garment colors and production results may vary. Current size-based prices are confirmed in the customizer.</p>
 </div>}
