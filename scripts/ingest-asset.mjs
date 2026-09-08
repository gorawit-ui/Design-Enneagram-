// Take one generated image from "just downloaded" to "in the repo or rejected", in one command.
//
// Every round trip this session cost came from one of five things, and four of them were never the
// prompt's fault -- they were mechanical, and each is repaired here rather than asked for again:
//
//   the checkerboard flattened into the file   -> assets:unbake recovers the alpha
//   margin under 8%                            -> assets:normalize reframes (honoured 0 of 4 times)
//   file over the size budget                  -> assets:normalize re-encodes
//   the body sitting at alpha 251-254          -> assets:normalize snaps it (every master had it)
//
// The fifth was sending a copy of the chat preview instead of the exported file, which is checked
// for first and refused, because nothing downstream can undo a lossy upscale.
//
// What remains for a human is what no script can decide: whether it is the same person, and whether
// it reads as equal in standing to the other presentations.
//
// Usage:
//   node scripts/ingest-asset.mjs <downloaded.png> --core 2 --presentation female
//   node scripts/ingest-asset.mjs <downloaded.png> --core 2 --presentation female --commit

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
const input = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1]?.startsWith("--") !== true);
const core = flag("core");
const presentation = flag("presentation");
const commit = args.includes("--commit");
if (!input || !core || !presentation) {
  console.error("usage: node scripts/ingest-asset.mjs <file> --core N --presentation female|male|neutral");
  process.exit(2);
}

const step = (n, text) => console.log(`\n[${n}] ${text}`);
const run = (script, extra) => execFileSync("node", [`scripts/${script}`, ...extra], { encoding: "utf8" });

const meta = await sharp(input).metadata();
console.log(`ingesting ${path.basename(input)} — core ${core}, ${presentation} presentation`);
console.log(`  ${meta.format} ${meta.width}x${meta.height}, ${Math.round(fs.statSync(input).size / 1024)} KB`);

// 1. Refuse a preview. A lossy upscale cannot be undone, and treating one as the asset wasted a
// round of diagnosis already.
step(1, "checking this is the exported file, not a copy of the chat preview");
if (meta.format === "webp") {
  console.error("  REFUSED: this is WebP. The generator exports PNG; the chat preview is re-encoded"
    + " to WebP and upscaled, and its softened edges cannot be recovered.");
  console.error("  Download the PNG from the generator and pass that file instead.");
  process.exit(1);
}
console.log(`  ok — ${meta.format}`);

const work = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-"));
let staged = input;

// 2. Recover alpha if the checkerboard was flattened in.
step(2, "checking the transparency survived export");
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + info.channels - 1];
const cornersOpaque = [
  alphaAt(0, 0), alphaAt(info.width - 1, 0),
  alphaAt(0, info.height - 1), alphaAt(info.width - 1, info.height - 1),
].every((a) => a > 200);
if (cornersOpaque) {
  console.log("  corners are opaque — recovering alpha from the flattened checkerboard");
  staged = path.join(work, "unbaked.png");
  process.stdout.write(run("unbake-checkerboard.mjs", [input, staged]).replace(/^/gm, "  "));
} else {
  console.log("  ok — alpha intact");
}

// 3. Reframe, repair the alpha ramp, re-encode.
step(3, "reframing to the runtime contract");
const outPath = `public/character-assets/enneagram-${core}/${presentation}.webp`;
const normalized = run("normalize-asset.mjs", [staged, "--out", outPath]);
process.stdout.write(normalized.replace(/^/gm, "  "));
const mechanicalFail = /^\s*FAIL/m.test(normalized);

// 4. Compare against this presentation's own master.
const master = `outputs/asset-masters/enneagram-1/${presentation}-master.png`;
step(4, `comparing against the locked ${presentation} master`);
let buildFail = false;
if (!fs.existsSync(master)) {
  console.log(`  skipped — ${master} does not exist yet`);
} else {
  const masterFramed = path.join(work, "master.webp");
  run("normalize-asset.mjs", [master, "--out", masterFramed]);
  try {
    const report = run("check-asset.mjs", [masterFramed, outPath]);
    // Match the shape of a band line, not the body part named in it: check-asset's closing advice
    // mentions shoulders too, and a prefix match on the part name reported that sentence as a
    // finding.
    const build = report.split("\n").filter((l) => /than the master, band \d+\)/.test(l));
    console.log(build.length ? build.join("\n") : "  build matches the master on all 40 bands");
  } catch (error) {
    const report = `${error.stdout ?? ""}`;
    const problems = report.split("\n").filter((l) => l.startsWith("  - build:"));
    console.log(problems.length ? problems.join("\n") : "  (see check-asset output)");
    buildFail = problems.length > 0;
  }
}

step(5, "verdict");
if (mechanicalFail || buildFail) {
  console.log("  MECHANICAL FAIL — not fit to ship. The lines above say which criterion.");
  fs.rmSync(outPath, { force: true });
  console.log(`  removed ${outPath} so nothing half-checked can be resolved by the app.`);
  process.exit(1);
}
console.log(`  mechanical checks PASS — ${outPath}`);
console.log("  STILL NEEDS A HUMAN: is it the same person as the master, and does it read as equal");
console.log("  in standing to the other presentations? No check here decides either.");
if (commit) {
  const masterCopy = `outputs/asset-masters/enneagram-${core}/${presentation}-master.png`;
  fs.mkdirSync(path.dirname(masterCopy), { recursive: true });
  fs.copyFileSync(staged, masterCopy);
  console.log(`  kept the source at ${masterCopy} — it costs a generation to reproduce`);
}
