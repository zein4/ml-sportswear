'use client';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowLeft, ArrowRight, MoveUpRight, Pause, Play } from 'lucide-react';
import { GarmentPreview } from '@/components/GarmentPreview';
import type { GarmentId } from '@/lib/catalog';
import styles from './Patch9HeroStage.module.css';

const INTERVAL_MS = 3400;
const looks: { garment: GarmentId; label: string; issue: string; color: string; accent: string }[] = [
  { garment: 'tshirt', label: 'The Everyday', issue: 'LOOK 01', color: '#171e2c', accent: '#e4e9f2' },
  { garment: 'sando', label: 'Court Identity', issue: 'LOOK 02', color: '#505987', accent: '#f5eef8' },
  { garment: 'shorts', label: 'Match Day', issue: 'LOOK 03', color: '#303d4d', accent: '#d9dceb' },
  { garment: 'set', label: 'Full Team Set', issue: 'LOOK 04', color: '#354a64', accent: '#e7eef3' },
];

export function Patch9HeroStage() {
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) setAutoPlay(false);
  }, []);

  useEffect(() => {
    if (!autoPlay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex(previous => (previous + 1) % looks.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoPlay, index]);

  const selectLook = (next: number) => setIndex((next + looks.length) % looks.length);
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !tiltRef.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    tiltRef.current.style.setProperty('--ml9-rotate-x', `${(-y * 7).toFixed(2)}deg`);
    tiltRef.current.style.setProperty('--ml9-rotate-y', `${(x * 9).toFixed(2)}deg`);
  };
  const resetTilt = () => {
    tiltRef.current?.style.setProperty('--ml9-rotate-x', '0deg');
    tiltRef.current?.style.setProperty('--ml9-rotate-y', '0deg');
  };
  const look = looks[index];

  return <div className={styles.stage} onPointerMove={handlePointerMove} onPointerLeave={resetTilt} aria-label="Animated ML Sportswear lookbook">
    <span className={styles.topLeft}>ML. / LOOKBOOK 2026</span>
    <span className={styles.topRight}>YOUR TEAM, YOUR RULES.</span>
    <span className={styles.halo} aria-hidden="true"/><span className={styles.haloTwo} aria-hidden="true"/>
    <span className={styles.orbitMark} aria-hidden="true">✳</span>
    <span className={styles.giantWord} aria-hidden="true">MOVE</span>
    <div key={`${look.garment}-${index}`} className={styles.figure}>
      <div className={styles.tilt} ref={tiltRef}>
        <GarmentPreview garment={look.garment} color={look.color} accentColor={look.accent} printColor={look.accent} playerName="ML PLAYER" playerNumber="24" teamName="ML TEAM" view="front" mini />
      </div>
    </div>
    <div className={styles.controls}>
      <button type="button" aria-label="Previous look" onClick={() => selectLook(index - 1)}><ArrowLeft size={17}/></button>
      <div className={styles.counter} aria-live="polite"><strong>{look.issue}</strong><span>{look.label}</span></div>
      <button type="button" aria-label="Next look" onClick={() => selectLook(index + 1)}><ArrowRight size={17}/></button>
      <button type="button" className={styles.playButton} onClick={() => setAutoPlay(value => !value)} aria-label={autoPlay ? 'Pause lookbook slideshow' : 'Play lookbook slideshow'} aria-pressed={autoPlay}>
        {autoPlay ? <Pause size={16}/> : <Play size={16}/>}
      </button>
    </div>
    <div className={styles.bottomRail}>{looks.map((l, i) => <button type="button" key={l.garment} aria-label={`Show ${l.label}`} aria-pressed={i === index} className={`${styles.dot} ${i === index ? styles.active : ''}`} onClick={() => selectLook(i)}><span/></button>)}</div>
    <div className={styles.motionInfo}><span className={styles.pulseLight}/>{autoPlay ? 'AUTO LOOKBOOK • 3.4 SEC' : 'MANUAL LOOKBOOK'}</div>
    {autoPlay && <div key={index} className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill}/></div>}
    <Link className={styles.discover} href={`/collection?garment=${look.garment}`}>Explore this piece <ArrowUpRight size={16}/></Link>
    <span className={styles.sidenote}>DESIGNED TO BE DIFFERENT <MoveUpRight size={12}/></span>
  </div>;
}
