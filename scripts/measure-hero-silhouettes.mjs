// Measure whether the three figures in the welcome-page hero read apart as silhouettes.
//
// The hero is not a spec asset, so `npm run assets:check` does not apply to it -- that script
// enforces 1024x1024 RGBA with a transparent margin, which is the wrong contract for a landscape
// hero on a solid background. But the hero does have one requirement that can be measured, and it
// is the requirement the current file fails: the three figures must be tellable apart at the size
// a phone actually shows them, which is 328 px wide inside the frame -- a 4.3x reduction at which
// colour, expression and facial detail all disappear and only the outline survives.
//
// So: threshold the picture into figure/background, find the three column runs that carry a figure,
// resample each to a common grid, and report how much the three outlines agree. High agreement
// means one figure drawn three times, which is what the first hero did (86.1% between the middle
// and right figures) and why every character was holding a small pale rectangle at chest height.
//
// Usage: node scripts/measure-hero-silhouettes.mjs [path]     default public/guild-characters-3d.webp

import path from "node:path";
import sharp from "sharp";

// A figure pixel is simply a dark one: the wardrobe is a forest-green blazer, charcoal trousers and
// black boots against a deliberately pale background, so luminance separates them cleanly. The
// threshold is generous rather than tuned -- the measurement is about outlines, not edges.
const INK_LUMINANCE = 140;
const GRID_WIDTH = 64;
const GRID_HEIGHT = 128;
/** A column belongs to a figure when this share of it is ink. Below this is background or shadow. */
const COLUMN_INK_SHARE = 0.01;
/** Runs narrower than this are a plant, a shadow edge or a prop that has drifted clear of a body. */
const MIN_RUN_WIDTH = 40;
/** Agreement above this means the outlines are effectively the same shape. */
const AGREEMENT_CEILING = 65;

const file = process.argv[2] ?? "public/guild-characters-3d.webp";
const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const isInk = (x, y) => {
  const i = (y * width + x) * channels;
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] < INK_LUMINANCE;
};

// Where the figures sit in the frame. Reported because it is the half of the composition that the
// first hero got right, and a regeneration can easily lose it while fixing the silhouettes.
const columnInk = Array.from({ length: width }, (_, x) => {
  let n = 0;
  for (let y = 0; y < height; y += 1) if (isInk(x, y)) n += 1;
  return n;
});
const rowInk = Array.from({ length: height }, (_, y) => {
  let n = 0;
  for (let x = 0; x < width; x += 1) if (isInk(x, y)) n += 1;
  return n;
});
const span = (profile, limit, threshold) => {
  const first = profile.findIndex((v) => v > threshold);
  const last = limit - 1 - [...profile].reverse().findIndex((v) => v > threshold);
  return { first, last };
};
const rows = span(rowInk, height, width * 0.004);
const columns = span(columnInk, width, height * 0.004);
const share = (a, b, total) => ((b - a + 1) / total * 100).toFixed(1);

console.log(`${path.basename(file)}  ${width}x${height}  aspect ${(width / height).toFixed(3)}`);
console.log(`  figures fill ${share(rows.first, rows.last, height)}% of height`
  + `  ·  ${(rows.first / height * 100).toFixed(1)}% clear above`
  + `  ·  ${((height - 1 - rows.last) / height * 100).toFixed(1)}% clear below`);
console.log(`  figures fill ${share(columns.first, columns.last, width)}% of width`
  + `  ·  ${(columns.first / width * 100).toFixed(1)}% clear left`
  + `  ·  ${((width - 1 - columns.last) / width * 100).toFixed(1)}% clear right`);

// The three column runs, each one figure.
const runs = [];
let start = -1;
for (let x = 0; x < width; x += 1) {
  const on = columnInk[x] > height * COLUMN_INK_SHARE;
  if (on && start < 0) start = x;
  if (!on && start >= 0) {
    if (x - start > MIN_RUN_WIDTH) runs.push([start, x - 1]);
    start = -1;
  }
}
if (start >= 0) runs.push([start, width - 1]);

if (runs.length !== 3) {
  console.log(`\nFound ${runs.length} figure run(s), not 3: ${runs.map(([a, b]) => `${a}-${b}`).join(", ")}`);
  console.log("Two figures touching, or a prop bridging the gap between them, merges them into one");
  console.log("run and the comparison below cannot be made. That is itself a finding about the");
  console.log("image -- the prompt asks for clear space between the figures -- rather than a bug here.");
  process.exit(1);
}

// Each figure resampled to one grid, so the comparison is of shape rather than of size or position.
const silhouettes = runs.map(([left, right]) => {
  let top = height;
  let bottom = 0;
  for (let y = 0; y < height; y += 1) {
    let n = 0;
    for (let x = left; x <= right; x += 1) if (isInk(x, y)) n += 1;
    if (n > 2) {
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  for (let gy = 0; gy < GRID_HEIGHT; gy += 1) {
    for (let gx = 0; gx < GRID_WIDTH; gx += 1) {
      const x = left + Math.round((right - left) * gx / (GRID_WIDTH - 1));
      const y = top + Math.round((bottom - top) * gy / (GRID_HEIGHT - 1));
      grid[gy * GRID_WIDTH + gx] = isInk(x, y) ? 1 : 0;
    }
  }
  return { grid, box: `${right - left + 1}x${bottom - top + 1}` };
});

const names = ["left", "middle", "right"];
console.log(`\n  figure boxes: ${silhouettes.map((s, i) => `${names[i]} ${s.box}`).join("  ·  ")}`);
console.log("\n  normalised silhouette agreement:");
let worst = 0;
for (let i = 0; i < silhouettes.length; i += 1) {
  for (let j = i + 1; j < silhouettes.length; j += 1) {
    let agree = 0;
    for (let k = 0; k < silhouettes[i].grid.length; k += 1) {
      if (silhouettes[i].grid[k] === silhouettes[j].grid[k]) agree += 1;
    }
    const pct = agree / silhouettes[i].grid.length * 100;
    worst = Math.max(worst, pct);
    console.log(`    ${names[i]} vs ${names[j]}: ${pct.toFixed(1)}%  ${pct > AGREEMENT_CEILING ? "TOO ALIKE" : "ok"}`);
  }
}
console.log(`\n  worst pair ${worst.toFixed(1)}% against a ${AGREEMENT_CEILING}% ceiling: `
  + `${worst > AGREEMENT_CEILING ? "FAIL" : "PASS"}`);
console.log("  For reference, the first hero measured 68.5 / 72.7 / 86.1 -- three figures all");
console.log("  standing square to the camera holding a small pale rectangle at chest height.");
process.exit(worst > AGREEMENT_CEILING ? 1 : 0);
