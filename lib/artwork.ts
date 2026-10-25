/** Positions are in the garment SVG's 320 × 320 coordinate system. */
export const ARTWORK_KEYS = ['frontLogo', 'backLogo', 'teamName', 'playerName', 'playerNumber'] as const;
export type ArtworkKey = (typeof ARTWORK_KEYS)[number];
export type ArtworkPosition = { x: number; y: number; scale: number };
export type ArtworkLayout = Record<ArtworkKey, ArtworkPosition>;

export const DEFAULT_ARTWORK_LAYOUT: ArtworkLayout = {
  frontLogo: { x: 160, y: 153, scale: 1 },
  backLogo: { x: 160, y: 153, scale: 1 },
  teamName: { x: 160, y: 104, scale: 1 },
  playerName: { x: 160, y: 108, scale: 1 },
  playerNumber: { x: 160, y: 204, scale: 1 },
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeArtworkLayout(value: unknown): ArtworkLayout {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result = {} as ArtworkLayout;
  ARTWORK_KEYS.forEach(key => {
    const item = raw[key] && typeof raw[key] === 'object' ? raw[key] as Record<string, unknown> : {};
    const defaults = DEFAULT_ARTWORK_LAYOUT[key];
    const safeNumber = (v: unknown, fallback: number, min: number, max: number) =>
      typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback;
    result[key] = {
      x: safeNumber(item.x, defaults.x, 55, 265),
      y: safeNumber(item.y, defaults.y, 38, 282),
      scale: safeNumber(item.scale, defaults.scale, 0.35, 2.4),
    };
  });
  return result;
}

export function initialArtworkForGarment(garment: 'sando' | 'tshirt' | 'shorts' | 'set'): ArtworkLayout {
  const layout: ArtworkLayout = structuredClone(DEFAULT_ARTWORK_LAYOUT);
  if (garment === 'set') {
    layout.teamName.y = 75; layout.frontLogo.y = 128;
    layout.playerName.y = 83; layout.playerNumber.y = 148; layout.backLogo.y = 174;
    layout.playerNumber.scale = 0.9;
  } else if (garment === 'shorts') {
    layout.teamName.y = 130; layout.frontLogo.y = 182;
    layout.playerName.y = 126; layout.playerNumber.y = 184; layout.backLogo.y = 220;
    layout.playerNumber.scale = 0.7;
  } else {
    layout.frontLogo.y = 166; layout.backLogo.y = 247;
    layout.playerNumber.y = 199;
  }
  return layout;
}
