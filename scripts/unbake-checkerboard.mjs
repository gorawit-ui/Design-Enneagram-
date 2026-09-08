// Recover genuine alpha from an image whose transparency checkerboard was flattened into it.
//
// The generator sometimes exports the preview instead of the asset, with the checkerboard painted
// into the pixels. Classifying each pixel as background or not cracks the garment edges, because an
// edge pixel is neither -- it is a blend of the two, and a threshold forces it to one side.
//
// This keeps the blend. The checkerboard is two known greys, so an edge pixel is
// C = a*F + (1-a)*B: take B from the nearest background pixel and F from the nearest solid one,
// and the opacity is how far C has travelled from B toward F. That yields the fractional alpha a
// threshold cannot, which is what an un-cracked edge is made of.
//
// Correlating against a modelled checkerboard grid was tried first and abandoned. It needs the
// cell each pixel sits in, and the grid is not reliably uniform: a preview upscaled from 1024 to
// 1254 carries a block of 11.02 pixels, so the phase drifts across the frame and the far corners
// come out inverted -- solid where they should be empty. Nothing here models the grid at all. The
// background is found by flooding inward from the border, so what counts as background is what is
// actually connected to the outside, and a grey garment in the middle of the figure cannot be
// mistaken for it.
//
// Usage: node scripts/unbake-checkerboard.mjs <flattened.png> <out.png>

import sharp from "sharp";

const [INPUT, OUTPUT] = process.argv.slice(2);
if (!INPUT || !OUTPUT) {
  console.error("usage: node scripts/unbake-checkerboard.mjs <flattened.png> <out.png>");
  process.exit(2);
}

const GREY_TOLERANCE = 14;   // how far a pixel may sit off a checkerboard grey and still be canvas
const CHROMA_LIMIT = 12;     // the checkerboard is neutral; anything coloured is the character
const EDGE_REACH = 3;        // how far inward the fractional band is estimated

const { data, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const at = (x, y, c) => data[(y * W + x) * C + c];
const grey = (x, y) => (at(x, y, 0) + at(x, y, 1) + at(x, y, 2)) / 3;
const chroma = (x, y) => Math.max(
  Math.abs(at(x, y, 0) - at(x, y, 1)),
  Math.abs(at(x, y, 1) - at(x, y, 2)),
  Math.abs(at(x, y, 0) - at(x, y, 2)),
);

// The two greys, from the corner strip the character never reaches.
const counts = new Map();
for (let y = 0; y < 48; y += 1) {
  for (let x = 0; x < 48; x += 1) {
    const v = Math.round(grey(x, y));
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
}
const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
const other = ranked.find((v) => Math.abs(v - ranked[0]) > 20);
if (other === undefined) throw new Error("no second grey found — is this image checkerboarded?");
const darkGrey = Math.min(ranked[0], other);
const lightGrey = Math.max(ranked[0], other);
console.log(`checkerboard greys: ${darkGrey} and ${lightGrey}`);

// The whole span between the two greys counts, not a band around each. Cell boundaries carry
// transitional values -- 148 between 128 and 191 after the preview's re-encoding -- and testing
// nearness to either grey rejected them, so they walled the flood in and left four fifths of the
// empty canvas unreached. Connectivity is what keeps this safe: a grey inside the figure is in the
// same range but the flood never arrives there.
const looksLikeCanvas = (x, y) => chroma(x, y) <= CHROMA_LIMIT
  && grey(x, y) >= darkGrey - GREY_TOLERANCE
  && grey(x, y) <= lightGrey + GREY_TOLERANCE;

// Flood inward from the border. Connectivity is what separates empty canvas from a grey garment.
const outside = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
let head = 0, tail = 0;
const push = (x, y) => {
  const i = y * W + x;
  if (outside[i] || !looksLikeCanvas(x, y)) return;
  outside[i] = 1;
  queue[tail += 1] = i;
};
for (let x = 0; x < W; x += 1) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y += 1) { push(0, y); push(W - 1, y); }
while (head < tail) {
  const i = queue[(head += 1)];
  const x = i % W, y = (i - x) / W;
  if (x > 0) push(x - 1, y);
  if (x < W - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < H - 1) push(x, y + 1);
}

const out = Buffer.alloc(W * H * 4);
let cleared = 0, solid = 0, partial = 0;

for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const i = y * W + x;
    const o = i * 4;
    if (outside[i]) { out[o + 3] = 0; cleared += 1; continue; }

    // Inside. If any canvas pixel is within reach this is the boundary band, where the pixel is a
    // blend and its opacity is how far it has travelled from the canvas grey toward solid colour.
    let nearB = null, nearF = null;
    for (let r = 1; r <= EDGE_REACH && (nearB === null || nearF === null); r += 1) {
      for (let dy = -r; dy <= r && (nearB === null || nearF === null); dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const sx = x + dx, sy = y + dy;
          if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
          const si = sy * W + sx;
          if (nearB === null && outside[si]) nearB = grey(sx, sy);
          if (nearF === null && !outside[si] && chroma(sx, sy) > CHROMA_LIMIT * 2) {
            nearF = [at(sx, sy, 0), at(sx, sy, 1), at(sx, sy, 2)];
          }
        }
      }
    }

    if (nearB === null) {                       // interior of the figure
      for (let c = 0; c < 3; c += 1) out[o + c] = at(x, y, c);
      out[o + 3] = 255;
      solid += 1;
      continue;
    }
    if (nearF === null) {                       // boundary with nothing solid nearby to un-mix from
      for (let c = 0; c < 3; c += 1) out[o + c] = at(x, y, c);
      out[o + 3] = 255;
      solid += 1;
      continue;
    }

    // Project C onto the line from B to F: how far along it sits is the opacity.
    let numerator = 0, denominator = 0;
    for (let c = 0; c < 3; c += 1) {
      const span = nearF[c] - nearB;
      numerator += (at(x, y, c) - nearB) * span;
      denominator += span * span;
    }
    const alpha = denominator > 0
      ? Math.max(0, Math.min(1, numerator / denominator))
      : 1;
    if (alpha >= 0.996) {
      for (let c = 0; c < 3; c += 1) out[o + c] = at(x, y, c);
      out[o + 3] = 255;
      solid += 1;
      continue;
    }
    if (alpha <= 0.004) { out[o + 3] = 0; cleared += 1; continue; }
    for (let c = 0; c < 3; c += 1) {
      const f = (at(x, y, c) - (1 - alpha) * nearB) / alpha;
      out[o + c] = Math.max(0, Math.min(255, Math.round(f)));
    }
    out[o + 3] = Math.round(alpha * 255);
    partial += 1;
  }
}

// Anything not connected to the figure is not the figure. A re-encoded preview leaves thousands of
// compression blotches in the empty canvas that are chromatic enough to stop the flood and survive
// as specks -- 14,343 of them on the first pass, none above 103 pixels against a figure of 280,974.
// Keeping only what is a meaningful fraction of the largest region drops them all without a
// hand-tuned pixel count.
const SPECK_FRACTION = 0.01;
{
  const seen = new Uint8Array(W * H);
  const walk = new Int32Array(W * H);
  const regions = [];
  for (let start = 0; start < W * H; start += 1) {
    if (seen[start] || out[start * 4 + 3] < 8) continue;
    let h = 0, t = 0;
    walk[t += 1] = start;
    seen[start] = 1;
    const region = [start];
    while (h < t) {
      const i = walk[(h += 1)];
      const x = i % W, y = (i - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (seen[j] || out[j * 4 + 3] < 8) continue;
        seen[j] = 1;
        walk[t += 1] = j;
        region.push(j);
      }
    }
    regions.push(region);
  }
  const largest = regions.reduce((n, r) => Math.max(n, r.length), 0);
  let dropped = 0;
  for (const region of regions) {
    if (region.length >= largest * SPECK_FRACTION) continue;
    for (const i of region) out[i * 4 + 3] = 0;
    dropped += region.length;
  }
  cleared += dropped;
  solid -= dropped;
  console.log(`dropped ${regions.length - regions.filter((r) => r.length >= largest * SPECK_FRACTION).length}`
    + ` stray region(s), ${dropped} px, largest kept ${largest} px`);
}

const pct = (n) => `${((n / (W * H)) * 100).toFixed(1)}%`;
console.log(`alpha: ${pct(cleared)} cleared, ${pct(solid)} solid, ${pct(partial)} fractional (edges)`);
await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .png({ compressionLevel: 9, palette: false }).toFile(OUTPUT);
console.log(`wrote ${OUTPUT}`);
