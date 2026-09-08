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

const BASE = { canvas: 1024, hardKb: 250, preferredKb: 180, minMarginPct: 8, safeRegionPct: 76 };

function decode(file) {
  const data = fs.readFileSync(file);
  if (!data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error(`${file}: not a PNG`);
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

/** Bounding box of pixels above an alpha threshold — i.e. where the character actually is. */
function analyse(file) {
  const { header, pixels, note } = decode(file);
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
  const total = width * height;
  const pct = (v, of) => Math.round((v / of) * 1000) / 10;
  return {
    file, header, bytes, corners,
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

const results = files.map(analyse);
const problems = [];

for (const r of results) {
  const kb = Math.round(r.bytes / 1024);
  console.log(`\n${path.basename(r.file)}`);
  console.log(`  canvas      ${r.header.width} x ${r.header.height}` +
    (r.header.width === BASE.canvas && r.header.height === BASE.canvas ? "  OK" : `  EXPECTED ${BASE.canvas} x ${BASE.canvas}`));
  console.log(`  format      colour type ${r.header.colorType}, ${r.header.bitDepth}-bit` +
    (r.header.colorType === 6 ? " (RGBA)  OK" : "  EXPECTED colour type 6 (RGBA)"));
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
  const rows = [
    ["character height", a.box.h, b.box.h, 12],
    ["character width", a.box.w, b.box.w, 20],
    ["top of head", a.box.top, b.box.top, 12],
    ["bottom of feet", a.box.bottom, b.box.bottom, 12],
    ["left edge", a.box.left, b.box.left, 25],
    ["right edge", a.box.right, b.box.right, 25],
  ];
  for (const [label, av, bv, tolerance] of rows) {
    const diff = bv - av;
    const flag = Math.abs(diff) > tolerance ? `  DIFFERS by ${diff > 0 ? "+" : ""}${diff}px (tolerance ${tolerance})` : "  ok";
    console.log(`  ${label.padEnd(18)} ${String(av).padStart(5)} -> ${String(bv).padStart(5)}${flag}`);
    if (Math.abs(diff) > tolerance) problems.push(`parity: ${label} differs by ${diff > 0 ? "+" : ""}${diff}px`);
  }
  console.log(`\n  Body build, height and silhouette must not change between presentations.`);
  console.log(`  Only face and hair may differ, so these boxes should line up closely.`);
}

console.log("");
if (problems.length) {
  console.log(`FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("PASS — every mechanical check is clean. Visual, parity-of-detail and bias review are still human.");
