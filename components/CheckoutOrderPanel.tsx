'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2, X,Truck} from 'lucide-react';
import type {StaffOrder} from '@/lib/admin-types';
import {money} from '@/lib/catalog';
type Action=(action:string,extra:Record<string,unknown>)=>Promise<Record<string,unknown>|null>;
export function CheckoutOrderPanel({order,busy,save,onClose}:{order:StaffOrder;busy:boolean;save:Action;onClose:()=>void}){
 const [production,setProduction]=useState(order.production_status),[delivery,setDelivery]=useState(order.delivery_status),[details,setDetails]=useState(order.delivery_reference||''),[collected,setCollected]=useState(false);
 useEffect(()=>{setProduction(order.production_status);setDelivery(order.delivery_status);setDetails(order.delivery_reference||'');setCollected(false);},[order.id,order.production_status,order.delivery_status,order.delivery_reference]);
 const cod=order.checkout_method==='cod',paid=order.checkout_status==='paid'||order.checkout_status==='cod_collected';
 return <section className="workflow-admin"><div className="workflow-admin-header"><div><span className="section-kicker">FAST CHECKOUT / ORDER</span><h2>{order.code}</h2><p>{order.contact_name} · {order.phone}</p></div><button className="small-button" onClick={onClose}><X size={15}/> Close</button></div>
 <div className="workflow-admin-grid"><div className="customer-card"><h3><Truck size={19}/> Delivery & payment</h3><p><strong>{cod?'Cash on Delivery':'GCash / QR Ph'}</strong> · {money(Number(order.quoted_total||order.estimated_total))}</p><p>Payment status: <strong>{order.checkout_status?.replaceAll('_',' ')}</strong></p><p>Deliver to: {order.delivery_address}</p>{!cod&&!paid&&<p className="hint">Waiting for PayMongo payment confirmation. Staff must not mark this as paid manually.</p>}</div>
 <div className="customer-card"><h3><CheckCircle2 size={19}/> Production & delivery updates</h3><div className="workflow-form-grid"><label>Production<select value={production} onChange={e=>setProduction(e.target.value)}><option value="not_started">Not started</option><option value="in_production">In production</option><option value="ready">Ready</option></select></label><label>Delivery<select value={delivery} onChange={e=>setDelivery(e.target.value)}><option value="not_ready">Not ready</option><option value="ready_for_pickup">Ready for pickup</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></label></div>
 <label>Courier, delivery, or pickup details<input value={details} maxLength={160} onChange={e=>setDetails(e.target.value)}/></label>
 {cod&&delivery==='delivered'&&!paid&&<label className="cod-collection"><input type="checkbox" checked={collected} onChange={e=>setCollected(e.target.checked)}/> Cash actually collected on delivery</label>}
 <button type="button" className="button button-dark" disabled={busy||(!cod&&!paid)||(cod&&delivery==='delivered'&&!paid&&!collected)} onClick={()=>void save('fulfillment_checkout',{production_status:production,delivery_status:delivery,delivery_reference:details,cod_collected:collected})}>Save delivery progress</button>
 <p className="hint">No quotation approvals or receipt uploads. COD collection is recorded when the package is delivered; QR payments are confirmed by the provider.</p></div></div></section>;
}
