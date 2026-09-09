// Prove the checkerboard recovery round-trips, on the exact file the generator produces.
//
// The whole remaining asset pipeline now depends on this one step: the generator exports RGB with
// the transparency checkerboard flattened in, and every asset from here reaches the repository
// through it. A silent regression would not announce itself -- the output would still be a
// plausible PNG -- so the guard is a round trip: flatten an approved asset onto a checkerboard,
// recover it, and compare the recovered alpha against the alpha it started with.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "outputs/asset-masters/enneagram-1/female-master.png";
const CANVAS = 1254;        // the size the generator actually exports, not the size it is asked for
const BLOCK = 11;
const DARK = 128, LIGHT = 191;

const work = fs.mkdtempSync(path.join(os.tmpdir(), "unbake-test-"));
const flattened = path.join(work, "flattened.png");
const recovered = path.join(work, "recovered.png");

const alphaOf = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha()
    .resize(CANVAS, CANVAS).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < out.length; i += 1) out[i] = data[i * info.channels + info.channels - 1];
  return out;
};

const background = Buffer.alloc(CANVAS * CANVAS * 3);
for (let y = 0; y < CANVAS; y += 1) {
  for (let x = 0; x < CANVAS; x += 1) {
    const value = (Math.floor(x / BLOCK) + Math.floor(y / BLOCK)) % 2 === 0 ? LIGHT : DARK;
    const o = (y * CANVAS + x) * 3;
    background[o] = value; background[o + 1] = value; background[o + 2] = value;
  }
}
const figure = await sharp(SOURCE).resize(CANVAS, CANVAS).png().toBuffer();
await sharp(background, { raw: { width: CANVAS, height: CANVAS, channels: 3 } })
  .composite([{ input: figure }])
  .removeAlpha()            // RGB with no alpha channel at all, as the generator exports it
  .png({ compressionLevel: 9 })
  .toFile(flattened);

const flatMeta = await sharp(flattened).metadata();
assert.equal(flatMeta.hasAlpha, false, "the fixture must have no alpha, or it proves nothing");

execFileSync("node", ["scripts/unbake-checkerboard.mjs", flattened, recovered], { stdio: "pipe" });

const before = await alphaOf(SOURCE);
const after = await alphaOf(recovered);
assert.equal(before.length, after.length);

let flipped = 0, matched = 0;
for (let i = 0; i < before.length; i += 1) {
  const wasSolid = before[i] > 200, isSolid = after[i] > 200;
  const wasEmpty = before[i] < 16, isEmpty = after[i] < 16;
  if ((wasSolid && isSolid) || (wasEmpty && isEmpty)) matched += 1;
  else if ((wasSolid && isEmpty) || (wasEmpty && isSolid)) flipped += 1;
}
const flippedPct = (flipped / before.length) * 100;
const matchedPct = (matched / before.length) * 100;

// A pixel that was solid coming back empty is a hole in the figure; empty coming back solid is
// leftover background. Either is a defect the eye would catch.
//
// The thresholds are set against a deliberately broken version rather than picked for comfort.
// Narrowing the grey tolerance to zero -- so the flood cannot cross a cell boundary -- takes the
// flip rate from 0.06% to 0.46%, and a 0.5% budget let that pass. Sound output leaves 3x of room
// under these; the broken one does not.
assert.ok(flippedPct < 0.2, `${flippedPct.toFixed(2)}% of pixels flipped between solid and empty`);
assert.ok(matchedPct > 99, `only ${matchedPct.toFixed(1)}% of pixels agree with the original`);

// And the corners must be genuinely empty, which is what the asset gate checks first.
const { data: corner, info } = await sharp(recovered).ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
const cornerAlpha = (x, y) => corner[(y * info.width + x) * info.channels + info.channels - 1];
for (const [x, y] of [[0, 0], [info.width - 1, 0], [0, info.height - 1], [info.width - 1, info.height - 1]]) {
  assert.equal(cornerAlpha(x, y), 0, `corner (${x}, ${y}) is not transparent`);
}

fs.rmSync(work, { recursive: true, force: true });
console.log(`Checkerboard recovery test passed: ${matchedPct.toFixed(1)}% of pixels agree with the `
  + `original alpha, ${flippedPct.toFixed(2)}% flipped, all four corners transparent.`);
