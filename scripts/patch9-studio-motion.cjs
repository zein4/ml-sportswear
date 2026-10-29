// Optional gentle studio-background animation. Does not change the SVG transform
// used by the customer's drag/resize editor or any checkout logic.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(process.cwd(), 'app', 'globals.css');
const marker = '/* ML_PATCH9_STUDIO_MOTION_FIX */';
if (!fs.existsSync(file)) {
  console.error('app/globals.css was not found. Run this from the project folder containing package.json.');
  process.exitCode = 1;
} else {
  const current = fs.readFileSync(file, 'utf8');
  if (current.includes(marker)) {
    console.log('Studio motion already installed. No duplicate CSS was added.');
  } else {
    fs.appendFileSync(file, `\n${marker}
/* Animate only the preview backdrop: the draggable garment SVG stays still. */
body:has(.customizer-wrap) .preview-stage { position:relative; isolation:isolate; overflow:hidden; }
body:has(.customizer-wrap) .preview-stage::before { content:""; position:absolute; pointer-events:none; inset:-25%; z-index:0; background:radial-gradient(ellipse at 43% 30%,rgba(186,202,232,.19),transparent 51%),radial-gradient(ellipse at 76% 70%,rgba(133,148,193,.16),transparent 43%); animation:ml9StudioGlow 7s ease-in-out infinite alternate; }
body:has(.customizer-wrap) .preview-stage > .garment-svg { position:relative; z-index:1; }
body:has(.customizer-wrap) .preview-card { transition:box-shadow .35s ease,border-color .35s ease; }
body:has(.customizer-wrap) .preview-card:hover { box-shadow:0 24px 54px rgba(37,57,83,.20); }
@keyframes ml9StudioGlow { from{transform:translate3d(-8%,5%,0) scale(1)} to{transform:translate3d(7%,-5%,0) scale(1.1)} }
@media(prefers-reduced-motion:reduce){ body:has(.customizer-wrap) .preview-stage::before{animation:none!important} }
`, 'utf8');
    console.log('Installed gentle studio background animation. The editable garment is not moved.');
  }
}
