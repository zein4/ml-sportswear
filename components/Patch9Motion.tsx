'use client';
import { useEffect } from 'react';
export function Patch9Motion(){
  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const targets=[...document.querySelectorAll<HTMLElement>('[data-ml9-reveal]')];
    const obs=new IntersectionObserver((entries)=>{
      for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('ml9-visible');obs.unobserve(entry.target);}}
    },{rootMargin:'0px 0px -45px 0px',threshold:.08});
    targets.forEach(el=>{obs.observe(el);});
    document.documentElement.classList.add('ml9-motion-on');
    return ()=>{obs.disconnect();document.documentElement.classList.remove('ml9-motion-on');};
  },[]);
  return null;
}
