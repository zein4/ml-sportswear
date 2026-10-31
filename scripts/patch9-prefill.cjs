/* Patch 9: preserve every local checkout and pricing edit; only enhance the URL preset effect. */
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(process.cwd(), 'app', 'customize', 'page.tsx');
if (!fs.existsSync(file)) { console.error('Open the ml-sportswear project root before running this script.'); process.exit(1); }
const original = fs.readFileSync(file, 'utf8');
const old = `  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('garment');
    if (GARMENTS.some(g => g.id === param)) {
      setGarment(param as GarmentId);
      setArtworkLayout(initialArtworkForGarment(param as GarmentId));
    }
  }, []);`;
const updated = `  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const garmentParam = params.get('garment');
    const colorParam = params.get('color');
    const sizeParam = params.get('size');
    if (GARMENTS.some(g => g.id === garmentParam)) {
      setGarment(garmentParam as GarmentId);
      setArtworkLayout(initialArtworkForGarment(garmentParam as GarmentId));
    }
    // Only allow palette colors and ML's own lookbook shades.
    if (PALETTE.some(c => c.hex.toLowerCase() === colorParam?.toLowerCase()) || ['#6446bc','#252b47','#9b314f','#276b71','#f3efe8','#b4a7d8'].includes(colorParam?.toLowerCase() || '')) {
      setColor(colorParam!);
    }
    if (SIZES.some(s => s === sizeParam)) {
      setSizes({ ...initialSizes, M: 0, [sizeParam as Size]: 1 });
    }
  }, []);`;
if (original.includes("const colorParam = params.get('color');")) { console.log('Patch 9 garment, color and size prefill is already installed.'); process.exit(0); }
if (!original.includes(old)) {
  console.error('Your customize/page.tsx was changed. Nothing was overwritten. The lookbook still opens the right garment; contact support to adapt color/size prefill.');
  process.exit(2);
}
const backup = path.join(process.cwd(), 'node_modules', '.cache', 'ml-sportswear', 'customize-page.patch9-backup.tsx');
fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.writeFileSync(backup, original, 'utf8');
fs.writeFileSync(file, original.replace(old, updated), 'utf8');
console.log('Success: selected garment, color and size now carry to the customizer.');
console.log('Backup:', backup);
