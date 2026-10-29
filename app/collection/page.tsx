import '../patch9-shared.css';
import '../patch10-aesthetic.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Patch9Collection } from '@/components/Patch9Collection';
import { Patch9Motion } from '@/components/Patch9Motion';
export const metadata: Metadata = { title:'The Collection | ML Sportswear', description:'Browse and personalize custom sando, T-shirts, shorts and jersey sets.' };
export default function CollectionPage(){return <div className="patch9-collection-page ml9-visual-root"><Patch9Motion/><div className="patch9-collection-breadcrumb"><Link href="/"><ArrowLeft size={15}/> Back to the homepage</Link><span><Sparkles size={14}/> THE ML SPORTSWEAR COLLECTION</span></div><Patch9Collection standalone/></div>}
