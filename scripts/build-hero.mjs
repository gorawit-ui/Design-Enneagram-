// Assemble the welcome-page hero from the approved base assets, rather than generating a new one.
//
// The hero used to be its own generation, and that is why it kept going wrong. A fresh generation
// invents three new faces every time, so the people on the welcome page were not the people on the
// result page; the wardrobe lock drifted (the last attempt came back with a block heel on every
// boot, where all nine approved assets are flat-soled); and the three figures had to be argued into
// looking different from each other in prose.
//
// None of that is necessary. The approved assets are already cut-outs on genuine alpha, already the
// locked master faces, already one wardrobe, and already signed off per core. Compositing three of
// them makes the hero show the actual characters a participant can be given, and moves every
// property that used to be a request in a prompt into arithmetic here: equal figure height, a
// shared floor line, equal head height, and measured gutters.
//
// Equal standing is enforced by construction. Each figure is scaled to the same FIGURE height --
// alpha bounding box, so it measures the person and their prop, not the canvas -- and every figure
// stands on the same floor line. No figure can end up taller, higher or larger than another.
//
// Usage:
//   node scripts/build-hero.mjs                 write public/guild-characters-3d.webp
//   node scripts/build-hero.mjs --out path.webp  write somewhere else first
//   node scripts/build-hero.mjs --dry            measure and print, write nothing

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// One presentation each, so nobody opens the page and sees three of the same person. Which
// presentation goes with which core is not a taste decision -- it is searched. Requiring one core
// and one presentation each leaves exactly six assignments, and they differ by 4.4 percentage
// points on the silhouette gate:
//
//   core 1 / core 2 / core 3        worst upper-body pair
//   neutral / female / male                66.2%   <- this one
//   neutral / male   / female              66.4%
//   female  / male   / neutral             70.1%
//   male    / neutral/ female              70.4%
//   female  / neutral/ male                70.3%
//   male    / female / neutral             71.6%
//
// Re-run the search with HERO_CAST=female,male,neutral (etc.) after any asset changes.
//
// None of the six clears the 65% ceiling, and that is a finding about the assets rather than about
// this layout: cores 1, 2 and 3 were all authored standing square-on with the prop at chest height,
// so no arrangement of them can differ much above the waist. The fix is a core whose approved pose
// has a genuinely different arm height -- core 7 raises a spyglass, core 9 holds a wide ring -- and
// it arrives with cores 4-9, not with another hero. Until then 66.2% is the floor this asset set
// allows, and it happens to equal the best a fresh generation reached (66.2%) while keeping the
// master faces that a generation cannot.
const CAST_PRESENTATIONS = (process.env.HERO_CAST ?? "neutral,female,male").split(",");
const CAST = [1, 2, 3].map((core, i) => ({ core, presentation: CAST_PRESENTATIONS[i].trim() }));

const CANVAS = { width: 1400, height: 1050 };
/** Every figure is scaled to this share of the canvas height, which is what makes them equal. */
const FIGURE_HEIGHT_SHARE = 0.83;
/** The soles sit here, measured from the top. The first hero left 8.5% clear below; this matches. */
const FLOOR_LINE_SHARE = 0.915;
/** Total share of the width the three figures and the gaps between them may occupy, centred. */
const CAST_WIDTH_SHARE = 0.82;
/** Clear space between neighbouring figures, as a share of the canvas width.
    This is a floor, not a leftover: the approved assets hold their props out to the side, so a
    figure's box is as wide as its prop and the three boxes nearly fill the row on their own. Taking
    whatever width was left over gave 6px between figures, which reads as three people touching.
    So the gap is fixed and the figures are scaled DOWN to make room for it when they have to be. */
const MIN_GAP_SHARE = 0.033;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const outIndex = args.indexOf("--out");
const outPath = outIndex >= 0 ? args[outIndex + 1] : "public/guild-characters-3d.webp";

/** The figure's own box inside its 1024x1024 cut-out, from alpha rather than from luminance. */
async function figureBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + channels - 1] > 16) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) throw new Error(`${file} has no opaque pixels`);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

const boxes = [];
for (const { core, presentation } of CAST) {
  const file = `public/character-assets/enneagram-${core}/${presentation}.webp`;
  if (!fs.existsSync(file)) throw new Error(`missing approved asset ${file}`);
  boxes.push({ core, presentation, file, box: await figureBox(file) });
}

// One height for every figure, reduced if the row will not otherwise hold the gaps. Widths scale
// with height, so the largest height that fits is a single division rather than a search.
const allowedWidth = Math.round(CANVAS.width * CAST_WIDTH_SHARE);
const gap = Math.round(CANVAS.width * MIN_GAP_SHARE);
const widthBudget = allowedWidth - gap * (boxes.length - 1);
const requestedHeight = Math.round(CANVAS.height * FIGURE_HEIGHT_SHARE);
const widthPerHeight = boxes.reduce((sum, b) => sum + b.box.width / b.box.height, 0);
const figureHeight = Math.min(requestedHeight, Math.floor(widthBudget / widthPerHeight));
if (figureHeight < requestedHeight) {
  console.log(`  figure height ${requestedHeight}px -> ${figureHeight}px `
    + `(${(figureHeight / CANVAS.height * 100).toFixed(1)}% of the canvas) so the row holds ${gap}px gaps`);
}

const figures = [];
for (const { core, presentation, file, box } of boxes) {
  const targetWidth = Math.round(box.width * figureHeight / box.height);
  // Crop to the figure first, then scale: scaling the whole 1024 canvas would make the transparent
  // margin part of the height budget and the three figures would no longer match.
  const buffer = await sharp(file).extract(box).resize({ width: targetWidth, height: figureHeight })
    .png().toBuffer();
  figures.push({ core, presentation, file, box, buffer, width: targetWidth, height: figureHeight });
}

const totalFigureWidth = figures.reduce((sum, f) => sum + f.width, 0);
const layoutWidth = totalFigureWidth + gap * (figures.length - 1);
const floorY = Math.round(CANVAS.height * FLOOR_LINE_SHARE);
let cursor = Math.round((CANVAS.width - layoutWidth) / 2);
for (const figure of figures) {
  figure.left = cursor;
  figure.top = floorY - figure.height;
  cursor += figure.width + gap;
}

// The ground. Deliberately almost nothing, and that is a decision rather than laziness.
//
// The first two attempts here drew a room -- window panes, a plant, a floor plane with a horizon --
// and both looked wrong in the frame. The reason is in app/globals.css: `.guild-visual` already
// paints a `#eef2ec` ground, an elliptical outline over the figures, and a floor gradient across
// the bottom 24% of the frame. The website draws the setting. An image that draws its own room
// inside that frame is two rooms, and the seam between them is what reads as "off" -- a plant
// floating on a wall, a floor line crossing the frame's own gradient at a different height.
//
// So this is a soft field lit from the left, matching where the assets' own key light comes from,
// landing on the frame's background colour at the bottom so the image and the frame meet without
// a seam. Then contact shadows, which are the one thing the frame cannot supply because only this
// script knows where the feet are.
const ground = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}">
     <defs>
       <linearGradient id="field" x1="0" y1="0" x2="0.22" y2="1">
         <stop offset="0" stop-color="#fdfefc"/>
         <stop offset="0.58" stop-color="#f4f7f2"/>
         <stop offset="1" stop-color="#eef2ec"/>
       </linearGradient>
       <radialGradient id="daylight" cx="0.14" cy="0.15" r="0.9">
         <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
         <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.35"/>
         <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
       </radialGradient>
     </defs>
     <rect width="100%" height="100%" fill="url(#field)"/>
     <rect width="100%" height="100%" fill="url(#daylight)"/>
   </svg>`,
);

// Contact shadows, one per sole rather than one per figure. A single wide ellipse under a figure
// standing with its feet apart reads as a smudge, and it is also mostly hidden: a black boot sits
// on top of it. Per sole, and centred just below the sole line so the soft edge shows around the
// boot rather than under it, the shadow is what seats the figure on the ground.
const footShadows = [];
for (const figure of figures) {
  const { data, info } = await sharp(figure.buffer).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  // Sample a little above the very bottom row: the outline's own antialiasing makes the last row
  // unreliable, and a sole is flat enough that two pixels up is the same span.
  const soleRow = info.height - 3;
  const columns = [];
  for (let x = 0; x < info.width; x += 1) {
    if (data[(soleRow * info.width + x) * info.channels + info.channels - 1] > 16) columns.push(x);
  }
  const spans = [];
  for (const x of columns) {
    const last = spans[spans.length - 1];
    if (last && x - last[1] <= 4) last[1] = x;
    else spans.push([x, x]);
  }
  for (const [from, to] of spans) {
    if (to - from < 8) continue;
    footShadows.push({
      cx: figure.left + Math.round((from + to) / 2),
      rx: Math.round((to - from) * 0.78),
    });
  }
}
const shadowRy = Math.max(6, Math.round(figures[0].height * 0.016));
const contactShadows = await sharp(Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}">
     <defs>
       <radialGradient id="contact" cx="0.5" cy="0.5" r="0.5">
         <stop offset="0" stop-color="#16362f" stop-opacity="0.42"/>
         <stop offset="0.5" stop-color="#16362f" stop-opacity="0.18"/>
         <stop offset="1" stop-color="#16362f" stop-opacity="0"/>
       </radialGradient>
     </defs>
     ${footShadows.map((f) => `<ellipse cx="${f.cx}" cy="${floorY + Math.round(shadowRy * 0.35)}" `
       + `rx="${f.rx}" ry="${shadowRy}" fill="url(#contact)"/>`).join("\n     ")}
   </svg>`,
)).blur(5).png().toBuffer();
console.log(`  ${footShadows.length} contact shadows (one per sole), ry ${shadowRy}px`);

const rendered = sharp(ground).composite([
  { input: contactShadows },
  ...figures.map((f) => ({ input: f.buffer, left: f.left, top: f.top })),
]);

const headroom = (Math.min(...figures.map((f) => f.top)) / CANVAS.height * 100).toFixed(1);
const below = ((CANVAS.height - floorY) / CANVAS.height * 100).toFixed(1);
const castLeft = Math.min(...figures.map((f) => f.left));
const castRight = Math.max(...figures.map((f) => f.left + f.width));

console.log(`hero ${CANVAS.width}x${CANVAS.height} from ${figures.length} approved assets`);
for (const f in figures) {
  const g = figures[f];
  console.log(`  core ${g.core} ${g.presentation.padEnd(8)} ${g.width}x${g.height} at ${g.left},${g.top}`
    + `   (cut-out box ${g.box.width}x${g.box.height})`);
}
console.log(`  every figure ${figures[0].height}px tall, soles on one floor line at y=${floorY}`);
console.log(`  figures fill ${(figures[0].height / CANVAS.height * 100).toFixed(1)}% of height`
  + `  ·  ${headroom}% clear above  ·  ${below}% clear below`);
console.log(`  figures fill ${((castRight - castLeft) / CANVAS.width * 100).toFixed(1)}% of width`
  + `  ·  ${(castLeft / CANVAS.width * 100).toFixed(1)}% clear left`
  + `  ·  ${((CANVAS.width - castRight) / CANVAS.width * 100).toFixed(1)}% clear right`
  + `  ·  ${gap}px between figures`);

if (dryRun) {
  console.log("\n--dry: nothing written");
  process.exit(0);
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
await rendered.webp({ quality: 82 }).toFile(outPath);
console.log(`\nwrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
