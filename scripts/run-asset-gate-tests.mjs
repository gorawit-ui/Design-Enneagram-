// Gate E — technical criterion, executed instead of reviewed by hand.
//
// The plan's Technical PASS reads: "12/12 are exactly 1122x1402, RGBA, true transparent". This
// script proves that from the PNG bytes, and additionally refuses to pass when a gate document
// cites evidence files that do not exist — the failure mode that left Gate E recorded as FAIL on a
// blocker that had already been resolved, with its three referenced screenshots missing.
//
// Runs in `npm test` and in CI. No browser or server required.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const projectRoot = path.resolve(import.meta.dirname, "..");
const LIVING_ROOT = path.join(projectRoot, "public/character-assets/living");
const CANVAS = { width: 1122, height: 1402 };
const MAX_BYTES = 750 * 1024;
const GATE_DOCS = ["outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md"];

const APPROVED = [];
for (const [type, action] of [["intj", "observant-curiosity"], ["istj", "observant-curiosity"],
                              ["enfp", "idea-spark"], ["esfp", "idea-spark"]]) {
  for (const presentation of ["female", "male", "neutral"]) {
    APPROVED.push(`public/character-assets/living/v1/enneagram-2/${type}/${presentation}-${action}.png`);
  }
}

/** Decode an 8-bit RGBA non-interlaced PNG to raw pixels, so alpha claims rest on bytes. */
function decodeRgba(file) {
  const data = fs.readFileSync(file);
  assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${file}: PNG signature`);
  let offset = 8;
  let header = null;
  const idat = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const body = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4),
                 bitDepth: body[8], colorType: body[9], interlace: body[12] };
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") break;
    offset += 12 + length;
  }
  assert.ok(header, `${file}: IHDR present`);
  const { width, height, bitDepth, colorType, interlace } = header;
  assert.equal(bitDepth, 8, `${file}: 8-bit channels`);
  assert.equal(colorType, 6, `${file}: colour type 6 (RGBA)`);
  assert.equal(interlace, 0, `${file}: non-interlaced`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let previous = Buffer.alloc(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = previous[i];
      const c = i >= bpp ? previous[i - bpp] : 0;
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
  return { width, height, pixels: out };
}

// --- 1. Exactly the 12 approved assets, nothing more -------------------------------------------
const onDisk = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name.endsWith(".png")) onDisk.push(path.relative(projectRoot, absolute));
  }
};
walk(LIVING_ROOT);
assert.deepEqual(onDisk.sort(), [...APPROVED].sort(),
  "public/character-assets/living holds exactly the 12 approved pilot assets (no 27/432 expansion)");

// --- 2. Technical criterion, proven from the bytes ---------------------------------------------
for (const relative of APPROVED) {
  const file = path.join(projectRoot, relative);
  const { width, height, pixels } = decodeRgba(file);
  assert.equal(width, CANVAS.width, `${relative}: width`);
  assert.equal(height, CANVAS.height, `${relative}: height`);

  const alpha = [];
  for (let i = 3; i < pixels.length; i += 4) alpha.push(pixels[i]);
  const transparent = alpha.filter((a) => a === 0).length;
  const opaque = alpha.filter((a) => a === 255).length;
  const at = (x, y) => pixels[(y * width + x) * 4 + 3];
  assert.ok(transparent > 0, `${relative}: has fully transparent pixels`);
  assert.ok(opaque > 0, `${relative}: has fully opaque pixels (not a uniformly translucent flatten)`);
  for (const [x, y, corner] of [[0, 0, "top-left"], [width - 1, 0, "top-right"],
                                [0, height - 1, "bottom-left"], [width - 1, height - 1, "bottom-right"]]) {
    assert.equal(at(x, y), 0, `${relative}: ${corner} corner is transparent (no baked background)`);
  }
  assert.ok(fs.statSync(file).size <= MAX_BYTES, `${relative}: within the ${MAX_BYTES / 1024} KB gate`);
}

// --- 3. A gate document may not cite evidence that does not exist -------------------------------
const danglingEvidence = [];
for (const relativeDoc of GATE_DOCS) {
  const docPath = path.join(projectRoot, relativeDoc);
  if (!fs.existsSync(docPath)) continue;
  const text = fs.readFileSync(docPath, "utf8");
  // Cited repo-relative paths to evidence artifacts (images/sheets), in prose or backticks.
  for (const match of text.matchAll(/(?:^|[\s`(])((?:outputs|public|docs)\/[\w./-]+\.(?:png|jpg|jpeg|svg|pdf))/g)) {
    const cited = match[1];
    if (!fs.existsSync(path.join(projectRoot, cited))) danglingEvidence.push(`${relativeDoc} -> ${cited}`);
  }
}
assert.deepEqual(danglingEvidence, [],
  "gate documents cite only evidence files that exist in the repository\n"
  + `  missing:\n    ${danglingEvidence.join("\n    ")}`);

console.log(`Asset Gate E technical checks passed: exactly ${APPROVED.length} approved assets, all `
  + `${CANVAS.width}x${CANVAS.height} 8-bit RGBA with genuine alpha and transparent corners, all within `
  + `${MAX_BYTES / 1024} KB, and every evidence file cited by a gate document exists.`);
