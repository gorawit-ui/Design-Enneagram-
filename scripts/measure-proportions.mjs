// Read the approved master's proportions off its pixels, in the terms a prompt can carry.
//
// "Keep the body identical" has failed every time it was asked: one derivative came back with
// shoulders half as wide and a head a fifth larger. An instruction with no number in it cannot be
// checked by whoever follows it, so this states the same requirement as two ratios the generator
// can aim at and check-asset can verify afterwards.
//
// Both are measured against the figure's own height, which the bounding box gives exactly. Head
// height is deliberately not used: skin runs unbroken from face to collar, so the chin cannot be
// found reliably by colour, and a ratio measured off a guessed chin would be worse than no ratio.
// The bands below avoid the two things that would corrupt the reading -- the shoulders creeping
// into the head band, and the raised notebook widening the shoulder band.
import sharp from "sharp";

const HEAD_BAND = [0, 0.15];        // crown to just above the shoulder line
const SHOULDER_BAND = [0.20, 0.25]; // below the collar, above the arms and the prop

// --record <presentation> writes the reading into the file the prompt generator reads, so a
// presentation's own numbers reach its core-2-to-9 prompts instead of being retyped by hand.
const args = process.argv.slice(2);
const recordIndex = args.indexOf("--record");
const record = recordIndex >= 0 ? args[recordIndex + 1] : null;
const RECORD_FILE = "outputs/asset-masters/proportions.json";
const file = args.find((a, i) => !a.startsWith("--") && i !== recordIndex + 1)
  ?? "outputs/asset-masters/enneagram-1/female-master.png";
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;

const row = (y) => {
  let lo = W, hi = -1;
  for (let x = 0; x < W; x += 1) {
    if (data[(y * W + x) * C + C - 1] <= 8) continue;
    if (x < lo) lo = x;
    hi = x;
  }
  return hi < 0 ? null : hi - lo + 1;
};

let top = -1, bottom = -1;
for (let y = 0; y < H; y += 1) if (row(y)) { if (top < 0) top = y; bottom = y; }
if (top < 0) throw new Error(`${file}: the image is fully transparent`);
const height = bottom - top + 1;

const widestIn = ([from, to]) => {
  let widest = 0, at = 0;
  for (let y = top + Math.floor(height * from); y <= top + Math.floor(height * to); y += 1) {
    const w = row(y) ?? 0;
    if (w > widest) { widest = w; at = y; }
  }
  return { widest, at };
};
const head = widestIn(HEAD_BAND);
const shoulder = widestIn(SHOULDER_BAND);

console.log(file.split("/").pop());
console.log(`  figure          ${height} px tall, top row ${top}`);
console.log(`  head width      ${head.widest} px at y=${head.at}`);
console.log(`  shoulder width  ${shoulder.widest} px at y=${shoulder.at}`);
console.log("");
console.log("  what a prompt should state, and what check-asset verifies afterwards:");
console.log(`    head width     ${((head.widest / height) * 100).toFixed(1)}% of the figure's height`);
console.log(`    shoulder width ${((shoulder.widest / height) * 100).toFixed(1)}% of the figure's height`);
console.log(`    shoulders are  ${(shoulder.widest / head.widest).toFixed(2)} x the width of the head`);

if (record) {
  const fsMod = await import("node:fs");
  const existing = fsMod.existsSync(RECORD_FILE)
    ? JSON.parse(fsMod.readFileSync(RECORD_FILE, "utf8")) : {};
  existing[record] = {
    source: file,
    headWidthPct: Number(((head.widest / height) * 100).toFixed(1)),
    shoulderWidthPct: Number(((shoulder.widest / height) * 100).toFixed(1)),
    shoulderToHead: Number((shoulder.widest / head.widest).toFixed(2)),
  };
  fsMod.writeFileSync(RECORD_FILE, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(`\n  recorded as "${record}" in ${RECORD_FILE}`);
}
