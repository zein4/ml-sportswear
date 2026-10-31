/** Clear client-provided sportswear designs, with duplicates omitted. Mockups are examples, not priced stock. */
export type GalleryCategory = 'Basketball sets' | 'T-Shirts' | 'Long sleeves' | 'Hoodies & jackets';
export type EditableGarment = 'set' | 'sando' | 'tshirt' | 'shorts';
export type GalleryItem = {
  id: string; title: string; category: GalleryCategory; image: string;
  garment: EditableGarment | null; note?: string;
};
export const galleryItems: GalleryItem[] = [
  { id: "sunrise-black", title: "Black Sunrise Basketball Jersey", category: "Basketball sets", image: "/ml113/sunrise-black.webp", garment: "sando" },
  { id: "kci-pink", title: "Pink Team Basketball Set", category: "Basketball sets", image: "/ml113/kci-pink.webp", garment: "set" },
  { id: "gray-long-sleeve", title: "Gray Number 12 Long Sleeve", category: "Long sleeves", image: "/ml113/gray-long-sleeve.webp", garment: null },
  { id: "black-monochrome", title: "Black & White Team Set", category: "Basketball sets", image: "/ml113/black-monochrome.webp", garment: "set" },
  { id: "purple-studio", title: "Purple Studio Basketball Jersey", category: "Basketball sets", image: "/ml113/purple-studio.webp", garment: "sando" },
  { id: "white-flame-hoodie", title: "White Flame Team Hoodie", category: "Hoodies & jackets", image: "/ml113/white-flame-hoodie.webp", garment: null },
  { id: "blue-gradient", title: "Blue Gradient Basketball Set", category: "Basketball sets", image: "/ml113/blue-gradient.webp", garment: "set" },
  { id: "red-black-hoodie", title: "Red & Black Team Hoodie", category: "Hoodies & jackets", image: "/ml113/red-black-hoodie.webp", garment: null },
  { id: "navy-blue-set", title: "Navy Blue Basketball Set", category: "Basketball sets", image: "/ml113/navy-blue-set.webp", garment: "set" },
  { id: "blue-gold-set", title: "Blue & Gold Team Uniform", category: "Basketball sets", image: "/ml113/blue-gold-set.webp", garment: "set" },
  { id: "purple-white-set", title: "Purple & White Team Set", category: "Basketball sets", image: "/ml113/purple-white-set.webp", garment: "set" },
  { id: "white-legends-shirt", title: "White Team T-Shirt", category: "T-Shirts", image: "/ml113/white-legends-shirt.webp", garment: "tshirt" },
  { id: "purple-black-set", title: "Purple & Black Team Set", category: "Basketball sets", image: "/ml113/purple-black-set.webp", garment: "set" },
  { id: "black-46-set", title: "Black Number 46 Team Set", category: "Basketball sets", image: "/ml113/black-46-set.webp", garment: "set" },
  { id: "white-gold-shirt", title: "White & Gold Sports Shirt", category: "T-Shirts", image: "/ml113/white-gold-shirt.webp", garment: "tshirt" },
  { id: "white-lavender-set", title: "White & Lavender Team Set", category: "Basketball sets", image: "/ml113/white-lavender-set.webp", garment: "set" },
  { id: "green-celtics-set", title: "Green & White Court Set", category: "Basketball sets", image: "/ml113/green-celtics-set.webp", garment: "set" },
  { id: "blue-studio-jersey", title: "Sky Blue Studio Jersey", category: "Basketball sets", image: "/ml113/blue-studio-jersey.webp", garment: "sando" },
  { id: "green-team-hoodie", title: "Forest Green Team Hoodie", category: "Hoodies & jackets", image: "/ml113/green-team-hoodie.webp", garment: null },
  { id: "blue-white-zip-jacket", title: "Blue & White Team Jacket", category: "Hoodies & jackets", image: "/ml113/blue-white-zip-jacket.webp", garment: null },
  { id: "purple-12-set", title: "Purple Number 12 Team Set", category: "Basketball sets", image: "/ml113/purple-12-set.webp", garment: "set" },
  { id: "blue-graphic-set", title: "Blue Graphic Basketball Set", category: "Basketball sets", image: "/ml113/blue-graphic-set.webp", garment: "set" },
  { id: "red-white-set", title: "Red & White Number 23 Set", category: "Basketball sets", image: "/ml113/red-white-set.webp", garment: "set" },
  { id: "purple-blue-long-sleeve", title: "Purple & Blue Long Sleeve", category: "Long sleeves", image: "/ml113/purple-blue-long-sleeve.webp", garment: null },
  { id: "red-white-zip-jacket", title: "Red & White Team Jacket", category: "Hoodies & jackets", image: "/ml113/red-white-zip-jacket.webp", garment: null },
  { id: "maroon-12-set", title: "Maroon Number 12 Team Set", category: "Basketball sets", image: "/ml113/maroon-12-set.webp", garment: "set" },
  { id: "purple-lit-jersey", title: "Purple Basketball Jersey Display", category: "Basketball sets", image: "/ml113/purple-lit-jersey.webp", garment: "sando" },
  { id: "red-lit-jersey", title: "Red Basketball Jersey Display", category: "Basketball sets", image: "/ml113/red-lit-jersey.webp", garment: "sando" },
];
export const galleryCategories: Array<'All' | GalleryCategory> = ['All', 'Basketball sets', 'T-Shirts', 'Long sleeves', 'Hoodies & jackets'];
