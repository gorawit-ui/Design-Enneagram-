// Inspect one candidate character asset before it enters the repo.
//
// Reports what the eye cannot judge from a chat preview: whether the alpha is genuine, whether the
// corners are actually transparent, how much transparent margin there really is, and where the
// character sits in the canvas. Pass two files to compare a trio member against its master — the
// bounding-box columns are what the parity criterion turns on.
//
// Usage:
//   npm run assets:check -- path/to/female.png
//   npm run assets:check -- path/to/female.png path/to/male.png    (second is compared to first)

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import sharp from "sharp";

const BASE = { canvas: 1024, hardKb: 250, preferredKb: 180, minMarginPct: 8, safeRegionPct: 76 };
const PROFILE_BANDS = 40;
// A band may sit this far off the master before the two figures count as different builds. Bands
// are widths as a fraction of body height, so 0.02 is 2% of the figure's own height -- roughly a
// third of a shoulder's worth. Anything under it is resampling noise.
const BUILD_TOLERANCE = 0.02;
// A derivative comes back re-encoded, so identical rows are not bit-identical. This is the largest
// per-channel drift still counted as unchanged.
const RE_ENCODE_TOLERANCE = 2;
// The per-presentation builds are recorded in proportions.json by `npm run assets:proportions
// -- --record`. Read them rather than repeating them here: a master that gets regenerated moves
// these numbers, and advice that still quotes the old build is worse than no advice.
const PROPORTIONS_FILE = path.join("outputs", "asset-masters", "proportions.json");
const FALLBACK = "each master's shoulders sit at its own multiple of its own head width";
function recordedBuilds() {
  let recorded;
  try {
    recorded = JSON.parse(fs.readFileSync(PROPORTIONS_FILE, "utf8"));
  } catch {
    return [FALLBACK];
  }
  const parts = Object.entries(recorded)
    .filter(([, v]) => typeof v?.shoulderToHead === "number")
    .map(([name, v]) => `${name}: shoulders ${v.shoulderToHead} head-widths, head ${v.headWidthPct}% of height`);
  if (!parts.length) return [FALLBACK];
  return parts;
}
// Which part of the body each band falls in, for naming the failure rather than just numbering it.
// The boundaries are measured off the approved master rather than assumed: on a standing full-body
// figure the head and hair reach almost a fifth of the way down, so a 13% head band mislabels the
// jaw as a shoulder and then reports a haircut as a build defect.
const HEAD_BAND = 0.20;
function bodyPart(band) {
  const down = band / PROFILE_BANDS;
  if (down < HEAD_BAND) return "head / hair";
  if (down < 0.25) return "shoulders";
  if (down < 0.45) return "torso / arms / prop";
  if (down < 0.53) return "hips";
  if (down < 0.92) return "legs";
  return "feet";
}

// PNGs are parsed by hand because colour type and bit depth are gate criteria, and reading them
// out of IHDR proves them from the bytes rather than from a library's interpretation. Other
// formats -- the WebP the base assets now ship as -- go through sharp, which reports the same
// facts for them.
async function decodeWithSharp(file) {
  const image = sharp(file);
  const meta = await image.metadata();
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i += 1) {
    for (let c = 0; c < 4; c += 1) pixels[i * 4 + c] = data[i * info.channels + c];
  }
  return {
    header: { width: info.width, height: info.height, bitDepth: (meta.depth === "uchar" ? 8 : 0),
              colorType: 6, interlace: 0, format: meta.format },
    pixels,
  };
}

async function decode(file) {
  const data = fs.readFileSync(file);
  if (!data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return decodeWithSharp(file);
  }
  let offset = 8, header = null;
  const idat = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const body = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4),
                 bitDepth: body[8], colorType: body[9], interlace: body[12] };
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  const { width, height, bitDepth, colorType, interlace } = header;
  if (colorType !== 6 || bitDepth !== 8 || interlace !== 0) {
    return { header, pixels: null, note: "not 8-bit RGBA non-interlaced — alpha cannot be read" };
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let previous = Buffer.alloc(stride), p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = previous[i], c = i >= bpp ? previous[i - bpp] : 0;
      if (filter === 1) line[i] = (line[i] + a) & 0xff;
      else if (filter === 2) line[i] = (line[i] + b) & 0xff;
      else if (filter === 3) line[i] = (line[i] + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        line[i] = (line[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
    }
    line.copy(out, y * stride);
    previous = line;
  }
  return { header, pixels: out };
}

/** Silhouette width per band over a given box, each as a fraction of that box's height. */
function profileOf(pixels, width, box) {
  const boxHeight = box.bottom - box.top;
  const bands = [];
  for (let band = 0; band < PROFILE_BANDS; band += 1) {
    const y0 = box.top + Math.floor((boxHeight * band) / PROFILE_BANDS);
    const y1 = box.top + Math.floor((boxHeight * (band + 1)) / PROFILE_BANDS);
    let bandMin = width, bandMax = -1;
    for (let y = y0; y < y1; y += 1) {
      for (let x = box.left; x < box.right; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] <= 16) continue;
        if (x < bandMin) bandMin = x;
        if (x > bandMax) bandMax = x;
      }
    }
    bands.push(bandMax < 0 ? 0 : (bandMax - bandMin + 1) / boxHeight);
  }
  return bands;
}

/** Bounding box of pixels above an alpha threshold — i.e. where the character actually is. */
async function analyse(file) {
  const { header, pixels, note } = await decode(file);
  const { width, height } = header;
  const bytes = fs.statSync(file).size;
  if (!pixels) return { file, header, bytes, note };

  let zero = 0, full = 0;
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = pixels[(y * width + x) * 4 + 3];
      if (a === 0) zero++; else if (a === 255) full++;
      if (a > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const at = (x, y) => pixels[(y * width + x) * 4 + 3];
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];

  // Silhouette width sampled in bands from the top of the head to the soles, each expressed as a
  // fraction of the figure's own height. Dividing by its own height is what makes it comparable:
  // it cancels out how large the figure was drawn, so what remains is build alone. Framing is what
  // the margin numbers above are for; this answers the different question of whether two
  // presentations are the same person.
  const profile = maxY >= minY
    ? profileOf(pixels, width, { top: minY, bottom: maxY + 1, left: minX, right: maxX + 1 })
    : [];
  const total = width * height;
  const pct = (v, of) => Math.round((v / of) * 1000) / 10;
  return {
    file, header, bytes, corners, profile, pixels,
    transparentPct: pct(zero, total), opaquePct: pct(full, total),
    box: { left: minX, right: width - 1 - maxX, top: minY, bottom: height - 1 - maxY,
           w: maxX - minX + 1, h: maxY - minY + 1 },
    margin: { left: pct(minX, width), right: pct(width - 1 - maxX, width),
              top: pct(minY, height), bottom: pct(height - 1 - maxY, height) },
    occupancy: { w: pct(maxX - minX + 1, width), h: pct(maxY - minY + 1, height) },
  };
}

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: npm run assets:check -- <file.png> [compare.png]"); process.exit(2); }

const results = await Promise.all(files.map(analyse));
const problems = [];

for (const r of results) {
  const kb = Math.round(r.bytes / 1024);
  console.log(`\n${path.basename(r.file)}`);
  console.log(`  canvas      ${r.header.width} x ${r.header.height}` +
    (r.header.width === BASE.canvas && r.header.height === BASE.canvas ? "  OK" : `  EXPECTED ${BASE.canvas} x ${BASE.canvas}`));
  console.log(r.header.format
    ? `  format      ${r.header.format}, 4-channel with alpha  OK`
    : `  format      colour type ${r.header.colorType}, ${r.header.bitDepth}-bit`
      + (r.header.colorType === 6 ? " (RGBA)  OK" : "  EXPECTED colour type 6 (RGBA)"));
  console.log(`  size        ${kb} KB` + (kb <= BASE.preferredKb ? "  OK" : kb <= BASE.hardKb ? "  over the 180 KB preference, within the 250 KB gate" : `  OVER the ${BASE.hardKb} KB hard gate`));
  if (r.note) { console.log(`  ${r.note}`); problems.push(`${path.basename(r.file)}: ${r.note}`); continue; }
  console.log(`  alpha       ${r.transparentPct}% fully transparent, ${r.opaquePct}% fully opaque`);
  console.log(`  corners     [${r.corners.join(", ")}]` + (r.corners.every((c) => c === 0) ? "  OK (all transparent)" : "  NOT all transparent — background is baked in"));
  console.log(`  margin      top ${r.margin.top}%  bottom ${r.margin.bottom}%  left ${r.margin.left}%  right ${r.margin.right}%   (min ${BASE.minMarginPct}%)`);
  console.log(`  character   ${r.box.w} x ${r.box.h} px — fills ${r.occupancy.w}% wide, ${r.occupancy.h}% tall`);

  if (r.header.width !== BASE.canvas || r.header.height !== BASE.canvas) problems.push(`${path.basename(r.file)}: canvas is ${r.header.width}x${r.header.height}, expected ${BASE.canvas}x${BASE.canvas}`);
  if (kb > BASE.hardKb) problems.push(`${path.basename(r.file)}: ${kb} KB exceeds the ${BASE.hardKb} KB hard gate`);
  if (!r.corners.every((c) => c === 0)) problems.push(`${path.basename(r.file)}: corners are not transparent`);
  if (r.transparentPct === 0) problems.push(`${path.basename(r.file)}: no transparent pixels at all`);
  const tight = Object.entries(r.margin).filter(([, v]) => v < BASE.minMarginPct);
  if (tight.length) problems.push(`${path.basename(r.file)}: margin below ${BASE.minMarginPct}% on ${tight.map(([k, v]) => `${k} (${v}%)`).join(", ")}`);
}

if (results.length === 2 && results[0].box && results[1].box) {
  const [a, b] = results;
  console.log(`\nParity comparison — ${path.basename(b.file)} against ${path.basename(a.file)}`);
  // Compare as a share of each image's own canvas. Raw pixels are meaningless when the two files
  // were generated at different canvas sizes — that reads as a huge parity failure when the figures
  // may in fact be proportionally identical.
  if (a.header.width !== b.header.width || a.header.height !== b.header.height) {
    console.log(`  NOTE: canvases differ (${a.header.width}x${a.header.height} vs `
      + `${b.header.width}x${b.header.height}); comparing as a share of each canvas.`);
  }
  const share = (r) => ({
    "character height": r.occupancy.h, "character width": r.occupancy.w,
    "top of head": r.margin.top, "bottom of feet": r.margin.bottom,
    "left edge": r.margin.left, "right edge": r.margin.right,
  });
  const TOLERANCE_PP = 2;   // percentage points
  const av = share(a), bv = share(b);
  for (const label of Object.keys(av)) {
    const diff = Math.round((bv[label] - av[label]) * 10) / 10;
    const over = Math.abs(diff) > TOLERANCE_PP;
    console.log(`  ${label.padEnd(18)} ${String(av[label]).padStart(6)}% -> ${String(bv[label]).padStart(6)}%`
      + (over ? `  DIFFERS by ${diff > 0 ? "+" : ""}${diff}pp (tolerance ${TOLERANCE_PP}pp)` : "  ok"));
    if (over) problems.push(`parity: ${label} differs by ${diff > 0 ? "+" : ""}${diff} percentage points`);
  }
  console.log("  Framing differences are placement, not build — `npm run assets:normalize` resets");
  console.log("  both files to the same canvas, margin and scale, so fix them there, not by");
  console.log("  regenerating the image.");

  // Build parity is the question framing cannot answer: with size and placement divided out, is
  // this still the same person? Nothing downstream can repair a difference here -- a narrower
  // shoulder line has to be redrawn -- so it is reported separately from the framing numbers above.
  if (a.pixels && b.pixels) {
    // Sample both figures over one shared box rather than each over its own. A shorter haircut
    // moves a figure's own box by a few rows, which slides every band onto slightly different
    // anatomy and reports the shift as a build difference -- and hair is the one thing the parity
    // criterion allows to differ.
    const shared = {
      top: Math.min(a.box.top, b.box.top),
      left: Math.min(a.box.left, b.box.left),
      bottom: Math.max(a.header.height - a.box.bottom, b.header.height - b.box.bottom),
      right: Math.max(a.header.width - a.box.right, b.header.width - b.box.right),
    };
    const sharedProfile = (img) => profileOf(img.pixels, img.header.width, shared);
    const pa = sharedProfile(a), pb = sharedProfile(b);
    const deltas = pb.map((value, band) => ({ band, delta: value - pa[band] }));
    const off = deltas.filter((d) => Math.abs(d.delta) > BUILD_TOLERANCE);
    console.log(`\nBuild parity — silhouette width per band, each as a share of the figure's own`);
    console.log(`height, so how large or where it was drawn cannot affect it.`);
    if (!off.length) {
      console.log(`  ok — all ${PROFILE_BANDS} bands within ${BUILD_TOLERANCE} of the master.`);
    } else {
      const byPart = new Map();
      for (const d of off) {
        const part = bodyPart(d.band);
        const worst = byPart.get(part);
        if (!worst || Math.abs(d.delta) > Math.abs(worst.delta)) byPart.set(part, d);
      }
      for (const [part, d] of byPart) {
        const master = pa[d.band];
        const relative = master > 0 ? Math.round((d.delta / master) * 100) : 0;
        console.log(`  ${part.padEnd(20)} ${d.delta > 0 ? "+" : ""}${d.delta.toFixed(3)} `
          + `(${relative > 0 ? "+" : ""}${relative}% ${d.delta < 0 ? "narrower" : "wider"} than the master, band ${d.band})`);
        // Face and hair are the one thing a presentation is allowed to change, so a difference in
        // the head band is reported and not counted against the build.
        if (part === "head / hair") continue;
        problems.push(`build: ${part} is ${Math.abs(relative)}% ${d.delta < 0 ? "narrower" : "wider"} `
          + `than the master — this cannot be fixed after generation`);
      }
      console.log(`  ${off.length} of ${PROFILE_BANDS} bands are outside the ${BUILD_TOLERANCE} tolerance.`);
    }
  }

  // When a derivative is produced by locking the master's body and redrawing only the head, the
  // question that settles whether the instruction was obeyed is simply: from which row down are
  // the two files the same picture? Reporting it needs no argument and no guessing -- a derivative
  // that redrew the whole figure has no such row at all.
  if (a.pixels && b.pixels && a.header.width === b.header.width && a.header.height === b.header.height) {
    const { width, height } = a.header;
    const sameRow = (y) => {
      let differing = 0;
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        // Colour stored under a fully transparent pixel is not part of the picture, and WebP
        // discards it, so comparing it reports two identical pictures as different everywhere the
        // transparent area happens to differ.
        if (a.pixels[i + 3] === 0 && b.pixels[i + 3] === 0) continue;
        for (let c = 0; c < 4; c += 1) {
          if (Math.abs(a.pixels[i + c] - b.pixels[i + c]) > RE_ENCODE_TOLERANCE) { differing += 1; break; }
        }
      }
      return differing <= width * 0.001;   // a thousandth of a row absorbs re-encoding noise
    };
    let lockRow = height;
    while (lockRow > 0 && sameRow(lockRow - 1)) lockRow -= 1;
    console.log(`\nLocked region — the two files are the same picture from row ${lockRow} downward`);
    if (lockRow >= height) {
      console.log(`  nothing is shared: every row differs, so the figure was redrawn rather than edited.`);
      problems.push("locked region: no rows are shared with the master — the whole figure was redrawn");
    } else {
      console.log(lockRow === 0
        ? `  every row is identical — the two files are the same picture.`
        : `  rows ${lockRow}-${height - 1} are identical; rows 0-${lockRow - 1} were redrawn.`);
    }
  }

  console.log("\n  Compare a core against its OWN presentation's master. Since 2026-09-08 each");
  console.log("  presentation is a locked character with its own build:");
  for (const line of recordedBuilds()) console.log(`    ${line}`);
  console.log("  so a cross-presentation reading here is expected to differ and says nothing");
  console.log("  about either being wrong.");
  console.log("  What no check can decide is the criterion that replaced the shared build: that");
  console.log("  no presentation reads as more capable or more dominant. That needs human eyes.");
}

console.log("");
if (problems.length) {
  console.log(`FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("PASS — every mechanical check is clean. Visual, parity-of-detail and bias review are still human.");
