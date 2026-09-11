// The QR and the printed link have to agree.
//
// They are produced by different things — the image by `npm run qr` at build time, the text by
// app/lib/site.ts at render time — so they can drift silently, and the failure mode is a room full
// of people scanning a code that goes somewhere the slide does not say. public/qr.json records
// what was actually encoded; this compares it with what the app displays.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const qrPath = path.join(projectRoot, "public/qr.json");

assert.ok(fs.existsSync(qrPath), "public/qr.json is missing — run `npm run qr`");
const encoded = JSON.parse(fs.readFileSync(qrPath, "utf8"));

const source = fs.readFileSync(path.join(projectRoot, "app/lib/site.ts"), "utf8");
const fallback = source.match(/process\.env\.NEXT_PUBLIC_SITE_URL \?\? "([^"]+)"/);
assert.ok(fallback, "app/lib/site.ts no longer has a readable default URL");
const displayed = process.env.NEXT_PUBLIC_SITE_URL ?? fallback[1];

assert.equal(encoded.url, displayed,
  `the QR encodes ${encoded.url} but the page shows ${displayed} — re-run \`npm run qr\``);

for (const file of ["public/qr.svg", "public/qr.png"]) {
  const full = path.join(projectRoot, file);
  assert.ok(fs.existsSync(full), `${file} is missing — run \`npm run qr\``);
  assert.ok(fs.statSync(full).size > 200, `${file} is empty`);
}
const svg = fs.readFileSync(path.join(projectRoot, "public/qr.svg"), "utf8");
const modules = Number((svg.match(/viewBox="0 0 (\d+)/) ?? [])[1]);
// Version 1 is 21 modules and version 40 is 177. Anything outside that is not a QR symbol.
assert.ok(modules >= 21 && modules <= 177, `qr.svg viewBox is ${modules} modules, which is not a QR size`);

console.log(`Share link tests passed: QR and page both point at ${encoded.url}, ${modules}x${modules} modules.`);
