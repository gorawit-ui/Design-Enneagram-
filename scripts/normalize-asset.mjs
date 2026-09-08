// Turn a raw generated character image into a spec-compliant base asset.
//
// The generator cannot be prompted into the two mechanical criteria: it has never honoured the
// 8% transparent margin, and it has no control at all over file size. This script fixes both
// after the fact, so a returned image is never rejected — and a generation never spent again —
// for anything a resize and a re-encode can settle.
//
// What it does: find the character by its alpha bounding box, scale it to sit inside the central
// safe region, centre it on a transparent 1024x1024 canvas, then encode at the smallest size that
// still passes the gate. Colours, pose and edges are never repainted, only resampled.
//
// Usage:
//   npm run assets:normalize -- input.png --out public/character-assets/base/v1/core-1/female.webp
//   npm run assets:normalize -- input.png --dry          (report only, writes nothing)
//   npm run assets:normalize -- input.png --sizes        (also print what each format would cost)

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE = { canvas: 1024, hardKb: 250, preferredKb: 180, minMarginPct: 8, safeRegionPct: 76 };
const ALPHA_FLOOR = 8;   // below this an edge pixel is invisible; it must not widen the bounding box
const UPSCALE_WARN = 1.15;

function parseArgs(argv) {
  const args = { input: null, out: null, fit: BASE.safeRegionPct, dry: false, sizes: false,
                 cleanAlpha: true };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--out") args.out = argv[++i];
    else if (token === "--fit") args.fit = Number(argv[++i]);
    else if (token === "--dry") args.dry = true;
    else if (token === "--sizes") args.sizes = true;
    else if (token === "--keep-alpha") args.cleanAlpha = false;
    else if (token.startsWith("--")) throw new Error(`unknown option ${token}`);
    else if (args.input === null) args.input = token;
    else throw new Error(`unexpected extra argument ${token}`);
  }
  if (!args.input) throw new Error("no input file given");
  if (!Number.isFinite(args.fit) || args.fit <= 0 || args.fit > 100) {
    throw new Error(`--fit must be a percentage between 0 and 100, got ${args.fit}`);
  }
  return args;
}

// Background removal leaves two residues that no eye can catch in a chat preview: a haze of
// alpha 1-8 where the old background was, and a body that stops just short of opaque (alpha 251-254),
// which makes the character render faintly see-through over the Scene Kit. Both are repaired by
// snapping the two ends of the range; the genuine anti-aliased edge band in between is untouched.
const HAZE_CEILING = 8;
const OPAQUE_FLOOR = 250;

function repairAlpha(pixels, channels) {
  let hazeCleared = 0;
  let bodyMadeOpaque = 0;
  for (let i = channels - 1; i < pixels.length; i += channels) {
    const a = pixels[i];
    if (a > 0 && a <= HAZE_CEILING) { pixels[i] = 0; hazeCleared += 1; }
    else if (a >= OPAQUE_FLOOR && a < 255) { pixels[i] = 255; bodyMadeOpaque += 1; }
  }
  return { hazeCleared, bodyMadeOpaque };
}

// The alpha bounding box is the character. Everything outside it is empty canvas the generator
// happened to leave, and is exactly what the margin criterion is measured against.
function boundingBox(alpha, width, height) {
  let top = -1, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (alpha[row + x] <= ALPHA_FLOOR) continue;
      if (top === -1) top = y;
      bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (top === -1) throw new Error("the image is fully transparent — nothing to normalize");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function marginsOf(box, canvas) {
  const pct = (value) => Number(((value / canvas) * 100).toFixed(2));
  return {
    left: pct(box.left),
    right: pct(canvas - (box.left + box.width)),
    top: pct(box.top),
    bottom: pct(canvas - (box.top + box.height)),
  };
}

// Every encoding is measured, but only the lossless ones may be written. A palette PNG throws away
// colour the gate requires as RGBA, and a lossy WebP throws away the artwork itself; both are
// reported under --sizes only, so the format choice is made against real numbers rather than in
// the abstract. The spec names WebP as the runtime format for base assets.
async function encodeCandidates(pipeline) {
  const clone = () => pipeline.clone();
  return [
    { label: "png (RGBA)", ext: "png", lossless: true,
      buffer: await clone().png({ compressionLevel: 9, palette: false }).toBuffer() },
    { label: "webp (lossless)", ext: "webp", lossless: true,
      buffer: await clone().webp({ lossless: true, effort: 6 }).toBuffer() },
    { label: "png (palette)", ext: "png", lossless: false, why: "colour type 3, not RGBA",
      buffer: await clone().png({ palette: true, quality: 100, effort: 10 }).toBuffer() },
    { label: "webp (quality 92)", ext: "webp", lossless: false, why: "lossy",
      buffer: await clone().webp({ quality: 92, alphaQuality: 100, effort: 6 }).toBuffer() },
  ];
}

// The WebP equivalent of the PNG read-back below: prove the encoder kept the alpha channel and the
// canvas, rather than assuming the options took effect.
async function assertAlphaWebp(buffer, label) {
  const meta = await sharp(buffer).metadata();
  if (meta.format !== "webp") throw new Error(`${label} did not encode as WebP`);
  if (!meta.hasAlpha) throw new Error(`${label} lost its alpha channel`);
  if (meta.width !== BASE.canvas || meta.height !== BASE.canvas) {
    throw new Error(`${label} encoded at ${meta.width}x${meta.height}, not ${BASE.canvas}x${BASE.canvas}`);
  }
}

// Read the encoder's own output back rather than trusting the options we passed it. sharp will
// quietly choose a palette when it thinks that is better, which produces a file the gate rejects.
function assertRgbaPng(buffer, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error(`${label} is not a PNG`);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`${label} encoded as bit depth ${bitDepth}, colour type ${colorType}, `
      + `interlace ${interlace} — the gate requires 8-bit colour type 6, non-interlaced`);
  }
}

const kb = (buffer) => Math.round(buffer.length / 1024);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = sharp(args.input).ensureAlpha();
  const meta = await source.metadata();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });

  const repair = args.cleanAlpha ? repairAlpha(data, info.channels) : null;

  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = data[i * info.channels + (info.channels - 1)];
  const box = boundingBox(alpha, info.width, info.height);

  console.log(`input        ${path.basename(args.input)}`);
  console.log(`  canvas     ${info.width}x${info.height}  (${kb(fs.readFileSync(args.input))} KB, ${meta.format})`);
  console.log(`  character  ${box.width}x${box.height} at (${box.left}, ${box.top})`);
  console.log(`  margins    ${JSON.stringify(marginsOf(box, Math.max(info.width, info.height)))}`);
  if (repair) {
    console.log(`  alpha      repaired — ${repair.hazeCleared} haze pixel(s) cleared, `
      + `${repair.bodyMadeOpaque} body pixel(s) made fully opaque`);
  } else {
    console.log("  alpha      left as-is (--keep-alpha)");
  }

  const touchesEdge = box.left === 0 || box.top === 0
    || box.left + box.width === info.width || box.top + box.height === info.height;
  if (touchesEdge) {
    console.log("  WARNING    the character touches the canvas edge — it may already be cropped in "
      + "the source. Normalizing cannot restore pixels the generator never drew.");
  }

  const target = Math.round(BASE.canvas * (args.fit / 100));
  const scale = target / Math.max(box.width, box.height);
  const scaledWidth = Math.max(1, Math.round(box.width * scale));
  const scaledHeight = Math.max(1, Math.round(box.height * scale));
  if (scale > UPSCALE_WARN) {
    console.log(`  WARNING    the character occupies little of the source, so it is being enlarged `
      + `${scale.toFixed(2)}x. Fine detail will soften.`);
  }

  const subject = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
    .resize(scaledWidth, scaledHeight, { kernel: "lanczos3", fit: "fill" })
    .png()   // raw input carries no format, so the intermediate needs one named; PNG is lossless
    .toBuffer();

  const pipeline = sharp({
    create: { width: BASE.canvas, height: BASE.canvas, channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{
    input: subject,
    left: Math.round((BASE.canvas - scaledWidth) / 2),
    top: Math.round((BASE.canvas - scaledHeight) / 2),
  }]);

  const candidates = await encodeCandidates(pipeline);
  const wantedExt = args.out ? path.extname(args.out).slice(1).toLowerCase() : "webp";
  const chosen = candidates.find((c) => c.lossless && c.ext === wantedExt);
  if (!chosen) {
    throw new Error(`--out must end in .webp or .png; .${wantedExt} is not a format this script writes`);
  }
  if (chosen.ext === "png") assertRgbaPng(chosen.buffer, chosen.label);
  else await assertAlphaWebp(chosen.buffer, chosen.label);

  const outBox = { left: Math.round((BASE.canvas - scaledWidth) / 2),
                   top: Math.round((BASE.canvas - scaledHeight) / 2),
                   width: scaledWidth, height: scaledHeight };
  const outMargins = marginsOf(outBox, BASE.canvas);
  const smallestMargin = Math.min(...Object.values(outMargins));

  console.log(`output       ${BASE.canvas}x${BASE.canvas} RGBA`);
  console.log(`  character  ${scaledWidth}x${scaledHeight} centred`);
  console.log(`  margins    ${JSON.stringify(outMargins)}`);

  if (args.sizes) {
    console.log("  encodings");
    for (const c of candidates) {
      const note = c.lossless ? "lossless — may be written" : `never written — ${c.why}`;
      console.log(`    ${c.label.padEnd(20)} ${String(kb(c.buffer)).padStart(4)} KB   ${note}`);
    }
  }

  const checks = [
    [`margin >= ${BASE.minMarginPct}% on every side`, smallestMargin >= BASE.minMarginPct, `${smallestMargin}%`],
    [`character inside the central ${BASE.safeRegionPct}%`,
      args.fit <= BASE.safeRegionPct, `fitted to ${args.fit}%`],
    [`<= ${BASE.hardKb} KB (hard gate)`, kb(chosen.buffer) <= BASE.hardKb, `${kb(chosen.buffer)} KB as ${chosen.label}`],
    [`<= ${BASE.preferredKb} KB (preferred)`, kb(chosen.buffer) <= BASE.preferredKb, `${kb(chosen.buffer)} KB`],
  ];
  console.log("checks");
  let hardFailure = false;
  for (const [name, ok, detail] of checks) {
    const preferred = name.includes("preferred");
    if (!ok && !preferred) hardFailure = true;
    console.log(`  ${ok ? "PASS" : preferred ? "note" : "FAIL"}  ${name} — ${detail}`);
  }

  if (args.dry) {
    console.log("\n--dry: nothing was written.");
    return hardFailure ? 1 : 0;
  }
  if (!args.out) {
    console.log("\nNo --out given, so nothing was written. Re-run with --out <path> to save it.");
    return hardFailure ? 1 : 0;
  }
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, chosen.buffer);
  console.log(`\nwrote ${args.out} (${kb(chosen.buffer)} KB, ${chosen.label})`);
  return hardFailure ? 1 : 0;
}

main().then((code) => { process.exitCode = code; }, (error) => {
  console.error(`normalize-asset: ${error.message}`);
  process.exitCode = 1;
});
