'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, ImagePlus, Info, Minus, Plus, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { GARMENTS, PALETTE, SIZES, initialSizes, type GarmentId, type Size, type SizeCounts, money } from '@/lib/catalog';
import { clamp, initialArtworkForGarment, type ArtworkKey, type ArtworkPosition } from '@/lib/artwork';
import { GarmentPreview } from '@/components/GarmentPreview';

const starter = { garment: 'sando' as GarmentId, color: '#3157c9', accentColor: '#f3f1e9', printColor: '#f3f1e9', playerName: 'DELA CRUZ', playerNumber: '10', teamName: 'YOUR TEAM' };

function FilePicker({ title, file, onFile, description }: { title: string; file: File | null; onFile: (f: File|null) => void; description: string }) {
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const check = (f?: File) => {
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) { setError('Please choose a PNG, JPG, or WebP image.'); return; }
    if (f.size > 4*1024*1024) { setError('File must be 4 MB or less.'); return; }
    setError(''); onFile(f);
  };
  return <div className="upload-box">
    <div className="upload-identity"><span className="upload-icon"><ImagePlus size={20}/></span><div><strong>{title}</strong><small>{description}</small></div></div>
    <input ref={fileInput} className="file-input-hidden" type="file" accept="image/png,image/jpeg,image/webp" aria-label={title} onChange={e => { check(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }}/>
    {file ? <div className="file-pill"><span title={file.name}>{file.name}</span><button type="button" onClick={() => onFile(null)} aria-label={`Remove ${title}`}><X size={15}/></button></div> : null}
    <button type="button" className="upload-choose" onClick={() => fileInput.current?.click()}>{file ? 'Replace image' : 'Choose image'}</button>
    {error && <div className="field-error">{error}</div>}
  </div>;
}

export default function CustomizePage() {
  const [garment, setGarment] = useState<GarmentId>(starter.garment);
  const [color, setColor] = useState(starter.color);
  const [accentColor, setAccentColor] = useState(starter.accentColor);
  const [printColor, setPrintColor] = useState(starter.printColor);
  const [playerName, setPlayerName] = useState(starter.playerName);
  const [playerNumber, setPlayerNumber] = useState(starter.playerNumber);
  const [teamName, setTeamName] = useState(starter.teamName);
  const [sizes, setSizes] = useState<SizeCounts>(initialSizes);
  const [roster, setRoster] = useState('');
  const [notes, setNotes] = useState('');
  const [frontFile, setFrontFile] = useState<File|null>(null);
  const [backFile, setBackFile] = useState<File|null>(null);
  const [frontImage, setFrontImage] = useState<string|null>(null);
  const [backImage, setBackImage] = useState<string|null>(null);
  const [view, setView] = useState<'front'|'back'>('front');
  const [artworkLayout, setArtworkLayout] = useState(() => initialArtworkForGarment('sando'));
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkKey | null>('teamName');
  const [review, setReview] = useState(false);
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [website, setWebsite] = useState('');
  const [checkoutMethod,setCheckoutMethod]=useState<'cod'|'qrph'>('cod');
  const [deliveryAddress,setDeliveryAddress]=useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('garment');
    if (GARMENTS.some(g => g.id === param)) {
      setGarment(param as GarmentId);
      setArtworkLayout(initialArtworkForGarment(param as GarmentId));
    }
  }, []);
  useEffect(() => {
    if (!frontFile) { setFrontImage(null); return; }
    const url = URL.createObjectURL(frontFile); setFrontImage(url);
    return () => URL.revokeObjectURL(url);
  }, [frontFile]);
  useEffect(() => {
    if (!backFile) { setBackImage(null); return; }
    const url = URL.createObjectURL(backFile); setBackImage(url);
    return () => URL.revokeObjectURL(url);
  }, [backFile]);

  const selected = GARMENTS.find(x => x.id === garment)!;
  const totalPieces = useMemo(() => Object.values(sizes).reduce((a,b) => a+b, 0), [sizes]);
  const estimate = selected.price * totalPieces;
  const updateSize = (size: Size, diff: number) => setSizes(prev => ({...prev, [size]: Math.max(0, Math.min(100, prev[size] + diff))}));
  const preview = { garment, color, accentColor, printColor, playerName, playerNumber, teamName, frontImage, backImage, view };
  const frontLayers: {key:ArtworkKey;label:string}[] = [
    ...(teamName.trim() ? [{key:'teamName' as ArtworkKey,label:'Team name'}] : []),
    ...(frontImage ? [{key:'frontLogo' as ArtworkKey,label:'Front logo'}] : []),
  ];
  const backLayers: {key:ArtworkKey;label:string}[] = [
    ...(playerName.trim() ? [{key:'playerName' as ArtworkKey,label:'Player name'}] : []),
    ...(playerNumber.trim() ? [{key:'playerNumber' as ArtworkKey,label:'Jersey number'}] : []),
    ...(backImage ? [{key:'backLogo' as ArtworkKey,label:'Back logo'}] : []),
  ];
  const visibleLayers = view === 'front' ? frontLayers : backLayers;
  const activeLayer = visibleLayers.find(layer => layer.key === selectedArtwork)?.key || null;
  const changeArtwork = (key: ArtworkKey, next: ArtworkPosition) => {
    setArtworkLayout(prev => ({ ...prev, [key]: next }));
  };
  const nudgeArtwork = (dx: number, dy: number, scaleDelta = 0) => {
    if (!activeLayer) return;
    const curr = artworkLayout[activeLayer];
    changeArtwork(activeLayer, {
      x: clamp(curr.x + dx, 55, 265),
      y: clamp(curr.y + dy, 38, 282),
      scale: clamp(Math.round((curr.scale + scaleDelta)*100)/100, 0.35, 2.4),
    });
  };
  const changeView = (side: 'front' | 'back') => {
    setView(side);
    setSelectedArtwork(side === 'front' ? (frontImage ? 'frontLogo' : 'teamName') : (backImage ? 'backLogo' : 'playerNumber'));
  };
  const changeGarment = (g: GarmentId) => {
    setGarment(g);
    setArtworkLayout(initialArtworkForGarment(g));
    setSelectedArtwork(view === 'front' ? 'teamName' : 'playerNumber');
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (totalPieces < 1 || totalPieces > 100) { setError('Please choose 1 to 100 items.'); return; }
    setSending(true); setError('');
    try {
      const payload = { garment, color, accentColor, printColor, playerName, playerNumber, teamName, sizes, roster, notes, contactName, email, phone, organization, website, artworkLayout, checkoutMethod, deliveryAddress };
      const fd = new FormData(); fd.append('payload', JSON.stringify(payload));
      if (frontFile) fd.append('frontDesign', frontFile);
      if (backFile) fd.append('backDesign', backFile);
      const response = await fetch('/api/orders', { method: 'POST', body: fd });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not submit your request.');
      try{sessionStorage.setItem('ml-checkout-order',JSON.stringify({code:result.code,token:result.trackingToken,method:checkoutMethod}));}catch{}
      if (result.checkoutUrl) window.location.assign(result.checkoutUrl);
      else window.location.assign(`/success#code=${encodeURIComponent(result.code)}&token=${encodeURIComponent(result.trackingToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSending(false);
    }
  };

  return <div className="customizer-wrap">
    <div className="customizer-head"><div><span className="section-kicker">ML DESIGN STUDIO / CUSTOMIZER</span><h1>Create something <em>yours.</em></h1><p>Make your design, choose GCash QR or Cash on Delivery, and place your order.</p></div><div className="step-counter">{review ? '02' : '01'} <span>/ 02</span><small>{review ? 'CHECKOUT' : 'DESIGN YOUR KIT'}</small></div></div>
    <div className="studio-progress"><span className="progress-active"/><span className={review ? 'progress-active' : ''}/></div>
    <div className="studio-layout">
      <div className="studio-controls">
        {!review ? <>
          <section className="control-section"><div className="control-title"><span className="step-num">01</span><div><h2>Choose your garment</h2><p>Start with the piece you want to customize.</p></div></div>
            <div className="garment-options">{GARMENTS.map(g => <button key={g.id} type="button" className={'garment-option' + (g.id===garment?' selected':'')} onClick={() => changeGarment(g.id)}><span className="option-number">{g.code}</span><strong>{g.label}</strong><small>{g.descriptor}</small>{g.id===garment && <Check size={16} className="selected-check"/>}</button>)}</div>
          </section>
          <section className="control-section"><div className="control-title"><span className="step-num">02</span><div><h2>Find your colors</h2><p>Pick the base color and finishing details.</p></div></div>
            <ColorField title="Main garment color" value={color} onChange={setColor}/>
            <ColorField title="Trim / accent color" value={accentColor} onChange={setAccentColor}/>
            <ColorField title="Printed text color" value={printColor} onChange={setPrintColor}/>
          </section>
          <section className="control-section"><div className="control-title"><span className="step-num">03</span><div><h2>Make it personal</h2><p>Add graphics, your team name and player details.</p></div></div>
            <div className="form-grid"><label className="form-field"><span>Team / group name</span><input maxLength={32} placeholder="Example: ML WARRIORS" value={teamName} onChange={e => setTeamName(e.target.value)} /></label><label className="form-field"><span>Player name</span><input maxLength={24} placeholder="Example: DELA CRUZ" value={playerName} onChange={e => setPlayerName(e.target.value)} /></label><label className="form-field"><span>Jersey number</span><input maxLength={4} inputMode="numeric" placeholder="10" value={playerNumber} onChange={e => setPlayerNumber(e.target.value.replace(/\D/g,''))}/></label></div>
            <div className="upload-grid"><FilePicker title="Front design" description="Logo or artwork · PNG/JPG/WebP" file={frontFile} onFile={file => { setFrontFile(file); if (file) { changeView('front'); setSelectedArtwork('frontLogo'); } }}/><FilePicker title="Back design" description="Optional additional logo/artwork" file={backFile} onFile={file => { setBackFile(file); if (file) { changeView('back'); setSelectedArtwork('backLogo'); } }}/></div>
            <div className="hint"><Info size={16}/> Drag artwork on the live preview. Select it to resize using the bottom-right handle. You can also fine-tune placement with the editor buttons.</div>
          </section>
          <section className="control-section"><div className="control-title"><span className="step-num">04</span><div><h2>Sizes & quantity</h2><p>Add the number of pieces needed in each size.</p></div></div>
            <div className="sizes-grid">{SIZES.map(size => <div className="size-counter" key={size}><span>{size}</span><div><button type="button" onClick={() => updateSize(size,-1)} aria-label={`Remove one ${size}`}><Minus size={14}/></button><strong>{sizes[size]}</strong><button type="button" onClick={() => updateSize(size,1)} aria-label={`Add one ${size}`}><Plus size={14}/></button></div></div>)}</div>
            <label className="form-field" style={{marginTop:20}}><span>Team roster <small>(optional)</small></span><textarea rows={3} maxLength={4500} placeholder={'For different names and numbers, add one player per line.\nExample: DELA CRUZ - 10 - M\nSANTOS - 21 - L'} value={roster} onChange={e => setRoster(e.target.value)}/></label>
            <label className="form-field" style={{marginTop:14}}><span>Special instructions <small>(optional)</small></span><textarea rows={3} maxLength={1500} placeholder="Tell us about deadlines, logo positioning, or other requests." value={notes} onChange={e=>setNotes(e.target.value)}/></label>
          </section>
          <button type="button" className="button button-dark next-button" disabled={totalPieces<1||totalPieces>100} onClick={() => { setError(''); setReview(true); window.scrollTo({top:0, behavior:'smooth'}); }}>Continue to checkout <ArrowRight size={18}/></button>
        </> : <section className="control-section review-section"><button type="button" className="back-link" onClick={() => {setReview(false); setError('');}}><ArrowLeft size={16}/> Back to customization</button>
          <div className="control-title"><span className="step-num">05</span><div><h2>Checkout</h2><p>Add your delivery address and choose how to pay.</p></div></div>
          <div className="review-details"><div><span>Garment</span><strong>{selected.label}</strong></div><div><span>Main color</span><strong>{PALETTE.find(c=>c.hex===color)?.name}</strong></div><div><span>Total pieces</span><strong>{totalPieces}</strong></div><div><span>Item subtotal (confirm shop rates)</span><strong>{money(estimate)}</strong></div></div>
          <form onSubmit={submit} className="contact-form"><label className="form-field"><span>Full name *</span><input required minLength={2} maxLength={120} placeholder="Your full name" value={contactName} onChange={e => setContactName(e.target.value)}/></label>
            <div className="form-grid"><label className="form-field"><span>Email address *</span><input required type="email" maxLength={200} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label><label className="form-field"><span>Phone number *</span><input required type="tel" minLength={7} maxLength={30} placeholder="09XX XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)}/></label></div>
            <label className="form-field"><span>Organization / team <small>(optional)</small></span><input maxLength={120} placeholder="School, team, or organization" value={organization} onChange={e => setOrganization(e.target.value)}/></label>
            <label className="form-field"><span>Delivery address *</span><textarea required minLength={12} maxLength={500} rows={3} placeholder="House / street, barangay, city, province, postal code" value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)}/></label>
            <div className="checkout-methods" role="radiogroup" aria-label="Payment method">
              <button type="button" role="radio" aria-checked={checkoutMethod==='qrph'} className={'checkout-choice'+(checkoutMethod==='qrph'?' selected':'')} onClick={()=>setCheckoutMethod('qrph')}><strong>GCash / QR Ph</strong><small>Scan a QR or pay securely in GCash. The payment provider confirms automatically.</small></button>
              <button type="button" role="radio" aria-checked={checkoutMethod==='cod'} className={'checkout-choice'+(checkoutMethod==='cod'?' selected':'')} onClick={()=>setCheckoutMethod('cod')}><strong>Cash on Delivery</strong><small>Place your order now. Pay cash when your items arrive.</small></button>
            </div>
            <label className="hidden-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label>
            <p className="privacy-note"><ShieldCheck size={17}/> Your contact and delivery details are used to fulfill this order. Please do not include sensitive information in design notes.</p>
            {error && <div className="request-error" role="alert">{error}</div>}
            <button className="button button-dark next-button" type="submit" disabled={sending||totalPieces<1||totalPieces>100}>{sending ? 'Placing order…' : checkoutMethod==='cod' ? 'Place order — Cash on Delivery' : 'Proceed to GCash / QR payment'} <ArrowRight size={18}/></button>
            <div className="hint"><Info size={16}/> Pricing shown is still a demo until ML Sportswear confirms actual rates. QR payment only activates when the shop configures PayMongo. COD does not collect money online.</div>
          </form>
        </section>}
      </div>
      <aside className="studio-preview-col"><div className="preview-card"><div className="preview-card-head"><div><span className="section-kicker">YOUR DESIGN, LIVE</span><h2>{selected.label} <span>Preview</span></h2></div><span className="preview-rot"><RotateCcw size={19}/></span></div>
        <div className="preview-tabs"><button type="button" className={view === 'front' ? 'active':''} onClick={() => changeView('front')}><ChevronLeft size={15}/> Front view</button><button type="button" className={view === 'back' ? 'active':''} onClick={()=>changeView('back')}>Back view <ChevronRight size={15}/></button></div>
        <GarmentPreview {...preview} artworkLayout={artworkLayout} selectedArtwork={activeLayer} onSelectArtwork={setSelectedArtwork} onChangeArtwork={changeArtwork}/>
        {!review && <div className="artwork-editor" aria-label="Artwork position controls">
          <div className="artwork-editor-title"><strong>Edit garment artwork</strong><small>Click the design or choose a layer, then drag it or use the controls.</small></div>
          <div className="artwork-editor-select"><label htmlFor="artwork-layer">Selected layer</label>
            <select id="artwork-layer" value={activeLayer || ''} onChange={e => setSelectedArtwork(e.target.value ? e.target.value as ArtworkKey : null)}>
              {!activeLayer && <option value="">Select artwork</option>}
              {visibleLayers.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
          </div>
          {activeLayer ? <>
            <div className="artwork-editor-controls">
              <div className="editor-nudge" aria-label="Move selected layer">
                <button type="button" onClick={() => nudgeArtwork(0,-5)} aria-label="Move up">↑</button>
                <div><button type="button" onClick={() => nudgeArtwork(-5,0)} aria-label="Move left">←</button><button type="button" onClick={() => nudgeArtwork(0,5)} aria-label="Move down">↓</button><button type="button" onClick={() => nudgeArtwork(5,0)} aria-label="Move right">→</button></div>
              </div>
              <div className="editor-size"><span>Resize</span><div>
                <button type="button" onClick={() => nudgeArtwork(0,0,-0.1)} aria-label="Make selected layer smaller">−</button>
                <strong>{Math.round(artworkLayout[activeLayer].scale * 100)}%</strong>
                <button type="button" onClick={() => nudgeArtwork(0,0,0.1)} aria-label="Make selected layer larger">+</button>
              </div></div>
              <button type="button" className="editor-reset" onClick={() => changeArtwork(activeLayer, initialArtworkForGarment(garment)[activeLayer])}>Reset layer</button>
            </div>
          </> : <p className="artwork-editor-empty">Add text or upload a logo to position it here.</p>}
        </div>}
        <div className="preview-card-bottom"><div><span>SELECTED PIECE</span><b>{selected.label}</b></div><div><span>COLORWAY</span><b>{PALETTE.find(c=>c.hex===color)?.name}</b></div><div className="preview-swatches"><i style={{background:color}}/><i style={{background:accentColor}}/><i style={{background:printColor}}/></div></div>
      </div><div className="estimate-card"><div><span>Estimated sample total</span><b>{money(estimate)}</b></div><div className="estimate-row"><span>{totalPieces} {totalPieces===1?'piece':'pieces'} × {money(selected.price)}</span><span>Demo rates only</span></div><p>For prototype purposes. Final prices must be set and approved by ML Sportswear.</p></div></aside>
    </div>
  </div>;
}

function ColorField({title, value, onChange}: {title:string; value:string; onChange:(v:string)=>void}) {
  const active = PALETTE.find(c=>c.hex === value);
  return <div className="color-field"><div className="color-field-heading"><strong>{title}</strong><span>{active?.name}</span></div><div className="colors-grid">{PALETTE.map(c=><button type="button" key={c.hex} className={'swatch-btn' + (value===c.hex?' swatch-active':'')} onClick={()=>onChange(c.hex)} title={c.name} aria-label={`${title}: ${c.name}`} aria-pressed={value===c.hex}><span style={{background:c.hex}}>{value===c.hex && <Check size={15} color={c.text}/>}</span></button>)}</div></div>;
}
