import { GARMENTS, PALETTE, SIZES, GarmentId, SizeCounts } from './catalog';
import { sanitizeArtworkLayout, type ArtworkLayout } from './artwork';

export type OrderPayload = {
  garment: GarmentId;
  color: string;
  accentColor: string;
  printColor: string;
  playerName: string;
  playerNumber: string;
  teamName: string;
  sizes: SizeCounts;
  roster: string;
  notes: string;
  contactName: string;
  email: string;
  phone: string;
  organization: string;
  website: string; // honeypot: must be empty
  artworkLayout: ArtworkLayout;
};

const asText = (x: unknown, len: number) => typeof x === 'string' ? x.trim().slice(0, len) : '';
export function validateOrder(raw: unknown): { data?: OrderPayload; error?: string; quantity?: number; total?: number } {
  if (!raw || typeof raw !== 'object') return { error: 'Invalid order request.' };
  const obj = raw as Record<string, unknown>;
  if (asText(obj.website, 300)) return { error: 'Unable to submit this request.' };
  const garment = asText(obj.garment, 30) as GarmentId;
  const garmentInfo = GARMENTS.find((g) => g.id === garment);
  if (!garmentInfo) return { error: 'Please choose a valid garment.' };
  const color = asText(obj.color, 30);
  const accentColor = asText(obj.accentColor, 30);
  const printColor = asText(obj.printColor, 30);
  if (![color, accentColor, printColor].every((x) => PALETTE.some((c) => c.hex === x))) return { error: 'Please select a valid color.' };
  const counts = obj.sizes && typeof obj.sizes === 'object' ? obj.sizes as Record<string, unknown> : {};
  const sizes = {} as SizeCounts;
  let quantity = 0;
  for (const size of SIZES) {
    const value = counts[size];
    if (!Number.isInteger(value) || typeof value !== 'number' || value < 0 || value > 100) return { error: `Invalid quantity for ${size}.` };
    sizes[size] = value;
    quantity += value;
  }
  if (quantity < 1 || quantity > 100) return { error: 'Choose between 1 and 100 pieces.' };
  const contactName = asText(obj.contactName, 120);
  const email = asText(obj.email, 200).toLowerCase();
  const phone = asText(obj.phone, 40);
  if (contactName.length < 2) return { error: 'Please enter your full name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email address.' };
  if (!/^[+\d\s()-]{7,30}$/.test(phone)) return { error: 'Please enter a valid contact number.' };
  const data: OrderPayload = {
    garment, color, accentColor, printColor,
    playerName: asText(obj.playerName, 24),
    playerNumber: asText(obj.playerNumber, 4),
    teamName: asText(obj.teamName, 32),
    sizes, roster: asText(obj.roster, 4500), notes: asText(obj.notes, 1500),
    contactName, email, phone, organization: asText(obj.organization, 120), website: '',
    artworkLayout: sanitizeArtworkLayout(obj.artworkLayout),
  };
  if (data.playerNumber && !/^\d{1,4}$/.test(data.playerNumber)) return { error: 'Jersey number must contain 1 to 4 digits.' };
  return { data, quantity, total: quantity * garmentInfo.price };
}
