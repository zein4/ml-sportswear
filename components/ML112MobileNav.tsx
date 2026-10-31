'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
const nav=[['Home','/'],['Shop','/collection'],['Customize','/customize'],['Collections','/collection#featured-designs'],['Track Order','/track'],['About','/#how-it-works'],['Contact','/#contact']];
export function ML112MobileNav(){
  const [open,setOpen]=useState(false);
  return <div className="ml112-mobile-wrap"><button type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="ml112-menu-button">{open?<X size={22}/>:<Menu size={22}/>}</button>
  {open&&<nav className="ml112-mobile-menu" aria-label="Mobile navigation">{nav.map(([name,path])=><Link key={path+name} href={path} onClick={()=>setOpen(false)}>{name}</Link>)}<Link href="/login" onClick={()=>setOpen(false)}>Customer login</Link></nav>}
  </div>;
}
