'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
export default function PaymentReturn(){
 const [back,setBack]=useState('');
 useEffect(()=>{try{const info=sessionStorage.getItem('ml-checkout-order');if(info){const {code,token}=JSON.parse(info);if(typeof code==='string'&&typeof token==='string')setBack(`/track#code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`);}}catch{}},[]);
 return <main className="success-wrap"><h1>Payment update</h1><p>If you completed your GCash / QR Ph payment, the order will be marked paid after the payment provider confirms it. This can take a moment. A redirect alone is not payment confirmation.</p>{back?<Link href={back} className="button button-dark">Check order status</Link>:<p>Open the private order-tracking link saved after checkout to check your payment.</p>}</main>;
}
