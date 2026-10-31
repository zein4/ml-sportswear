import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ML11Gallery } from '@/components/ML11Gallery';
import styles from '../ML11Home.module.css';

export const metadata: Metadata = { title: 'Design Gallery | ML Sportswear Philippines', description: 'Browse sample sportswear designs and customize your own jersey, Sando, T-Shirt or Shorts.' };
export default function CollectionPage() { return <main className={styles.page}>
  <div style={{ padding: '30px clamp(20px, 5vw, 76px) 0', fontSize:12 }}><Link href="/" style={{display:'inline-flex',alignItems:'center',gap:7}}><ArrowLeft size={15}/> Back to homepage</Link></div>
  <ML11Gallery />
</main>; }
