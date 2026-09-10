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
/** Runs narrower than this are a plant or a shadow edge rather than part of a figure. */
const MIN_RUN_WIDTH = 12;
/** Agreement above this, in the region where distinctness can live, means the same shape twice. */
const AGREEMENT_CEILING = 65;
// Where "the region where distinctness can live" ends. This gate was first written against the
// whole outline and that was wrong, for a reason that has nothing to do with any particular image:
// the base-asset spec REQUIRES identical wardrobe and an equal standing pose, so the legs and feet
// of any two figures agree strongly no matter what they are doing. Gating on the whole outline
// therefore scores compliance with the spec as if it were a defect. Measured on the first hero the
// legs agreed 74.0%, 71.5% and 93.4% between pairs -- and on its replacement, where the props and
// arm heights genuinely differ, one leg pair still agreed 83.6% and dragged that pair's whole-body
// number to 72.0% while its upper body had fallen to 58.0%.
//
// So the gate reads the top 45% -- head, torso, arms and prop -- which is the only part an arm
// height or a prop size can change. Both figures are still reported, because a lower-body number
// that has drifted apart is worth seeing: it means a pose stopped being an equal standing pose.
// The change does not soften the gate. The first hero measures 71.1 / 65.0 / 77.3 on the upper
// body and still fails, which is the check that this still catches the problem it was written for.
const UPPER_BODY_SHARE = 0.45;
/** Three figures side by side means two gaps between them. */
const FIGURE_COUNT = 3;

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

// Where the ink is, as runs of columns. A run is not the same thing as a figure: a prop held clear
// of the body -- a chart reaching past a shoulder, a board standing on the floor beside someone --
// lands as its own run, and a pale prop contributes only its darkest marks, so one figure can
// produce three runs. Cutting at every gap therefore over-segments. Cutting at the two widest gaps
// does not, and it encodes the one thing known about the picture: three figures side by side have
// exactly two gaps between them, and those are the widest ones.
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

if (runs.length < FIGURE_COUNT) {
  console.log(`\nFound ${runs.length} ink run(s), fewer than the ${FIGURE_COUNT} figures expected: `
    + runs.map(([a, b]) => `${a}-${b}`).join(", "));
  console.log("Two figures are touching, or a prop bridges the gap between them, so they cannot be");
  console.log("separated. That is a finding about the image -- the prompt asks for clear space");
  console.log("between the figures -- rather than a bug here.");
  process.exit(1);
}

const gaps = runs.slice(1).map(([left], i) => ({ at: i + 1, size: left - runs[i][1] }));
const cuts = gaps.slice().sort((a, b) => b.size - a.size).slice(0, FIGURE_COUNT - 1)
  .map((g) => g.at).sort((a, b) => a - b);
const figures = [];
for (let i = 0; i <= cuts.length; i += 1) {
  const group = runs.slice(cuts[i - 1] ?? 0, cuts[i] ?? runs.length);
  figures.push([group[0][0], group[group.length - 1][1]]);
}
if (runs.length > FIGURE_COUNT) {
  console.log(`\n  ${runs.length} ink runs grouped into ${FIGURE_COUNT} figures at the two widest gaps `
    + `(${cuts.map((c) => `${gaps.find((g) => g.at === c).size}px`).join(", ")}); `
    + `the runs merged into a figure were separated by `
    + `${gaps.filter((g) => !cuts.includes(g.at)).map((g) => `${g.size}px`).join(", ")}`);
}

// Each figure resampled to one grid, so the comparison is of shape rather than of size or position.
const silhouettes = figures.map(([left, right]) => {
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
const upperRows = Math.round(GRID_HEIGHT * UPPER_BODY_SHARE);
const agreement = (a, b, fromRow, toRow) => {
  let agree = 0;
  let total = 0;
  for (let gy = fromRow; gy < toRow; gy += 1) {
    for (let gx = 0; gx < GRID_WIDTH; gx += 1) {
      const k = gy * GRID_WIDTH + gx;
      total += 1;
      if (a[k] === b[k]) agree += 1;
    }
  }
  return agree / total * 100;
};

console.log(`\n  figure boxes: ${silhouettes.map((s, i) => `${names[i]} ${s.box}`).join("  ·  ")}`);
console.log("\n  normalised silhouette agreement:");
console.log("    pair              upper 45%          legs      whole");
console.log("                      (gated)        (context)  (context)");
let worst = 0;
for (let i = 0; i < silhouettes.length; i += 1) {
  for (let j = i + 1; j < silhouettes.length; j += 1) {
    const a = silhouettes[i].grid;
    const b = silhouettes[j].grid;
    const upper = agreement(a, b, 0, upperRows);
    const lower = agreement(a, b, upperRows, GRID_HEIGHT);
    const whole = agreement(a, b, 0, GRID_HEIGHT);
    worst = Math.max(worst, upper);
    console.log(`    ${(names[i] + " vs " + names[j]).padEnd(18)}`
      + `${upper.toFixed(1).padStart(5)}%  ${(upper > AGREEMENT_CEILING ? "TOO ALIKE" : "ok").padEnd(11)}`
      + `${lower.toFixed(1).padStart(6)}%    ${whole.toFixed(1).padStart(5)}%`);
  }
}
console.log(`\n  worst upper-body pair ${worst.toFixed(1)}% against a ${AGREEMENT_CEILING}% ceiling: `
  + `${worst > AGREEMENT_CEILING ? "FAIL" : "PASS"}`);
console.log("  For reference, the first hero measured 71.1 / 65.0 / 77.3 on the upper body -- three");
console.log("  figures all standing square to the camera holding a small pale rectangle at chest");
console.log("  height. Its legs measured 74.0 / 71.5 / 93.4, which is what the spec asks for.");
process.exit(worst > AGREEMENT_CEILING ? 1 : 0);
