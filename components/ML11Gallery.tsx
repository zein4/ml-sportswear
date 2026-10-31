'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { galleryCategories, galleryItems, type GalleryItem } from '@/lib/ml11-gallery';
import styles from './ML11Gallery.module.css';

export function ML11Gallery({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<(typeof galleryCategories)[number]>('All');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<GalleryItem | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return galleryItems.filter((item) => (category === 'All' || item.category === category) &&
      (!q || `${item.title} ${item.category}`.toLowerCase().includes(q)));
  }, [category, search]);
  useEffect(() => {
    if (compact) return;
    const params = new URLSearchParams(window.location.search);
    const incomingCategory = params.get('category');
    if (incomingCategory && galleryCategories.includes(incomingCategory as (typeof galleryCategories)[number])) setCategory(incomingCategory as (typeof galleryCategories)[number]);
    const incomingSearch = params.get('q');
    if (incomingSearch) setSearch(incomingSearch.slice(0, 80));
  }, [compact]);
  // Homepage deliberately shows a curated selection. Full filtering belongs on /collection.
  const items = compact ? [galleryItems[0], galleryItems[2], galleryItems[8], galleryItems[5], galleryItems[16]] : filtered;
  const activeIndex = active ? galleryItems.findIndex(item => item.id === active.id) : -1;
  const switchActive = (direction: number) => {
    if (activeIndex < 0) return;
    setActive(galleryItems[(activeIndex + direction + galleryItems.length) % galleryItems.length]);
  };
  useEffect(() => {
    if (!active) return;
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowLeft') switchActive(-1);
      if (event.key === 'ArrowRight') switchActive(1);
    };
    window.addEventListener('keydown', keyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', keyDown);
  // keyboard handler is re-registered when the selected item changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const contactHref = (item: GalleryItem) => `mailto:mlgenapp@gmail.com?subject=${encodeURIComponent('ML Sportswear inquiry: ' + item.title)}`;
  return <section className={`${styles.section} ${compact ? styles.compact : ''}`} id="featured-designs">
    <div className={styles.heading}>
      <div><span className={styles.overline}>ML SPORTSWEAR / DESIGN GALLERY</span>
        <h2>{compact ? 'Featured designs' : 'Explore the collection'}</h2>
        <p>Real ML Sportswear sample artwork and mockups. Explore ideas, then make yours.</p></div>
      {compact ? <Link href="/collection" className={styles.viewAll}>View all designs <ArrowUpRight size={17}/></Link> : null}
    </div>
    {!compact && <div className={styles.tools}>
      <div className={styles.filters} role="group" aria-label="Filter the design gallery">
        {galleryCategories.map(c => <button key={c} type="button" className={category === c ? styles.filterSelected : ''} onClick={() => setCategory(c)} aria-pressed={category === c}>{c}</button>)}
      </div>
      <label className={styles.search}><Search size={16}/><span className={styles.srOnly}>Search designs</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search designs" /></label>
    </div>}
    <div className={styles.grid}>
      {items.map((item, index) => <article className={styles.product} key={item.id} style={{animationDelay: `${Math.min(index,8)*45}ms`}}>
        <button type="button" className={styles.productImage} onClick={() => setActive(item)} aria-label={`Quick view: ${item.title}`}>
          <Image src={item.image} alt={`${item.title} — ML Sportswear sample artwork`} width={460} height={460} sizes="(max-width:600px) 46vw, (max-width:1000px) 33vw, 24vw" />
          <span className={styles.zoom}>Quick view <ArrowUpRight size={14}/></span>
        </button>
        <div className={styles.productInfo}><span className={styles.category}>{item.category}</span>
          <h3>{item.title}</h3><span className={styles.sampleTag}>Sample design · price depends on garment and size</span>
        </div>
      </article>)}
    </div>
    {!items.length && <div className={styles.empty}>No designs matched your search. <button type="button" onClick={()=>{setSearch('');setCategory('All');}}>Clear filters</button></div>}
    {compact && <Link href="/collection" className={styles.mobileViewAll}>Explore all designs <ArrowRight size={16}/></Link>}
    {active && <div className={styles.modalBack} onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null);}}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Quick view of ${active.title}`} tabIndex={-1} ref={dialogRef}>
        <div className={styles.modalImage}><Image src={active.image} alt={`${active.title} design presentation`} width={800} height={800} sizes="(max-width:750px) 94vw, 50vw" />
          <div className={styles.modalNav}><button type="button" aria-label="Previous design" onClick={()=>switchActive(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label="Next design" onClick={()=>switchActive(1)}><ChevronRight size={18}/></button></div>
        </div>
        <div className={styles.modalInfo}>
          <button type="button" className={styles.close} aria-label="Close quick view" onClick={()=>setActive(null)}><X size={20}/></button>
          <span className={styles.overline}>ML SPORTSWEAR / DESIGN PREVIEW</span><h3>{active.title}</h3>
          <p>{active.category}</p>
          <div className={styles.notice}>Artwork is a sample or presentation mockup. Final print and colors may vary. Exact garment and size prices are shown in the design studio.</div>
          {active.garment ? <Link href={`/customize?garment=${active.garment}`} className={styles.modalCta}>Customize this garment <ArrowRight size={18}/></Link>
            : <a className={styles.modalCta} href={contactHref(active)}>Ask about this style <ArrowRight size={18}/></a>}
          <span className={styles.subtle}>The studio currently supports Sando, T-Shirt, Shorts, and Jersey Set. Ask the shop about other garment styles.</span>
        </div>
      </div>
    </div>}
  </section>;
}
