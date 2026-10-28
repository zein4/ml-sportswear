'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CircleUserRound, UserRoundPlus } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
export function CustomerNav(){
  const [signed,setSigned]=useState(false);
  useEffect(()=>{
    const client=supabaseBrowser();if(!client)return;
    let alive=true;
    void client.auth.getSession().then(({data})=>{if(alive)setSigned(!!data.session);});
    const {data}=client.auth.onAuthStateChange((_event,session)=>{if(alive)setSigned(!!session);});
    return ()=>{alive=false;data.subscription.unsubscribe();};
  },[]);
  return <div className="v7-customer-nav">
    <Link href={signed?'/account':'/login'} className="customer-header-link" aria-label={signed?'My account':'Customer login'}><CircleUserRound size={17}/><span>{signed?'My account':'Log in'}</span></Link>
    {!signed&&<Link href="/signup" className="v7-nav-signup"><UserRoundPlus size={15}/> Sign up</Link>}
  </div>;
}
