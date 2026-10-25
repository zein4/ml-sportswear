'use client';
import { useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { GarmentId } from '@/lib/catalog';
import { clamp, type ArtworkKey, type ArtworkLayout, type ArtworkPosition } from '@/lib/artwork';

type Props = {
  garment: GarmentId; color: string; accentColor: string; printColor: string;
  playerName: string; playerNumber: string; teamName: string;
  frontImage?: string | null; backImage?: string | null; view: 'front' | 'back'; mini?: boolean;
  // The home/catalog renders the normal non-interactive preview.
  artworkLayout?: ArtworkLayout;
  selectedArtwork?: ArtworkKey | null;
  onSelectArtwork?: (key: ArtworkKey | null) => void;
  onChangeArtwork?: (key: ArtworkKey, next: ArtworkPosition) => void;
};

type Layer = { key: ArtworkKey; label: string; x: number; y: number; width: number; height: number; text?: string; image?: string; size?: number };
type Gesture = { pointerId: number; key: ArtworkKey; kind: 'move' | 'resize'; startX: number; startY: number; start: ArtworkPosition; centerDistance: number };

function ShirtShape({ garment, color, accentColor, view }: { garment: GarmentId; color: string; accentColor: string; view: 'front'|'back' }) {
  const isShirt = garment === 'tshirt';
  const isShorts = garment === 'shorts';
  const isSet = garment === 'set';
  if (isShorts) return <g>
    <path d="M83 70 H237 L263 266 L185 280 L160 194 L135 280 L57 266 Z" fill={color} stroke="#132033" strokeOpacity=".13" strokeWidth="2" />
    <path d="M83 70 H237 V98 H83 Z" fill={accentColor} opacity=".9" />
    <path d="M160 96 V194 M83 94 L57 266 M237 94 L263 266" stroke="#fff" strokeOpacity=".25" strokeWidth="3" fill="none"/>
    <path d="M61 254 L132 267 M188 267 L259 254" stroke={accentColor} strokeWidth="7" />
  </g>;
  if (isSet) return <g>
    <path d="M116 25 Q132 54 160 54 Q188 54 204 25 L228 34 L241 118 L211 125 L205 199 H115 L109 125 L79 118 L92 34 Z" fill={color} stroke="#132033" strokeOpacity=".13" strokeWidth="2" />
    <path d="M116 25 Q132 54 160 54 Q188 54 204 25" stroke={accentColor} strokeWidth="9" fill="none"/>
    <path d="M92 34 L81 115 M228 34 L239 115" stroke={accentColor} strokeWidth="10" />
    <path d="M106 213 H214 L235 283 L179 295 L160 252 L141 295 L85 283 Z" fill={color} stroke="#132033" strokeOpacity=".13" strokeWidth="2" />
    <path d="M106 213 H214 V230 H106 Z" fill={accentColor} /><path d="M89 281 L138 292 M182 292 L231 281" stroke={accentColor} strokeWidth="6"/>
  </g>;
  return <g>
    <path d={isShirt ? 'M111 35 L83 45 L34 101 L78 140 L108 111 L113 279 Q160 288 207 279 L212 111 L242 140 L286 101 L237 45 L209 35 Q189 66 160 66 Q131 66 111 35 Z' : 'M116 31 Q133 62 160 62 Q187 62 204 31 L231 42 L244 137 L209 149 L205 279 Q160 287 115 279 L111 149 L76 137 L89 42 Z'} fill={color} stroke="#132033" strokeOpacity=".13" strokeWidth="2" />
    {isShirt ? <><path d="M110 34 Q160 105 210 34" stroke={accentColor} strokeWidth="11" fill="none"/><path d="M34 101 L78 140 M286 101 L242 140" stroke={accentColor} strokeWidth="12" /></> : <><path d="M116 31 Q133 62 160 62 Q187 62 204 31" stroke={accentColor} strokeWidth="10" fill="none"/><path d="M89 42 L76 137 M231 42 L244 137" stroke={accentColor} strokeWidth="12" /></>}
    <path d="M116 269 Q160 277 204 269" stroke={accentColor} strokeWidth="4" fill="none" opacity=".55" />
    {view === 'back' ? <path d="M122 41 Q160 58 198 41" stroke="#fff" strokeOpacity=".24" strokeWidth="3" fill="none" /> : null}
  </g>;
}

export function GarmentPreview({ garment, color, accentColor, printColor, playerName, playerNumber, teamName, frontImage, backImage, view, mini = false, artworkLayout, selectedArtwork, onSelectArtwork, onChangeArtwork }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Gesture | null>(null);
  const editable = !!(artworkLayout && onSelectArtwork && onChangeArtwork && !mini);
  const isShorts = garment === 'shorts';
  const isSet = garment === 'set';
  const image = view === 'front' ? frontImage : backImage;
  const layers: Layer[] = [];
  if (view === 'front') {
    if (teamName.trim()) layers.push({ key: 'teamName', label: 'Team name', x: 160, y: isShorts ? 130 : isSet ? 75 : 100, width: 155, height: 25, text: teamName.toUpperCase().slice(0, 22), size: isShorts ? 11 : isSet ? 11 : 14 });
    if (image) layers.push({ key: 'frontLogo', label: 'Front logo', x: 160, y: isShorts ? 165 : isSet ? 124 : 160, width: isSet ? 40 : 55, height: isSet ? 40 : 55, image });
  } else {
    if (playerName.trim()) layers.push({ key: 'playerName', label: 'Player name', x: 160, y: isShorts ? 126 : isSet ? 83 : 106, width: 170, height: 27, text: playerName.toUpperCase().slice(0, 18), size: isSet ? 13 : isShorts ? 12 : 18 });
    if (playerNumber.trim()) layers.push({ key: 'playerNumber', label: 'Player number', x: 160, y: isShorts ? 183 : isSet ? 149 : 197, width: isSet ? 80 : isShorts ? 74 : 115, height: isSet ? 77 : isShorts ? 65 : 110, text: playerNumber, size: isSet ? 70 : isShorts ? 58 : 102 });
    if (image) layers.push({ key: 'backLogo', label: 'Back logo', x: 160, y: isShorts ? 219 : isSet ? 171 : 245, width: 36, height: 36, image });
  }

  function toSvgPoint(evt: { clientX: number; clientY: number }) {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const transformed = pt.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function beginGesture(evt: ReactPointerEvent<SVGGElement | SVGCircleElement>, key: ArtworkKey, kind: Gesture['kind']) {
    if (!editable || !artworkLayout) return;
    const pos = toSvgPoint(evt);
    if (!pos) return;
    evt.preventDefault(); evt.stopPropagation();
    onSelectArtwork?.(key);
    const start = artworkLayout[key];
    dragRef.current = { pointerId: evt.pointerId, key, kind, startX: pos.x, startY: pos.y, start: { ...start }, centerDistance: Math.max(1, Math.hypot(pos.x - start.x, pos.y - start.y)) };
    svgRef.current?.setPointerCapture(evt.pointerId);
  }
  function moveGesture(evt: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || evt.pointerId !== drag.pointerId) return;
    const point = toSvgPoint(evt); if (!point) return;
    evt.preventDefault();
    if (drag.kind === 'move') {
      onChangeArtwork?.(drag.key, { ...drag.start, x: clamp(drag.start.x + point.x - drag.startX, 55, 265), y: clamp(drag.start.y + point.y - drag.startY, 38, 282) });
    } else {
      const dist = Math.hypot(point.x - drag.start.x, point.y - drag.start.y);
      onChangeArtwork?.(drag.key, { ...drag.start, scale: clamp(drag.start.scale * (dist / drag.centerDistance), 0.35, 2.4) });
    }
  }
  function endGesture(evt: ReactPointerEvent<SVGSVGElement>) {
    if (evt.pointerId !== dragRef.current?.pointerId) return;
    dragRef.current = null;
    if (svgRef.current?.hasPointerCapture(evt.pointerId)) svgRef.current.releasePointerCapture(evt.pointerId);
  }
  function artworkKeyDown(evt: ReactKeyboardEvent<SVGGElement>, key: ArtworkKey) {
    if (!editable || !artworkLayout) return;
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','='].includes(evt.key)) return;
    evt.preventDefault();
    onSelectArtwork?.(key);
    const current = artworkLayout[key];
    const amount = evt.shiftKey ? 10 : 2;
    if (['+', '=','-'].includes(evt.key)) {
      onChangeArtwork?.(key, { ...current, scale: clamp(current.scale + (evt.key === '-' ? -0.1 : 0.1), 0.35, 2.4) });
    } else {
      onChangeArtwork?.(key, {
        ...current,
        x: clamp(current.x + (evt.key === 'ArrowRight' ? amount : evt.key === 'ArrowLeft' ? -amount : 0), 55, 265),
        y: clamp(current.y + (evt.key === 'ArrowDown' ? amount : evt.key === 'ArrowUp' ? -amount : 0), 38, 282),
      });
    }
  }

  return <div className={'preview-stage' + (mini ? ' preview-stage-mini' : '') + (editable ? ' preview-stage-editable' : '')}>
    <svg ref={svgRef} viewBox="0 0 320 320" className="garment-svg" role={editable ? 'group' : 'img'} aria-label={`${view} preview of ${garment}`} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture}>
      <ellipse cx="160" cy="296" rx="92" ry="10" fill="#303e58" opacity=".07" />
      <ShirtShape garment={garment} color={color} accentColor={accentColor} view={view} />
      {layers.map(layer => {
        // The public catalog has a static preview; the editor uses saved positions.
        const position = artworkLayout?.[layer.key] ?? { x: layer.x, y: layer.y, scale: 1 };
        const picked = editable && selectedArtwork === layer.key;
        return <g key={layer.key} transform={`translate(${position.x} ${position.y}) scale(${position.scale})`}
          className={editable ? 'editable-artwork' : undefined}
          role={editable ? 'button' : undefined} tabIndex={editable ? 0 : undefined}
          aria-label={editable ? `Move or resize ${layer.label}; arrow keys to move, plus or minus to resize` : undefined}
          onKeyDown={evt => artworkKeyDown(evt, layer.key)}
          onPointerDown={evt => beginGesture(evt, layer.key, 'move')}>
          <rect x={-layer.width/2} y={-layer.height/2} width={layer.width} height={layer.height} fill="transparent" />
          {layer.image ? <image href={layer.image} x={-layer.width/2} y={-layer.height/2} width={layer.width} height={layer.height} preserveAspectRatio="xMidYMid meet" pointerEvents="none" /> :
            <text x="0" y="0" dominantBaseline="central" textAnchor="middle" fill={printColor} fontSize={layer.size} fontWeight="900" letterSpacing={layer.key==='playerNumber' ? '-3' : '1'} textLength={undefined} pointerEvents="none">{layer.text}</text>}
          {picked && <>
            <rect x={-layer.width/2-5} y={-layer.height/2-5} width={layer.width+10} height={layer.height+10} fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="6 4" pointerEvents="none" />
            <rect x={-layer.width/2-5} y={-layer.height/2-5} width={layer.width+10} height={layer.height+10} fill="none" stroke="#3267ff" strokeWidth="1.8" strokeDasharray="6 4" pointerEvents="none" />
            <circle cx={layer.width/2+5} cy={layer.height/2+5} r="10" fill="#fff" stroke="#325ce4" strokeWidth="2" className="artwork-resize-handle" aria-label={`Resize ${layer.label}`} onPointerDown={evt => beginGesture(evt, layer.key, 'resize')} />
            <path d={`M${layer.width/2+1} ${layer.height/2+5}h8 M${layer.width/2+5} ${layer.height/2+1}v8`} stroke="#325ce4" strokeWidth="1.8" pointerEvents="none" />
          </>}
        </g>;
      })}
      {!layers.length && <text x="160" y="155" fontSize="14" fontWeight="700" textAnchor="middle" fill={printColor} opacity=".7">Upload artwork or add text</text>}
    </svg>
    {!mini && <div className="stage-footer"><span className="stage-badge">{editable ? 'DRAG & RESIZE PREVIEW' : 'LIVE PREVIEW'}</span><span>Visual guide only · not print-ready artwork</span></div>}
  </div>;
}
