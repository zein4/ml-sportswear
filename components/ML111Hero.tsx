'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import styles from './ML111Hero.module.css';

const slides = [
  { src: '/ml11/blue-display.webp', alt: 'Sky blue basketball jersey photographed in a display studio', title: 'Made to stand out', sub: 'Basketball jersey showcase' },
  { src: '/ml11/midnight-display.webp', alt: 'Purple basketball jersey photographed in a display studio', title: 'Built for your colors', sub: 'Full sublimation sample' },
  { src: '/ml11/palasinaan-set.webp', alt: 'Purple and black team jersey and shorts design', title: 'One team. One look.', sub: 'Team set design sample' },
];
export function ML111Hero() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 5300);
    return () => window.clearInterval(timer);
  }, [playing]);
  return <div className={styles.stage} aria-label="ML Sportswear design showcase">
    <div className={styles.frame}>
      {slides.map((slide, i) => <div className={`${styles.slide} ${index === i ? styles.active : ''}`} aria-hidden={index !== i} key={slide.src}>
        <Image src={slide.src} alt={slide.alt} fill priority={i === 0} sizes="(max-width: 800px) 100vw, 45vw" className={styles.shot}/>
      </div>)}
      <span className={styles.photoLabel}>DESIGN SHOWCASE / 0{index + 1}</span>
      <div className={styles.info} aria-live="polite">
        <span>0{index+1} / 0{slides.length}</span>
        <strong>{slides[index].title}</strong>
        <small>{slides[index].sub}</small>
      </div>
    </div>
    <div className={styles.controls} aria-label="Showcase controls">
      <div className={styles.dots}>{slides.map((slide, i) => <button type="button" key={slide.src} onClick={()=>setIndex(i)} aria-label={`Show garment ${i+1}`} aria-current={i===index?'true':undefined} className={i===index?styles.chosen:''}/>)}</div>
      <div className={styles.buttons}>
        <button type="button" aria-label="Previous garment" onClick={()=>setIndex(i=>(i+slides.length-1)%slides.length)}><ChevronLeft size={17}/></button>
        <button type="button" aria-label={playing?'Pause slideshow':'Play slideshow'} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={15}/>:<Play size={15}/>}</button>
        <button type="button" aria-label="Next garment" onClick={()=>setIndex(i=>(i+1)%slides.length)}><ChevronRight size={17}/></button>
      </div>
    </div>
  </div>;
}
