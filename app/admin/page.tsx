'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ArrowUpRight, Download, LogOut, RefreshCcw } from 'lucide-react';
import { GARMENTS, money } from '@/lib/catalog';

type Order = {
  id:string; code:string; created_at:string; garment:string; color:string; accent_color:string; print_color:string;
  player_name:string; player_number:string; team_name:string; sizes:Record<string,number>;
  quantity:number; roster:string; notes:string; contact_name:string; email:string; phone:string; organization:string;
  estimated_total:number; front_design_url?:string|null; back_design_url?:string|null; artwork_layout?:Record<string,{x:number;y:number;scale:number}>; status:string;
};
const statuses = ['new','reviewing','quoted','approved','in_production','completed','cancelled'];
function authClient() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url,key) : null;
}
function csvEscape(x:unknown) {
  // Prefix spreadsheet formula characters to protect CSV exports from formula execution.
  let s=String(x ?? '').replace(/[\r\n]+/g,' ');
  if (/^[=+\-@\t]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
export default function AdminPage() {
  const [client] = useState<SupabaseClient|null>(()=>authClient());
  const [token,setToken] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [rows,setRows] = useState<Order[]>([]);
  const [search,setSearch] = useState('');
  const [filter,setFilter] = useState('all');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const fetchRows = useCallback(async (access:string) => {
    setBusy(true);setError('');
    try {
      const r=await fetch('/api/admin/orders',{headers:{Authorization:`Bearer ${access}`},cache:'no-store'});
      const j=await r.json(); if(!r.ok)throw Error(j.error||'Unable to load requests.');
      setRows(j.orders||[]);
    } catch(e) {setError(e instanceof Error ? e.message:'Unable to load requests.');}
    finally{setBusy(false);}
  },[]);
  useEffect(()=>{
    if (!client) {setLoading(false);return;}
    const c=client;
    c.auth.getSession().then(({data})=>{const access=data.session?.access_token||'';setToken(access);setLoading(false);if(access)void fetchRows(access);});
    const {data:sub}=c.auth.onAuthStateChange((_event,session)=>{setToken(session?.access_token||'');if (!session) setRows([]);});
    return ()=>sub.subscription.unsubscribe();
  },[client,fetchRows]);
  const signIn=async(e:React.FormEvent)=>{
    e.preventDefault();if(!client)return;
    setBusy(true);setError('');
    const {data,error}=await client.auth.signInWithPassword({email,password});
    setBusy(false);
    if(error){setError(error.message);return;}
    setPassword('');
    if(data.session){setToken(data.session.access_token);void fetchRows(data.session.access_token);}
  };
  const signOut=async()=>{await client?.auth.signOut();setToken('');setRows([]);setError('');};
  const update=async(id:string,status:string)=>{
    setError('');
    const {data}=await client!.auth.getSession(); const access=data.session?.access_token || token;
    try{
      const r=await fetch('/api/admin/orders',{method:'PATCH',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify({id,status})});
      const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to update.');
      setRows(prev=>prev.map(o=>o.id===id ? {...o,status}:o));
    }catch(e){setError(e instanceof Error?e.message:'Unable to update.');}
  };
  const visible = useMemo(()=>rows.filter(o=>(filter==='all'||o.status===filter)&&[o.code,o.contact_name,o.email,o.team_name,o.phone].join(' ').toLowerCase().includes(search.toLowerCase())),[rows,filter,search]);
  const exportCsv=()=>{
    const headings=['Request','Date','Status','Customer','Email','Phone','Organization','Garment','Quantity','Size Breakdown','Color','Trim','Print Color','Name','Number','Team','Roster','Notes','Artwork Placement','Demo Estimate'];
    const records=visible.map(o=>[o.code,o.created_at,o.status,o.contact_name,o.email,o.phone,o.organization,o.garment,o.quantity,JSON.stringify(o.sizes),o.color,o.accent_color,o.print_color,o.player_name,o.player_number,o.team_name,o.roster,o.notes,JSON.stringify(o.artwork_layout || {}),o.estimated_total]);
    const text=[headings,...records].map(row=>row.map(csvEscape).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff',text],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='ML-Sportswear-Orders.csv';a.click();URL.revokeObjectURL(url);
  };
  if(loading)return <div className="admin-wrap"><p className="loading-note">Checking your session…</p></div>;
  if(!client) return <div className="admin-wrap"><section className="admin-login"><h1>Staff portal</h1><p>Supabase is not yet configured. Add the required environment variables to activate secure staff login.</p></section></div>;
  if(!token) return <div className="admin-wrap"><div className="admin-login"><span className="section-kicker">FOR ML SPORTSWEAR STAFF</span><h1>Welcome back.</h1><p>Sign in using your authorized Supabase staff account to review quotation requests.</p><form onSubmit={signIn}><label className="form-field"><span>Email</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@example.com"/></label><label className="form-field"><span>Password</span><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/></label>{error&&<div className="request-error">{error}</div>}<button disabled={busy} className="button button-dark next-button">{busy?'Signing in…':'Staff sign in'} <ArrowUpRight size={17}/></button></form></div></div>;
  return <div className="admin-wrap"><div className="admin-bar"><div><span className="section-kicker">STAFF / REQUEST MANAGEMENT</span><h1>Quotation requests.</h1></div><button className="small-button" onClick={signOut}><LogOut size={14}/> Sign out</button></div>
    <div className="dashboard-stats"><div><b>{rows.length}</b><small>Total requests (latest 200)</small></div><div><b>{rows.filter(r=>r.status==='new').length}</b><small>New</small></div><div><b>{rows.filter(r=>r.status==='in_production').length}</b><small>In production</small></div><div><b>{rows.filter(r=>r.status==='completed').length}</b><small>Completed</small></div></div>
    <div className="admin-toolbar"><input aria-label="Search requests" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email or reference"/><select aria-label="Filter by status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select><button onClick={()=>void fetchRows(token)} disabled={busy} className="small-button"><RefreshCcw size={14}/> Refresh</button><button onClick={exportCsv} disabled={!visible.length} className="small-button"><Download size={14}/> Export CSV</button></div>
    {error&&<div className="request-error" role="alert">{error}</div>}
    <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Request</th><th>Customer</th><th>Product</th><th>Pieces / sizes</th><th>Estimate</th><th>Artwork</th><th>Additional info</th><th>Status</th></tr></thead><tbody>{visible.map(o=><tr key={o.id}><td><strong>{o.code}</strong><small>{new Date(o.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</small></td><td><strong>{o.contact_name}</strong><small>{o.email}</small><small>{o.phone}</small><small>{o.organization}</small></td><td><strong>{GARMENTS.find(g=>g.id===o.garment)?.label||o.garment}</strong><small>Team: {o.team_name||'—'}</small><small>{o.player_name||'—'} #{o.player_number||'—'}</small></td><td><strong>{o.quantity} pcs</strong><small>{Object.entries(o.sizes||{}).filter(([,n])=>n>0).map(([s,n])=>`${s} ×${n}`).join(', ')||'—'}</small></td><td><strong>{money(o.estimated_total)}</strong><small>Sample only</small></td><td>{o.front_design_url&&<div><a href={o.front_design_url} target="_blank" rel="noreferrer">Front <ArrowUpRight size={11}/></a></div>}{o.back_design_url&&<div><a href={o.back_design_url} target="_blank" rel="noreferrer">Back <ArrowUpRight size={11}/></a></div>}{!o.front_design_url&&!o.back_design_url&&'—'}<details className="artwork-layout-details"><summary>Placement data</summary><pre>{JSON.stringify(o.artwork_layout || {},null,2)}</pre></details></td><td className="order-notes"><strong>{o.notes||'—'}</strong><small>Roster: {o.roster||'—'}</small></td><td><select value={o.status} onChange={e=>void update(o.id,e.target.value)} aria-label={`Status for ${o.code}`}>{statuses.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></td></tr>)}</tbody></table>{!visible.length&&<div className="admin-empty">{busy?'Loading requests…':'No requests match your search.'}</div>}</div>
    <p className="hint">Only authorized staff can view this data. Artwork links are temporary. Sample prices shown here are not confirmed quotations.</p>
  </div>;
}
