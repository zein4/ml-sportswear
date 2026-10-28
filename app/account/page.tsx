'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Ban, LogOut, Package, RefreshCcw, ShieldCheck, ShoppingBag } from 'lucide-react';
import { CustomerCancelDialog } from '@/components/CustomerCancelDialog';
import type { User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { money } from '@/lib/catalog';
type Order={id:string;code:string;created_at:string;garment:string;quantity:number;estimated_total:number;quoted_total:number|null;status:string;production_status:string;delivery_status:string;checkout_method:string|null;checkout_status:string|null};
export default function AccountPage(){
  const router=useRouter();
  const [user,setUser]=useState<User|null>(null);const [orders,setOrders]=useState<Order[]>([]);const [loading,setLoading]=useState(true);const [loadingOrders,setLoadingOrders]=useState(false);const [error,setError]=useState('');const [cancelFor,setCancelFor]=useState<Order|null>(null);const [cancelling,setCancelling]=useState(false);const [notice,setNotice]=useState('');
  const refresh=async()=>{
    const client=supabaseBrowser();if(!client)return;
    setLoadingOrders(true);setError('');
    try{const {data}=await client.auth.getSession();if(!data.session)throw Error('Session expired. Please sign in again.');
      const r=await fetch('/api/account/orders',{headers:{Authorization:`Bearer ${data.session.access_token}`},cache:'no-store'});
      const json=await r.json();if(!r.ok)throw Error(json.error||'Could not load your orders.');setOrders(json.orders||[]);
    }catch(e){setError(e instanceof Error?e.message:'Could not load orders.');}finally{setLoadingOrders(false);}
  };
  useEffect(()=>{
    const client=supabaseBrowser();if(!client){setError('Supabase is not configured.');setLoading(false);return;}
    client.auth.getUser().then(({data})=>{
      if(!data.user){router.replace('/login');return;}
      setUser(data.user);setLoading(false);void refresh();
    }).catch(()=>{setLoading(false);setError('Could not verify your session.');});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[router]);
  async function cancelFromAccount(reason:string,detail:string):Promise<boolean>{
    if(!cancelFor)return false;
    setCancelling(true);setError('');setNotice('');
    try{
      const client=supabaseBrowser();const {data}=await client!.auth.getSession();
      if(!data.session)throw Error('Please sign in again to cancel your order.');
      const response=await fetch('/api/account/orders',{method:'PATCH',
        headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},
        body:JSON.stringify({id:cancelFor.id,reason,detail})});
      const json=await response.json();if(!response.ok||!json.ok)throw Error(json.error||json.message||'Could not cancel order.');
      setOrders(previous=>previous.map(o=>o.id===cancelFor.id?{...o,status:'cancelled',checkout_status:'cancelled'}:o));
      setNotice('Order cancelled. It will remain in your order history.');return true;
    }catch(e){setError(e instanceof Error?e.message:'Unable to cancel order.');return false;}
    finally{setCancelling(false);}
  }
  const signOut=async()=>{await supabaseBrowser()?.auth.signOut();router.replace('/login');router.refresh();};
  if(loading)return <div className="account-wrap"><p className="loading-note">Loading your account…</p></div>;
  if(!user && !error)return <div className="account-wrap"><p className="loading-note">Taking you to login…</p></div>;
  return <div className="account-wrap">
    <div className="account-heading"><div><span className="section-kicker">ML SPORTSWEAR / CUSTOMER ACCOUNT</span><h1>My account<span className="accent-period">.</span></h1><p>Welcome{user?.user_metadata?.full_name?`, ${String(user.user_metadata.full_name)}`:''}. Your custom orders, all in one place.</p><small>{user?.email}</small></div><button type="button" className="small-button" onClick={()=>void signOut()}><LogOut size={16}/> Sign out</button></div>
    <div className="account-stats"><div><ShoppingBag size={22}/><strong>{orders.length}</strong><span>Orders on your account</span></div><div><Package size={22}/><strong>{orders.filter(o=>o.delivery_status!=='delivered'&&o.status!=='cancelled').length}</strong><span>Not yet delivered</span></div><div><ShieldCheck size={22}/><strong>Private</strong><span>Only your orders are shown</span></div></div>
    <div className="account-orders-top"><div><span className="section-kicker">ORDER HISTORY</span><h2>My orders</h2></div><div className="account-actions"><button type="button" onClick={()=>void refresh()} disabled={loadingOrders} className="small-button"><RefreshCcw size={15}/> Refresh</button><Link href="/customize" className="button button-dark">Design again <ArrowUpRight size={16}/></Link></div></div>
    {error&&<div role="alert" className="request-error">{error}</div>}
    {notice&&<div role="status" className="workflow-success"><ShieldCheck size={17}/>{notice}</div>}
    {loadingOrders&&<p className="loading-note">Loading recent orders…</p>}
    {!loadingOrders&&!orders.length&&<div className="account-empty"><ShoppingBag size={32}/><h3>No orders yet</h3><p>Orders you place while signed in will appear here automatically. Guest orders remain accessible through their private tracking link.</p><Link href="/customize" className="button button-dark">Start customizing <ArrowUpRight size={17}/></Link></div>}
    <div className="account-orders">{orders.map(o=><article className="account-order" key={o.id}><div><small>ORDER REFERENCE</small><strong>{o.code}</strong><span>{new Date(o.created_at).toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}</span></div><div><small>ITEM</small><strong>{o.garment==='tshirt'?'T-Shirt':o.garment==='set'?'Jersey Set':o.garment==='sando'?'Sando':'Shorts'} × {o.quantity}</strong><span>{money(Number(o.quoted_total??o.estimated_total))}</span></div><div><small>PAYMENT</small><strong>{o.checkout_method==='cod'?'Cash on Delivery':o.checkout_method==='qrph'?'GCash / QR Ph':'Quotation request'}</strong><span>{(o.checkout_status||'Pending').replaceAll('_',' ')}</span></div><div><small>PROGRESS</small><strong>{o.production_status.replaceAll('_',' ')}</strong><span>Delivery: {o.delivery_status.replaceAll('_',' ')}</span>{o.status==='cancelled'||o.checkout_status==='cancelled'?<span className="v6-pill v6-pill-danger">Order cancelled</span>:o.checkout_method==='cod'&&o.checkout_status==='cod_pending'&&o.production_status==='not_started'&&o.delivery_status==='not_ready'?<button type="button" className="v6-account-cancel" disabled={cancelling} onClick={()=>setCancelFor(o)}><Ban size={14}/> Cancel order</button>:null}</div></article>)}</div>
    {cancelFor&&<CustomerCancelDialog orderCode={cancelFor.code} busy={cancelling} onClose={()=>setCancelFor(null)} onConfirm={cancelFromAccount} errorText={error}/>}
    <p className="account-hint"><ShieldCheck size={16}/> The My Orders page shows orders submitted while you were logged in. Keep your private tracking link for detailed order progress.</p>
  </div>;
}
