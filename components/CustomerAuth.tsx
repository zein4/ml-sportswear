'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Shirt, UserRound, Smartphone, ChevronLeft, Sparkles, Check, BadgeCheck } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Mode = 'login'|'signup'|'forgot';
type Method = 'email'|'phone';
function GoogleMark(){return <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 6.51 13.22 2.56l7.98 6.19C14.43 10.47 19.03 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.02 46.98 31.87 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
function phPhone(value:string){
  const digits=value.replace(/\D/g,'');
  if(digits.startsWith('09') && digits.length===11)return '+63'+digits.substring(1);
  if(digits.startsWith('639') && digits.length===12)return '+'+digits;
  if(digits.startsWith('9') && digits.length===10)return '+63'+digits;
  if(value.trim().startsWith('+63') && /^\+639\d{9}$/.test(value.trim()))return value.trim();
  return '';
}
function nextRoute(){
  if(typeof window==='undefined')return '/account';
  const next=new URLSearchParams(window.location.search).get('next');
  return next && /^\/(account|customize)(?:\?|\/|$)/.test(next) && !next.startsWith('//')?next:'/account';
}
export function CustomerAuth({mode}: {mode:Mode}) {
  const router=useRouter();
  const [method,setMethod]=useState<Method>('email');
  const [fullName,setFullName]=useState('');
  const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');
  const [otp,setOtp]=useState('');
  const [otpSent,setOtpSent]=useState(false);
  const [password,setPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [accepted,setAccepted]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('');
  const client=supabaseBrowser();
  useEffect(()=>{
    if(!client)return;
    client.auth.getUser().then(({data})=>{if(data.user && mode!=='forgot')router.replace('/account');}).catch(()=>{});
  },[client,router,mode]);
  function switchMethod(next:Method){setMethod(next);setError('');setInfo('');setOtp('');setOtpSent(false);}
  async function googleSignIn(){
    if(!client){setError('Customer authentication is not configured.');return;}
    if(mode==='signup'&&!accepted){setError('Please read and accept the Terms and Privacy Notice before creating an account.');return;}
    setError('');setInfo('');setBusy(true);
    try{
      const {error:authError}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}${nextRoute()}`,queryParams:{prompt:'select_account'}}});
      if(authError)throw authError;
    }catch(e){setError(e instanceof Error?e.message:'Google sign-in is unavailable. Check the Supabase Google provider configuration.');setBusy(false);}
  }
  async function sendSms(){
    if(!client){setError('Customer authentication is not configured.');return;}
    if(mode==='signup'&&!accepted){setError('Please accept the Terms and Privacy Notice.');return;}
    const international=phPhone(phone);
    if(!international){setError('Enter a valid Philippine mobile number, such as 09171234567.');return;}
    setBusy(true);setError('');setInfo('');
    try{
      const {error:authError}=await client.auth.signInWithOtp({phone:international,options:{data:mode==='signup'?{full_name:fullName.trim()}:undefined}});
      if(authError)throw authError;
      setOtpSent(true);setInfo('A verification code was requested for your mobile number. Enter the SMS code below.');
    }catch(e){setError(e instanceof Error?e.message:'Could not send SMS. The shop may need to configure an SMS provider.');}
    finally{setBusy(false);}
  }
  async function verifySms(){
    if(!client)return;
    const normalized=phPhone(phone);
    if(!normalized || !/^\d{6}$/.test(otp.trim())){setError('Enter the six-digit SMS code.');return;}
    setBusy(true);setError('');
    try{
      const {error:authError}=await client.auth.verifyOtp({phone:normalized,token:otp.trim(),type:'sms'});
      if(authError)throw authError;
      router.replace(nextRoute());router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Code invalid or expired. Please request another.');}
    finally{setBusy(false);}
  }
  async function handleSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setInfo('');
    if(!client){setError('Supabase is not configured. Please contact the shop.');return;}
    if(mode==='signup' && !accepted){setError('Please accept the Terms and Privacy Notice.');return;}
    if(mode==='signup' && password!==confirmPassword){setError('Passwords do not match.');return;}
    if(mode==='signup' && password.length<8){setError('Use a password of at least 8 characters.');return;}
    setBusy(true);
    try{
      if(mode==='signup'){
        const {data,error:authError}=await client.auth.signUp({email:email.trim(),password,
          options:{data:{full_name:fullName.trim()},emailRedirectTo:`${window.location.origin}/account`}});
        if(authError)throw authError;
        if(data.session){router.replace('/account');router.refresh();}
        else setInfo('Check your email for the confirmation link before signing in.');
      }else if(mode==='login'){
        const {error:authError}=await client.auth.signInWithPassword({email:email.trim(),password});
        if(authError)throw authError;
        router.replace(nextRoute());router.refresh();
      }else{
        const {error:authError}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`});
        if(authError)throw authError;
        setInfo('If an account exists for this email, a password reset link has been sent.');
      }
    }catch(e){setError(e instanceof Error?e.message:'Could not complete this request.');}
    finally{setBusy(false);}
  }
  return <div className="customer-auth-wrap v7-auth-wrap"><div className="customer-auth-shell v7-auth-shell">
    <aside className="customer-auth-aside v7-auth-aside"><div className="auth-aside-inner">
      <span className="v7-auth-eyebrow"><Sparkles size={15}/> ML SPORTSWEAR MEMBER CLUB</span>
      <div className="v7-auth-glow"><div className="v7-hero-label">MADE FOR YOUR TEAM</div><Shirt size={119} strokeWidth={0.8}/><span className="v7-auth-small-label">CUSTOM EDITION / 2026</span></div>
      <h2>More than<br/>a jersey.<br/><em>Your story.</em></h2>
      <p>Create something personal, save your orders and track every delivery in one place.</p>
      <div className="v7-auth-benefits"><span><Check size={16}/> Save your custom orders</span><span><Check size={16}/> Track from production to delivery</span><span><Check size={16}/> Guest browsing stays available</span></div>
      <div className="v7-auth-aside-foot"><span>DESIGN YOUR IDENTITY</span><span>ML / PH</span></div>
    </div></aside>
    <section className="customer-auth-card v7-auth-card">
      <Link href="/" className="v7-auth-back"><ChevronLeft size={15}/> Back to shop</Link>
      <div className="auth-card-top"><span className="section-kicker">YOUR ML ACCOUNT</span><BadgeCheck size={21}/></div>
      <h1>{mode==='login'?'Welcome back!':mode==='signup'?'Join the team.':'Reset your password.'}</h1>
      <p>{mode==='login'?'Log in to manage your orders and find your next custom look.':mode==='signup'?'Create your customer account in just a few steps.':'Enter your email and we’ll send a reset link.'}</p>
      {mode!=='forgot'&&<div className="auth-tabs v7-auth-tabs"><Link className={mode==='login'?'active':''} href="/login">Log in</Link><Link className={mode==='signup'?'active':''} href="/signup">Sign up</Link></div>}
      {mode!=='forgot'&&<>
        <button type="button" className="v7-google-button" onClick={()=>void googleSignIn()} disabled={busy}><GoogleMark/><span>Continue with Google</span><ArrowRight size={16}/></button>
        <div className="v7-auth-divider"><span>or continue with</span></div>
        <div className="v7-auth-methods" role="group" aria-label="Sign-in method">
          <button type="button" className={method==='email'?'selected':''} onClick={()=>switchMethod('email')}><Mail size={16}/> Email</button>
          <button type="button" className={method==='phone'?'selected':''} onClick={()=>switchMethod('phone')}><Smartphone size={16}/> Phone number</button>
        </div>
      </>}
      {mode!=='forgot'&&method==='phone'?<div className="v7-phone-flow">
        {mode==='signup'&&<label className="form-field"><span>Full name</span><div className="auth-input-wrap"><UserRound size={17}/><input value={fullName} onChange={e=>setFullName(e.target.value)} maxLength={120} autoComplete="name" placeholder="Your full name"/></div></label>}
        <label className="form-field"><span>Mobile number</span><div className="auth-input-wrap"><Smartphone size={17}/><input type="tel" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" value={phone} disabled={otpSent} onChange={e=>setPhone(e.target.value)}/></div></label>
        {otpSent&&<label className="form-field"><span>6-digit SMS code</span><div className="auth-input-wrap"><LockKeyhole size={17}/><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}/></div></label>}
        {mode==='signup'&&<label className="v7-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <Link href="/terms" target="_blank">Terms</Link> and have read the <Link href="/privacy" target="_blank">Privacy Notice</Link>.</span></label>}
        {error&&<div className="request-error" role="alert">{error}</div>}
        {info&&<div className="auth-message" role="status"><CheckCircle2 size={17}/>{info}</div>}
        <button type="button" className="button button-dark auth-submit" disabled={busy} onClick={()=>void (otpSent?verifySms():sendSms())}>{busy?'Please wait…':otpSent?'Verify & continue':'Send SMS code'}<ArrowRight size={17}/></button>
        {otpSent&&<button type="button" className="v7-reset-phone" onClick={()=>{setOtpSent(false);setOtp('');setError('');setInfo('');}}>Change mobile number</button>}
        <p className="v7-otp-footnote">SMS sign-in requires the shop to enable phone authentication and an SMS provider in Supabase. Standard SMS charges may apply.</p>
      </div>:<form className="auth-form" onSubmit={e=>void handleSubmit(e)}>
        {mode==='signup'&&<label className="form-field"><span>Full name</span><div className="auth-input-wrap"><UserRound size={17}/><input required autoComplete="name" maxLength={120} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name"/></div></label>}
        <label className="form-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17}/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
        {mode!=='forgot'&&<label className="form-field"><span>Password</span><div className="auth-input-wrap"><LockKeyhole size={17}/><input required minLength={mode==='signup'?8:1} type={showPassword?'text':'password'} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" className="password-visibility" aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} onClick={()=>setShowPassword(s=>!s)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
        {mode==='signup'&&<label className="form-field"><span>Confirm password</span><div className="auth-input-wrap"><LockKeyhole size={17}/><input required type={showPassword?'text':'password'} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter password again"/></div></label>}
        {mode==='login'&&<div className="auth-links"><Link href="/forgot-password">Forgot password?</Link></div>}
        {mode==='signup'&&<label className="v7-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <Link href="/terms" target="_blank">Terms</Link> and have read the <Link href="/privacy" target="_blank">Privacy Notice</Link>.</span></label>}
        {error&&<div className="request-error" role="alert">{error}</div>}
        {info&&<div className="auth-message" role="status"><CheckCircle2 size={18}/>{info}</div>}
        <button className="button button-dark auth-submit" type="submit" disabled={busy||!!info}>{busy?'Please wait…':mode==='login'?'Log in':mode==='signup'?'Create account':'Send reset link'}<ArrowRight size={17}/></button>
      </form>}
      <p className="auth-card-bottom">{mode==='login'?<>New to ML Sportswear? <Link href="/signup">Create account</Link></>:mode==='signup'?<>Already a member? <Link href="/login">Log in</Link></>:<Link href="/login">Back to login</Link>}</p>
      <p className="v7-auth-legal">By continuing, you acknowledge our <Link href="/privacy">Privacy Notice</Link> and <Link href="/terms">Terms</Link>.</p>
      <div className="v7-staff-access" aria-label="Staff and administrator access">
        <div className="v7-staff-access-info">
          <span className="v7-staff-access-icon"><ShieldCheck size={19} aria-hidden="true" /></span>
          <div>
            <strong>ML Sportswear staff or admin?</strong>
            <p>Use your authorized staff account. Customer sign-up does not grant admin access.</p>
          </div>
        </div>
        <Link href="/admin" className="v7-staff-access-button">Staff login <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>
  </div></div>;
}
