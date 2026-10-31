'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowUpRight, Copy, PackageSearch } from 'lucide-react';
import { GCashPaymentCard } from '@/components/GCashPaymentCard';

export default function SuccessPage() {
  const [code,setCode]=useState('');
  const [accessToken,setAccessToken]=useState('');
  const [trackingUrl,setTrackingUrl]=useState('');
  const [copied,setCopied]=useState(false);
  const [method,setMethod]=useState('');
  const [total,setTotal]=useState(0);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.hash.slice(1));
    const c=params.get('code')||'',token=params.get('token')||'';
    setCode(c);setAccessToken(token);
    try{const stored=JSON.parse(sessionStorage.getItem('ml-checkout-order')||'{}');setMethod(stored.method||'');setTotal(Number(stored.total||0));}catch{}
    if(c&&token) setTrackingUrl(`${window.location.origin}/track#code=${encodeURIComponent(c)}&token=${encodeURIComponent(token)}`);
  },[]);
  async function copy() {
    try{await navigator.clipboard.writeText(trackingUrl);setCopied(true);}catch{setCopied(false);}
  }
  return <section className="success-wrap"><div className="success-icon"><CheckCircle2 size={42}/></div><span className="section-kicker">ORDER PLACED</span><h1>Looking good,<br/><em>team.</em></h1>
    <p>{method==='cod'?'Your Cash on Delivery order is placed. Pay cash when it arrives.':'Your order has been placed. If you chose GCash, scan the shop QR below and upload your receipt. Staff must verify the transfer before production begins.'}</p>
    {code&&<div className="success-code"><span>YOUR REQUEST REFERENCE</span><strong>{code}</strong></div>}
    {method==='qrph'&&code&&accessToken&&<GCashPaymentCard code={code} token={accessToken} amount={total} />}
    {trackingUrl&&<div className="customer-card"><h2><PackageSearch size={22}/> Save your private tracking link</h2><p>Use this link to check payment, production, and delivery. Keep it private and save it now.</p>
      <div className="workflow-actions"><button type="button" className="button button-dark" onClick={copy}><Copy size={17}/>{copied?'Link copied':'Copy private tracking link'}</button><a className="button button-outline" href={trackingUrl}>Track my order <ArrowUpRight size={17}/></a></div>
    </div>}
    <Link href="/" className="text-link">Back to home <ArrowUpRight size={18}/></Link>
  </section>;
}
