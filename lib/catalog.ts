export const GARMENTS = [
  { id: 'sando', label: 'Sando', descriptor: 'Sleeveless uniform', price: 350, code: '01' },
  { id: 'tshirt', label: 'T-Shirt', descriptor: 'Everyday team tee', price: 420, code: '02' },
  { id: 'shorts', label: 'Shorts', descriptor: 'Court-ready bottoms', price: 320, code: '03' },
  { id: 'set', label: 'Jersey Set', descriptor: 'Sando + shorts', price: 650, code: '04' },
] as const;

export type GarmentId = (typeof GARMENTS)[number]['id'];
export const PALETTE = [
  { name: 'Midnight', hex: '#171a28', text: '#ffffff' },
  { name: 'Royal Blue', hex: '#3157c9', text: '#ffffff' },
  { name: 'Crimson', hex: '#bf3345', text: '#ffffff' },
  { name: 'Forest', hex: '#246353', text: '#ffffff' },
  { name: 'Cloud White', hex: '#f3f1e9', text: '#1e2735' },
  { name: 'Sunflower', hex: '#f5bc51', text: '#182033' },
  { name: 'Stone', hex: '#a5a9b1', text: '#172030' },
  { name: 'Violet', hex: '#6450b2', text: '#ffffff' },
] as const;
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'] as const;
export type Size = (typeof SIZES)[number];
export type SizeCounts = Record<Size, number>;
export const initialSizes: SizeCounts = { XS: 0, S: 0, M: 1, L: 0, XL: 0, '2XL': 0 };
export const money = (value: number) => '₱' + value.toLocaleString('en-PH');
// DEMO PRICING ONLY. Change this after the client gives actual approved rates.
