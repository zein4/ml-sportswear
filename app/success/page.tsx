import Link from 'next/link';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return <section className="success-wrap"><div className="success-icon"><CheckCircle2 size={42}/></div><span className="section-kicker">REQUEST RECEIVED</span><h1>Looking good,<br/><em>team.</em></h1><p>Your design and quotation request have been recorded. This is not yet a confirmed or paid order. ML Sportswear will review the details and may contact you using the information provided.</p>{code && <div className="success-code"><span>YOUR REQUEST REFERENCE</span><strong>{code}</strong></div>}<Link href="/" className="button button-dark">Back to home <ArrowUpRight size={18}/></Link></section>;
}
