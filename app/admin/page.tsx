'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Activity, ArrowUpRight, Ban, CheckCircle2, ChevronRight, Download, Eye, EyeOff,
  Inbox, LogOut, Package, RefreshCcw, Search, Settings2, ShieldCheck, Truck,
} from 'lucide-react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { GARMENTS, money } from '@/lib/catalog';
import type { StaffOrder } from '@/lib/admin-types';
import { OrderWorkflowPanel } from '@/components/OrderWorkflowPanel';
import { CheckoutOrderPanel } from '@/components/CheckoutOrderPanel';
import { AdminPriceManager } from '@/components/AdminPriceManager';

function csvEscape(value: unknown) {
  let str = String(value ?? '').replace(/[\r\n]+/g, ' ');
  if (/^[=+\-@\t]/.test(str)) str = "'" + str;
  return '"' + str.replace(/"/g, '""') + '"';
}
const pretty = (s: string | undefined | null) => (s || 'Pending').replaceAll('_', ' ');
const isCancelled = (o: StaffOrder) => o.status === 'cancelled' || o.checkout_status === 'cancelled';
function statusLabel(o: StaffOrder) {
  if (isCancelled(o)) return 'Cancelled';
  if (o.delivery_status === 'delivered') return 'Delivered';
  if (o.delivery_status === 'shipped') return 'Shipped';
  if (o.production_status === 'ready') return 'Ready';
  if (o.production_status === 'in_production') return 'In production';
  return 'New order';
}
function paymentLabel(o: StaffOrder) {
  if (isCancelled(o)) return 'Cancelled';
  if (o.checkout_status === 'paid' || o.checkout_status === 'cod_collected') return 'Paid';
  if (o.checkout_method === 'cod') return 'COD pending';
  if (o.checkout_method === 'qrph') return 'QR pending';
  if (o.payments.some(p => p.status === 'submitted')) return 'Verify proof';
  if (o.payments.some(p => p.status === 'verified')) return 'Verified';
  return 'Unpaid';
}
export default function AdminPage() {
  const [client] = useState<SupabaseClient | null>(() => supabaseBrowser());
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [rows, setRows] = useState<StaffOrder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchRows = useCallback(async (access: string) => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw Error(json.error || 'Cannot load orders.');
      setRows(json.orders || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Cannot load orders.'); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    const c = client;
    c.auth.getSession().then(({ data }) => {
      const access = data.session?.access_token || '';
      setToken(access); setLoading(false);
      if (access) void fetchRows(access);
    }).catch(() => setLoading(false));
    const { data: sub } = c.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || '');
      if (!session) setRows([]);
    });
    return () => sub.subscription.unsubscribe();
  }, [client, fetchRows]);

  async function signIn(e: FormEvent) {
    e.preventDefault(); if (!client) return;
    setError(''); setBusy(true);
    const { data, error: loginError } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (loginError) { setError(loginError.message); return; }
    setPassword('');
    if (data.session) { setToken(data.session.access_token); void fetchRows(data.session.access_token); }
  }
  async function signOut() { await client?.auth.signOut(); setToken(''); setRows([]); setSelectedId(''); setError(''); }
  const authToken = async () => {
    if (!client) throw Error('Supabase is not configured.');
    const { data } = await client.auth.getSession();
    const access = data.session?.access_token;
    if (!access) throw Error('Your session expired. Please sign in again.');
    return access;
  };
  async function refresh() { try { await fetchRows(await authToken()); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to refresh.'); } }
  async function save(action: string, extra: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!selectedId) return null;
    setBusy(true); setError(''); setMessage('');
    try {
      const access = await authToken();
      const res = await fetch('/api/admin/orders', { method: 'PATCH', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedId, action, ...extra }) });
      const json = await res.json();
      if (!res.ok) throw Error(json.error || 'Could not save order.');
      setMessage(action === 'cancel_checkout' ? 'Order cancelled successfully. The customer can see this on their tracking page.' : action === 'tracking_link' ? 'New private tracking link created. Copy it now.' : 'Order details updated successfully.');
      await fetchRows(access);
      return json;
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); return null; }
    finally { setBusy(false); }
  }
  const selected = rows.find(o => o.id === selectedId);
  const stats = useMemo(() => ({
    total: rows.length,
    waiting: rows.filter(o => !isCancelled(o) && o.checkout_method === 'cod' && o.checkout_status === 'cod_pending' && o.production_status === 'not_started').length,
    making: rows.filter(o => !isCancelled(o) && o.production_status === 'in_production').length,
    delivered: rows.filter(o => !isCancelled(o) && o.delivery_status === 'delivered').length,
    cancelled: rows.filter(isCancelled).length,
  }), [rows]);
  const visible = useMemo(() => rows.filter(o => {
    const matchStatus = filter === 'all' || (filter === 'cancelled' ? isCancelled(o) : filter === 'cod_pending' ? o.checkout_method === 'cod' && o.checkout_status === 'cod_pending' && !isCancelled(o) : filter === 'in_production' ? o.production_status === 'in_production' && !isCancelled(o) : filter === 'completed' ? o.delivery_status === 'delivered' && !isCancelled(o) : o.status === filter);
    return matchStatus && [o.code, o.contact_name, o.email, o.team_name, o.phone, o.garment].join(' ').toLowerCase().includes(search.trim().toLowerCase());
  }), [rows, filter, search]);
  function exportCsv() {
    const headings = ['Request', 'Date', 'Stage', 'Customer', 'Email', 'Phone', 'Garment', 'Pieces', 'Sizes', 'Sample Estimate', 'Final Price', 'Verified Payments', 'Production', 'Delivery', 'Delivery / Cancellation Notes'];
    const records = visible.map(o => [o.code, o.created_at, o.status, o.contact_name, o.email, o.phone, o.garment, o.quantity, JSON.stringify(o.sizes), o.estimated_total, o.quoted_total, o.payments.filter(p => p.status === 'verified').reduce((n, p) => n + Number(p.expected_amount), 0), o.production_status, o.delivery_status, o.delivery_reference]);
    const csv = [headings, ...records].map(record => record.map(csvEscape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ML-Sportswear-Orders.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (loading) return <div className="admin-wrap"><p className="loading-note">Checking staff session…</p></div>;
  if (!client) return <div className="admin-wrap"><section className="admin-login"><h1>Staff portal</h1><p>Supabase environment variables are missing.</p></section></div>;
  if (!token) return <div className="admin-wrap"><div className="admin-login"><span className="section-kicker">ML SPORTSWEAR STAFF</span><h1>Welcome back.</h1><p>Sign in to manage purchases, delivery addresses, payment status, and production progress.</p><form onSubmit={signIn}><label className="form-field"><span>Email</span><input type="email" required value={email} autoComplete="username" onChange={e => setEmail(e.target.value)}/></label><label className="form-field"><span>Password</span><div className="auth-input-wrap"><input type={showStaffPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}/><button type="button" className="password-visibility" aria-label={showStaffPassword ? 'Hide password' : 'Show password'} aria-pressed={showStaffPassword} onClick={() => setShowStaffPassword(s => !s)}>{showStaffPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>{error && <div className="request-error">{error}</div>}<button className="button button-dark next-button" disabled={busy}>Sign in <ArrowUpRight size={17}/></button></form><p className="admin-customer-link">Shopping for sportswear? <Link href="/login">Customer login</Link></p></div></div>;

  return <div className="admin-wrap v6-admin">
    <div className="v6-dashboard-hero"><div><span className="section-kicker">ML SPORTSWEAR / STAFF PORTAL</span><div className="v6-dashboard-title"><h1>Order control center<span>.</span></h1><span className="v6-live-dot"><Activity size={14}/> Staff dashboard</span></div><p>Stay on top of every customized garment, from new requests to delivery.</p></div><div className="v6-top-actions"><button type="button" className="small-button" disabled={busy} onClick={() => void refresh()}><RefreshCcw size={15}/> Refresh</button><button type="button" className="small-button" onClick={() => void signOut()}><LogOut size={15}/> Sign out</button></div></div>

    <div className="v6-metric-grid" aria-label="Order overview">
      <div className="v6-metric"><div className="v6-metric-top"><span>All orders</span><span className="v6-metric-icon"><Inbox size={18}/></span></div><strong>{stats.total}</strong><small>Orders in your database</small></div>
      <div className="v6-metric"><div className="v6-metric-top"><span>COD to prepare</span><span className="v6-metric-icon v6-metric-icon-warm"><Package size={18}/></span></div><strong>{stats.waiting}</strong><small>Awaiting production</small></div>
      <div className="v6-metric"><div className="v6-metric-top"><span>In production</span><span className="v6-metric-icon v6-metric-icon-purple"><Truck size={18}/></span></div><strong>{stats.making}</strong><small>Garments being made</small></div>
      <div className="v6-metric"><div className="v6-metric-top"><span>Delivered</span><span className="v6-metric-icon v6-metric-icon-good"><CheckCircle2 size={18}/></span></div><strong>{stats.delivered}</strong><small>{stats.cancelled} cancelled order{stats.cancelled === 1 ? '' : 's'}</small></div>
    </div>

    <AdminPriceManager token={token}/>
    <section className="v6-list-panel" aria-label="Orders">
      <div className="v6-list-title"><div><span className="section-kicker">YOUR ORDERS</span><h2>Manage customer orders</h2><p>Open an order to update delivery, check designs, or cancel an eligible COD order.</p></div><button type="button" className="small-button" disabled={!visible.length} onClick={exportCsv}><Download size={15}/> Export CSV</button></div>
      <div className="v6-filter-pills" role="group" aria-label="Quick order filters">
        {[['all', `All orders (${stats.total})`], ['cod_pending', `COD pending (${stats.waiting})`], ['in_production', 'In production'], ['cancelled', `Cancelled (${stats.cancelled})`]].map(([key, label]) => <button key={key} type="button" className={`v6-filter-pill ${filter === key ? 'v6-active' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>
      <div className="admin-toolbar v6-toolbar"><div className="v6-search"><Search size={17}/><input aria-label="Search orders" placeholder="Search by customer, order ID, or garment" value={search} onChange={e => setSearch(e.target.value)}/></div><select aria-label="Filter orders by status" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option><option value="cod_pending">COD pending</option>{['new', 'reviewing', 'quoted', 'approved', 'in_production', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{pretty(s)}</option>)}</select><span className="v6-results">{visible.length} result{visible.length === 1 ? '' : 's'}</span></div>
      {error && <div className="request-error" role="alert">{error}</div>}
      {message && <div className="workflow-success" role="status"><CheckCircle2 size={16}/> {message}</div>}
      <div className="admin-table-scroll v6-table-wrap"><table className="admin-table v6-orders-table"><thead><tr><th>Order reference</th><th>Customer</th><th>Items</th><th>Amount</th><th>Order status</th><th>Payment</th><th>Action</th></tr></thead><tbody>{visible.map(o => <tr key={o.id} className={selectedId === o.id ? 'v6-selected-row' : ''}>
        <td><strong>{o.code}</strong><small>{new Date(o.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</small></td>
        <td><div className="v6-customer-cell"><span className="v6-avatar">{(o.contact_name || '?').trim().slice(0, 1).toUpperCase()}</span><span><strong>{o.contact_name}</strong><small>{o.email}</small></span></div></td>
        <td><strong>{GARMENTS.find(g => g.id === o.garment)?.label || o.garment}</strong><small>{o.quantity} piece{o.quantity === 1 ? '' : 's'} · {o.team_name || 'Custom order'}</small></td>
        <td><strong>{money(Number(o.quoted_total ?? o.estimated_total))}</strong><small>{o.checkout_method === 'cod' ? 'Cash on Delivery' : o.checkout_method === 'qrph' ? 'GCash / QR Ph' : 'Legacy quote'}</small></td>
        <td><span className={`v6-pill ${isCancelled(o) ? 'v6-pill-danger' : o.delivery_status === 'delivered' ? 'v6-pill-good' : 'v6-pill-purple'}`}>{statusLabel(o)}</span></td>
        <td><span className={`v6-payment-label ${paymentLabel(o) === 'Paid' || paymentLabel(o) === 'Verified' ? 'v6-payment-good' : ''}`}>{paymentLabel(o)}</span></td>
        <td><button type="button" className={`v6-manage-button ${selectedId === o.id ? 'v6-current' : ''}`} aria-pressed={selectedId === o.id} onClick={() => {setSelectedId(selectedId === o.id ? '' : o.id); setError(''); setMessage('');}}><Settings2 size={15}/>{selectedId === o.id ? 'Selected' : 'Manage'}<ChevronRight size={15}/></button></td>
      </tr>)}</tbody></table>{!visible.length && <div className="admin-empty">{busy ? 'Loading orders…' : 'No orders match your search.'}</div>}</div>
    </section>

    {selected && (selected.checkout_method ? <CheckoutOrderPanel order={selected} busy={busy} save={save} onClose={() => {setSelectedId(''); setMessage('');}}/> : <OrderWorkflowPanel order={selected} busy={busy} save={save} onClose={() => {setSelectedId(''); setMessage('');}}/>)}
    <div className="v6-admin-footer"><ShieldCheck size={17}/> Authorized staff only. Cancelling an unpaid COD order keeps its history and stops fulfillment. Online payment refunds must be handled separately.</div>
  </div>;
}
