'use client';
import { useEffect,useState } from 'react';
import Image from 'next/image';
import { Pause,Play } from 'lucide-react';
import styles from './ML112HeroArt.module.css';
const frames=[
  {src:'/ml113/hero-one.webp',alt:'High-resolution ML Sportswear basketball jerseys in a dark studio collage'},
  {src:'/ml113/hero-two.webp',alt:'High-resolution blue, red and purple basketball jersey designs'}
];
export function ML112HeroArt(){
 const [slide,setSlide]=useState(0);const [playing,setPlaying]=useState(true);
 useEffect(()=>{if(!playing)return;const t=setInterval(()=>setSlide(i=>(i+1)%frames.length),6500);return()=>clearInterval(t);},[playing]);
 return <div className={styles.box} aria-label="Featured garment slideshow">
  {frames.map((f,i)=><div key={f.src} className={`${styles.frame} ${i===slide?styles.active:''}`} aria-hidden={i!==slide}><Image src={f.src} alt={f.alt} fill priority={i===0} sizes="(max-width:700px) 100vw, 60vw" quality={92}/></div>)}
  <div className={styles.controls}>
    {frames.map((f,i)=><button type="button" key={f.src} className={`${styles.dot} ${i===slide?styles.current:''}`} aria-label={`Show garment scene ${i+1}`} aria-pressed={i===slide} onClick={()=>setSlide(i)}/>)}
    <button type="button" className={styles.play} aria-label={playing?'Pause garment slideshow':'Play garment slideshow'} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={13}/>:<Play size={13}/>}</button>
  </div>
 </div>;
}
