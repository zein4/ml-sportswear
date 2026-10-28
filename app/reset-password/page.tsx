'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
export default function ResetPassword(){
  const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
  const [show,setShow]=useState(false);const [allowed,setAllowed]=useState(false);
  const [error,setError]=useState('');const [success,setSuccess]=useState(false);const [busy,setBusy]=useState(false);
  useEffect(()=>{
    const client=supabaseBrowser();if(!client)return;
    const hash=new URLSearchParams(window.location.hash.slice(1));
    if(hash.get('type')==='recovery')setAllowed(true);
    if(hash.get('error_description'))setError(hash.get('error_description')||'The recovery link is invalid.');
    const {data}=client.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setAllowed(true);});
    return ()=>data.subscription.unsubscribe();
  },[]);
  async function update(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');if(password.length<8){setError('Use at least 8 characters.');return;}
    if(password!==confirm){setError('Passwords do not match.');return;}
    if(!allowed){setError('Open the password reset link from your email first.');return;}
    setBusy(true);const client=supabaseBrowser();const {error:changeError}=client?await client.auth.updateUser({password}):{error:{message:'Supabase is not configured.'}};
    setBusy(false);if(changeError){setError(changeError.message);return;}
    setSuccess(true);await client?.auth.signOut();
  }
  return <div className="password-page"><div className="customer-auth-card password-card"><span className="section-kicker">ML SPORTSWEAR / CUSTOMER ACCESS</span><h1>Choose a new password.</h1><p>Use a new password for your customer account.</p>
    {success?<><div role="status" className="auth-message">Password updated successfully.</div><Link href="/login" className="button button-dark auth-submit">Return to login</Link></>:<form className="auth-form" onSubmit={update}>
      <label className="form-field"><span>New password</span><div className="auth-input-wrap"><LockKeyhole size={17}/><input type={show?'text':'password'} autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="password-visibility" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(s=>!s)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      <label className="form-field"><span>Confirm new password</span><div className="auth-input-wrap"><LockKeyhole size={17}/><input type={show?'text':'password'} autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div></label>
      {error&&<div role="alert" className="request-error">{error}</div>}
      {!allowed&&<p className="auth-note">Open the recovery link in your email to activate this form. <Link href="/forgot-password">Request a new link</Link></p>}
      <button type="submit" className="button button-dark auth-submit" disabled={!allowed||busy}>{busy?'Updating…':'Update password'}</button>
    </form>}<div className="auth-safety"><ShieldCheck size={15}/> For your security, this link can only be used for password recovery.</div></div></div>;
}
