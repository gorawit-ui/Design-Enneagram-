// Graft a male head onto the approved female master's body, leaving the body untouched.
//
// This is the head-only retouch the parity contract actually asks for. The generator cannot do it:
// asked to change only the head it redraws the whole figure, and asked to hard-cut at a row it
// leaves a visible step at the chin and collar. Doing it here costs no image generation at all.
//
// Three things make the join read as one figure rather than two halves:
//   - the body is never touched, so every pixel from the seam down is the master's own
//   - the master's own garment is drawn back over the donor's neck, so the collar and lapels sit
//     in front of it the way they do on the master
//   - the donor is admitted only inside a window that tapers to the collar opening, which excludes
//     the donor's own blazer and its differently-drawn shoulders
//
// Usage: node scripts/graft-head.mjs <donor.png> <out.png>

import sharp from "sharp";

const MASTER = "outputs/asset-masters/enneagram-1/female-master.png";
const [DONOR, OUT] = process.argv.slice(2);

const SEAM = 210;                          // master row where the locked body begins
// Scale and drop are tunable because the two are in tension: the scale that matches the donor's
// neck to the collar opening (982/806, the body-height ratio) makes its head tall enough to run
// off the top of the canvas, so the head is dropped a few rows to buy the clearance back.
const S = Number(process.env.GRAFT_SCALE ?? 982 / 806);
const DROP = Number(process.env.GRAFT_DROP ?? 23);
const DONOR_ANCHOR = { x: 491, y: 270 };          // donor neck centre at its own collar
const MASTER_ANCHOR = { x: 500, y: SEAM + DROP }; // where that neck centre lands on the master

const isSkin = (R, G, B) => R > 110 && R > G && G > B && R - B > 25 && R - B < 130 && G - B > 5;
// Hair and skin are what has to go when the head is replaced. Both read warm -- red above green
// above blue -- and neither is bright enough to be the ivory knit. The blazer never matches,
// because its green channel leads.
const isHeadMatter = (R, G, B) => R > G && G >= B && R - B >= 16 && (R + G + B) / 3 <= 175;

async function load(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height, C: info.channels };
}
const at = (img, x, y, c) => img.data[(y * img.W + x) * img.C + c];

function meanSkin(img, y0, y1) {
  const sum = [0, 0, 0]; let n = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = 0; x < img.W; x += 1) {
      if (at(img, x, y, img.C - 1) <= 200) continue;
      const R = at(img, x, y, 0), G = at(img, x, y, 1), B = at(img, x, y, 2);
      if (!isSkin(R, G, B)) continue;
      sum[0] += R; sum[1] += G; sum[2] += B; n += 1;
    }
  }
  return n ? sum.map((v) => v / n) : null;
}

function bilinear(img, fx, fy, out) {
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  for (let c = 0; c < 4; c += 1) {
    let acc = 0;
    for (let dy = 0; dy < 2; dy += 1) {
      for (let dx = 0; dx < 2; dx += 1) {
        const x = Math.min(img.W - 1, Math.max(0, x0 + dx));
        const y = Math.min(img.H - 1, Math.max(0, y0 + dy));
        acc += at(img, x, y, c) * (dx ? tx : 1 - tx) * (dy ? ty : 1 - ty);
      }
    }
    out[c] = acc;
  }
}

const master = await load(MASTER);
const donor = await load(DONOR);

// Compare the two necks where they are lit and shaded alike -- just above the collar on both --
// rather than across the collar, which would read a lighting difference as a skin-tone difference.
const donorRow = (y) => (y - MASTER_ANCHOR.y) / S + DONOR_ANCHOR.y;
const masterSkin = meanSkin(master, SEAM - 12, SEAM - 2);
const donorSkin = meanSkin(donor, Math.round(donorRow(SEAM - 12)), Math.round(donorRow(SEAM - 2)));
const shift = masterSkin.map((v, i) => v - donorSkin[i]);
console.log(`neck skin — master ${masterSkin.map(Math.round)} · donor ${donorSkin.map(Math.round)}`);
console.log(`colour shift applied to the head: ${shift.map((v) => v.toFixed(1))}`);

const out = Buffer.alloc(master.W * master.H * 4);
const px = new Float64Array(4);

for (let y = 0; y < master.H; y += 1) {
  const fy = donorRow(y);
  // The window the donor may fill is the master's own outline on this row, widened slightly. A
  // straight taper was tried first and left a hard diagonal edge across the jaw where it clipped
  // the donor's neck; the master's outline cannot, because it is the shape the head has to fit.
  // Near the seam it widens into the shoulders, which is harmless -- only skin is admitted there,
  // so the donor's own blazer still cannot enter.
  let lo = master.W, hi = -1;
  for (let x = 0; x < master.W; x += 1) {
    if (at(master, x, y, master.C - 1) < 8) continue;
    if (x < lo) lo = x;
    hi = x;
  }
  lo -= 4; hi += 4;

  for (let x = 0; x < master.W; x += 1) {
    const o = (y * master.W + x) * 4;
    const mR = at(master, x, y, 0), mG = at(master, x, y, 1), mB = at(master, x, y, 2);
    const mA = at(master, x, y, master.C - 1);

    if (y >= SEAM) {                                  // locked: the master, byte for byte
      out[o] = mR; out[o + 1] = mG; out[o + 2] = mB; out[o + 3] = mA;
      continue;
    }

    // 1. the donor's head, inside the window
    if (x >= lo && x <= hi) {
      const fx = (x - MASTER_ANCHOR.x) / S + DONOR_ANCHOR.x;
      if (fx >= 0 && fx < donor.W - 1 && fy >= 0 && fy < donor.H - 1) {
        bilinear(donor, fx, fy, px);
        // Near the seam only skin is admitted, and only where the donor drew it solidly. Its
        // silhouette edge carries half-transparent pixels tinted by its own collar and hair, and
        // those are what speckle a join with dark and light grit.
        const nearSeam = y >= SEAM - 45;
        const solid = px[3] >= (nearSeam ? 200 : 32);
        const wanted = !nearSeam || isSkin(px[0], px[1], px[2]);
        if (solid && wanted) {
          for (let c = 0; c < 3; c += 1) out[o + c] = Math.max(0, Math.min(255, Math.round(px[c] + shift[c])));
          out[o + 3] = Math.round(px[3]);
        }
      }
    }

    // 2. Outside the window the master is body, not head -- the blazer shoulders and lapels that
    // rise above the seam -- so it is kept. Colour cannot make this call: the master's hair in
    // shadow measures 54,60,47 and its blazer 59,69,54, close enough that a colour rule keeps a
    // dark strand of the wrong hair and traces it as an outline down the new neck. Position can:
    // inside the window there is only head. The one exception is her hair falling past the window
    // onto the shoulder, which is head matter wherever it lands.
    else if (mA >= 128 && !isHeadMatter(mR, mG, mB)) {
      out[o] = mR; out[o + 1] = mG; out[o + 2] = mB; out[o + 3] = mA;
    }
  }
}

// Admitting only solid skin near the seam can leave a hair-thin gap between the neck and the
// collar. Closing it by stretching the row's own edge pixels inward keeps the neck's colour and
// shading; painting a flat fill would read as a band.
for (let y = SEAM - 45; y < SEAM; y += 1) {
  let lo = -1, hi = -1;
  for (let x = 0; x < master.W; x += 1) {
    if (out[(y * master.W + x) * 4 + 3] < 200) continue;
    if (lo < 0) lo = x;
    hi = x;
  }
  if (lo < 0) continue;
  for (let x = lo; x <= hi; x += 1) {
    const o = (y * master.W + x) * 4;
    if (out[o + 3] >= 200) continue;
    let left = x, right = x;
    while (left > lo && out[(y * master.W + left) * 4 + 3] < 200) left -= 1;
    while (right < hi && out[(y * master.W + right) * 4 + 3] < 200) right += 1;
    const from = (x - left <= right - x ? left : right) * 4 + y * master.W * 4;
    for (let c = 0; c < 4; c += 1) out[o + c] = out[from + c];
  }
}

// Remove what the masks left stranded. Counting neighbours is not enough -- a mole-sized clump of
// half a dozen pixels has plenty of neighbours and still floats beside the jaw. What marks a speck
// is that it belongs to no connected region of any size, so the whole area is labelled and every
// region below a threshold is dropped. The head itself is thousands of pixels and never qualifies.
const SPECK_LIMIT = 120;
const seen = new Uint8Array(master.W * SEAM);
const queue = new Int32Array(master.W * SEAM);
for (let start = 0; start < master.W * SEAM; start += 1) {
  if (seen[start] || out[start * 4 + 3] < 8) continue;
  let head = 0, tail = 0;
  queue[tail += 1] = start;
  seen[start] = 1;
  const region = [start];
  while (head < tail) {
    const at = queue[(head += 1)];
    const ax = at % master.W, ay = (at - ax) / master.W;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = ax + dx, ny = ay + dy;
        if (nx < 0 || ny < 0 || nx >= master.W || ny >= SEAM) continue;
        const n = ny * master.W + nx;
        if (seen[n] || out[n * 4 + 3] < 8) continue;
        seen[n] = 1;
        queue[tail += 1] = n;
        region.push(n);
      }
    }
  }
  if (region.length <= SPECK_LIMIT) for (const i of region) out[i * 4 + 3] = 0;
}

await sharp(out, { raw: { width: master.W, height: master.H, channels: 4 } })
  .png({ compressionLevel: 9, palette: false }).toFile(OUT);
console.log(`wrote ${OUT}`);
