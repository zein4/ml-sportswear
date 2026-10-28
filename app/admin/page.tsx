'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ArrowUpRight, Download, LogOut, RefreshCcw, Settings2 } from 'lucide-react';
import { GARMENTS, money } from '@/lib/catalog';
import type { StaffOrder } from '@/lib/admin-types';
import { OrderWorkflowPanel } from '@/components/OrderWorkflowPanel';

function newClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key?createClient(url,key):null;
}
function csvEscape(value:unknown){
  let str=String(value??'').replace(/[\r\n]+/g,' ');
  if (/^[=+\-@\t]/.test(str))str="'"+str;
  return '"'+str.replace(/"/g,'""')+'"';
}
export default function AdminPage(){
  const [client]=useState<SupabaseClient|null>(()=>newClient());
  const [token,setToken]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [rows,setRows]=useState<StaffOrder[]>([]),[selectedId,setSelectedId]=useState('');
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState('');
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
  const fetchRows=useCallback(async (access:string)=>{
    setBusy(true);setError('');
    try{
      const res=await fetch('/api/admin/orders',{headers:{Authorization:`Bearer ${access}`},cache:'no-store'});
      const json=await res.json();if(!res.ok)throw Error(json.error||'Cannot load orders.');
      setRows(json.orders||[]);
    }catch(e){setError(e instanceof Error?e.message:'Cannot load orders.');}
    finally{setBusy(false);}
  },[]);
  useEffect(()=>{
    if(!client){setLoading(false);return;}
    const c=client;
    c.auth.getSession().then(({data})=>{const access=data.session?.access_token||'';setToken(access);setLoading(false);if(access)void fetchRows(access);})
      .catch(()=>setLoading(false));
    const {data:sub}=c.auth.onAuthStateChange((_event,session)=>{setToken(session?.access_token||'');if(!session)setRows([]);});
    return ()=>sub.subscription.unsubscribe();
  },[client,fetchRows]);
  async function signIn(e:React.FormEvent){
    e.preventDefault();if(!client)return;setError('');setBusy(true);
    const {data,error:loginError}=await client.auth.signInWithPassword({email,password});
    setBusy(false);if(loginError){setError(loginError.message);return;}
    setPassword('');if(data.session){setToken(data.session.access_token);void fetchRows(data.session.access_token);}
  }
  async function signOut(){await client?.auth.signOut();setToken('');setRows([]);setSelectedId('');setError('');}
  const authToken=async()=>{
    if(!client)throw Error('Supabase is not configured.');
    const {data}=await client.auth.getSession();const access=data.session?.access_token;
    if(!access)throw Error('Your session expired. Please sign in again.');
    return access;
  };
  async function refresh(){try{await fetchRows(await authToken());}catch(e){setError(e instanceof Error?e.message:'Unable to refresh.');}}
  async function save(action:string,extra:Record<string,unknown>):Promise<Record<string,unknown>|null>{
    if(!selectedId)return null;setBusy(true);setError('');setMessage('');
    try{
      const access=await authToken();
      const res=await fetch('/api/admin/orders',{method:'PATCH',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify({id:selectedId,action,...extra})});
      const json=await res.json();if(!res.ok)throw Error(json.error||'Could not save order.');
      setMessage(action==='tracking_link'?'New private tracking link created. Copy it now.':'Order updated successfully.');
      await fetchRows(access);
      return json;
    }catch(e){setError(e instanceof Error?e.message:'Could not save.');return null;}
    finally{setBusy(false);}
  }
  const selected=rows.find(o=>o.id===selectedId);
  const visible=useMemo(()=>rows.filter(o=>(filter==='all'||o.status===filter)&&[o.code,o.contact_name,o.email,o.team_name,o.phone].join(' ').toLowerCase().includes(search.toLowerCase())),[rows,filter,search]);
  function exportCsv(){
    const headings=['Request','Date','Stage','Customer','Email','Phone','Garment','Pieces','Sizes','Sample Estimate','Final Quote','Verified Payments','Production','Delivery','Delivery Reference'];
    const records=visible.map(o=>[o.code,o.created_at,o.status,o.contact_name,o.email,o.phone,o.garment,o.quantity,JSON.stringify(o.sizes),o.estimated_total,o.quoted_total,o.payments.filter(p=>p.status==='verified').reduce((n,p)=>n+Number(p.expected_amount),0),o.production_status,o.delivery_status,o.delivery_reference]);
    const csv=[headings,...records].map(record=>record.map(csvEscape).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='ML-Sportswear-Orders.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  if(loading)return <div className="admin-wrap"><p className="loading-note">Checking staff session…</p></div>;
  if(!client)return <div className="admin-wrap"><section className="admin-login"><h1>Staff portal</h1><p>Supabase environment variables are missing.</p></section></div>;
  if(!token)return <div className="admin-wrap"><div className="admin-login"><span className="section-kicker">ML SPORTSWEAR STAFF</span><h1>Welcome back.</h1><p>Log in using an authorized staff account to review requests, issue quotations, verify payments, and manage production.</p><form onSubmit={signIn}><label className="form-field"><span>Email</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="form-field"><span>Password</span><input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="request-error">{error}</div>}<button className="button button-dark next-button" disabled={busy}>Sign in <ArrowUpRight size={17}/></button></form></div></div>;
  return <div className="admin-wrap"><div className="admin-bar"><div><span className="section-kicker">STAFF / ORDER MANAGEMENT</span><h1>Orders & payments.</h1></div><button type="button" className="small-button" onClick={()=>void signOut()}><LogOut size={14}/> Sign out</button></div>
    <div className="dashboard-stats"><div><b>{rows.length}</b><small>Recent requests</small></div><div><b>{rows.filter(o=>o.status==='new').length}</b><small>Needs review</small></div><div><b>{rows.reduce((n,o)=>n+o.payments.filter(p=>p.status==='submitted').length,0)}</b><small>Payment proofs to verify</small></div><div><b>{rows.filter(o=>o.production_status==='in_production').length}</b><small>In production</small></div></div>
    <div className="admin-toolbar"><input aria-label="Search orders" placeholder="Search customer or reference" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter orders" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{['new','reviewing','quoted','approved','in_production','completed','cancelled'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select><button type="button" className="small-button" disabled={busy} onClick={()=>void refresh()}><RefreshCcw size={14}/> Refresh</button><button type="button" className="small-button" disabled={!visible.length} onClick={exportCsv}><Download size={14}/> CSV</button></div>
    {error&&<div className="request-error" role="alert">{error}</div>}{message&&<div className="workflow-success" role="status">{message}</div>}
    <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Garment</th><th>Pieces</th><th>Price</th><th>Stage</th><th>Payment</th><th>Artwork</th><th>Manage</th></tr></thead><tbody>{visible.map(o=><tr key={o.id}><td><strong>{o.code}</strong><small>{new Date(o.created_at).toLocaleDateString('en-PH')}</small></td><td><strong>{o.contact_name}</strong><small>{o.email}</small><small>{o.phone}</small></td><td><strong>{GARMENTS.find(g=>g.id===o.garment)?.label||o.garment}</strong><small>{o.team_name||'—'}</small></td><td><strong>{o.quantity}</strong><small>{Object.entries(o.sizes||{}).filter(([,n])=>n>0).map(([s,n])=>`${s}×${n}`).join(' · ')}</small></td><td><strong>{o.quoted_total!==null?money(Number(o.quoted_total)):'Not quoted'}</strong><small>Sample {money(o.estimated_total)}</small></td><td><strong>{o.status.replaceAll('_',' ')}</strong><small>{o.delivery_status.replaceAll('_',' ')}</small></td><td><strong>{o.payments.some(p=>p.status==='submitted')?'Needs verification':o.payments.some(p=>p.status==='verified')?'Verified':'Unpaid'}</strong></td><td>{o.front_design_url&&<p><a href={o.front_design_url} target="_blank" rel="noreferrer">Front ↗</a></p>}{o.back_design_url&&<p><a href={o.back_design_url} target="_blank" rel="noreferrer">Back ↗</a></p>}<details><summary>Placement</summary><pre>{JSON.stringify(o.artwork_layout||{},null,2)}</pre></details></td><td><button type="button" className="small-button" onClick={()=>{setSelectedId(o.id);setError('');setMessage('');}}><Settings2 size={14}/> Manage</button></td></tr>)}</tbody></table>{!visible.length&&<div className="admin-empty">{busy?'Loading orders…':'No matching orders.'}</div>}</div>
    {selected&&<OrderWorkflowPanel order={selected} busy={busy} save={save} onClose={()=>{setSelectedId('');setMessage('');}}/>}
    <p className="hint">Only approved staff can access this portal. Verify actual funds in your own account before approving a receipt. All artwork and receipt links expire.</p>
  </div>;
}
