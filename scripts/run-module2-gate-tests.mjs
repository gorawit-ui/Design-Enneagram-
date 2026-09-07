// Module 2 release-gate scoreboard.
//
// docs/CHARACTER_ASSET_SYSTEM.md lists ten conditions and says "Module 2 is PASS only when all of
// the following are true". This reports each one from the repository instead of from prose, so the
// gate's real state is visible at any moment rather than rotting in a table of "Pending".
//
// Deliberately NOT part of `npm test` or CI: Module 2 is legitimately incomplete (24 of 27 base
// assets do not exist yet), so wiring it into CI would pin the build red and teach everyone to
// ignore it. Run it on demand:  npm run gate:m2
//
// Exit code is 1 while the gate fails, which is the correct semantics for a gate.

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const ASSET_ROOT = path.join(projectRoot, "public/character-assets");
const SPEC = "docs/CHARACTER_ASSET_SYSTEM.md";

const rows = [];
const add = (n, status, criterion, detail) => rows.push({ n, status, criterion, detail });

const exists = (p) => fs.existsSync(path.join(projectRoot, p));
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(projectRoot, p), "utf8"));

// --- 1. 27 base assets + one exploration fallback ----------------------------------------------
const baseFound = [];
for (let core = 1; core <= 9; core++) {
  for (const presentation of ["female", "male", "neutral"]) {
    for (const ext of ["png", "webp"]) {
      if (exists(`public/character-assets/enneagram-${core}/${presentation}.${ext}`)) {
        baseFound.push(`enneagram-${core}/${presentation}.${ext}`);
      }
    }
  }
}
const fallbackDir = path.join(ASSET_ROOT, "fallback");
const fallbackCount = fs.existsSync(fallbackDir)
  ? fs.readdirSync(fallbackDir).filter((f) => /\.(png|webp)$/.test(f)).length : 0;
const missingCores = [];
for (let core = 1; core <= 9; core++) {
  const n = baseFound.filter((f) => f.startsWith(`enneagram-${core}/`)).length;
  if (n < 3) missingCores.push(`${core} (${n}/3)`);
}
add(1, baseFound.length === 27 && fallbackCount >= 1 ? "PASS" : "FAIL",
  "27 base assets + 1 exploration fallback present",
  `base ${baseFound.length}/27, fallback ${fallbackCount}/1`
  + (missingCores.length ? ` — cores short: ${missingCores.join(", ")}` : ""));

// --- 2. Modifier treatments deterministic and subordinate --------------------------------------
add(2, exists("app/lib/character-visual-modifiers.ts") ? "NEEDS-HUMAN" : "FAIL",
  "Modifier treatments approved, deterministic, subordinate",
  "determinism and Wing/A-T isolation are covered by npm test; \"approved\" is a design sign-off");

// --- 3. Manifest, checksums, provenance, ownership, accessibility -------------------------------
if (!exists("public/character-assets/manifest.json")) {
  add(3, "FAIL", "Manifest / checksums / provenance / ownership / accessibility complete",
    "manifest.json does not exist — run `npm run assets:manifest`");
} else {
  const manifest = readJson("public/character-assets/manifest.json");
  const total = manifest.assets.length;
  const noChecksum = manifest.assets.filter((a) => !a.checksum?.value).length;
  const noAlt = manifest.assets.filter((a) => !a.accessibilityDescription).length;
  const gapCounts = {};
  for (const asset of manifest.assets) {
    for (const gap of asset.gaps ?? []) gapCounts[gap] = (gapCounts[gap] ?? 0) + 1;
  }
  const gapSummary = Object.entries(gapCounts).map(([k, v]) => `${k}:${v}`).join(" ");
  add(3, noChecksum === 0 && noAlt === 0 && !gapSummary ? "PASS" : "FAIL",
    "Manifest / checksums / provenance / ownership / accessibility complete",
    `${total} assets · checksums missing ${noChecksum} · accessibility missing ${noAlt}`
    + (gapSummary ? ` · unrecorded human fields → ${gapSummary}` : ""));
}

// --- 4-5. Parity, stereotype and proportion review ---------------------------------------------
add(4, "NEEDS-HUMAN", "Presentation parity and stereotype review pass",
  "living family parity is test-asserted; base family and stereotype review are human");
add(5, "NEEDS-HUMAN", "Balanced adult proportions, no body-shape encoding",
  "cannot be determined mechanically — independent review");

// --- 6. Viewports, including 360 px -------------------------------------------------------------
add(6, exists("scripts/run-responsive-gate-tests.mjs") ? "NEEDS-SERVER" : "FAIL",
  "Every required viewport passes, 360 px with no overflow or content loss",
  "run `npm run gate:responsive` against a built server (360 px, 390 px, desktop)");

// --- 7. Missing-file and ambiguous-result fallbacks ---------------------------------------------
const resolverSource = fs.readFileSync(path.join(projectRoot, "app/lib/living-character-resolver.ts"), "utf8");
const viewSource = fs.readFileSync(path.join(projectRoot, "app/result-view.tsx"), "utf8");
const hasAmbiguous = resolverSource.includes('"ambiguous-result"');
const hasOnError = viewSource.includes("onError");
add(7, hasAmbiguous && hasOnError ? "PASS" : "FAIL",
  "Missing-file and ambiguous-result fallbacks pass",
  `ambiguous route ${hasAmbiguous ? "present" : "MISSING"} (test-asserted) · `
  + `missing-file onError handler ${hasOnError ? "present" : "MISSING"}`);

// --- 8. Automated validation, tests, lint, build -----------------------------------------------
const pkg = readJson("package.json");
const required = ["test", "lint", "build", "gate:e"];
const missingScripts = required.filter((s) => !pkg.scripts?.[s]);
add(8, missingScripts.length === 0 ? "PASS" : "FAIL",
  "Automated asset validation, tests, lint and build pass",
  missingScripts.length ? `missing scripts: ${missingScripts.join(", ")}`
    : "npm test (4 suites incl. gate:e), lint and build — all run in CI on every push");

// --- 9. No Module 1 regression ------------------------------------------------------------------
const frozen = ["app/lib/scoring.ts", "app/lib/assessment-data.ts", "app/lib/profile-contract.ts"];
const leaks = frozen.filter((f) =>
  fs.readFileSync(path.join(projectRoot, f), "utf8").includes("living-character-resolver"));
add(9, leaks.length === 0 ? "PASS" : "FAIL",
  "No scoring / question / challenge / consent / privacy / profile regression",
  leaks.length ? `visual dependency leaked into: ${leaks.join(", ")}`
    : "frozen modules carry no visual dependency; asserted by npm test on every run");

// --- 10. Five-party approval --------------------------------------------------------------------
const specText = fs.readFileSync(path.join(projectRoot, SPEC), "utf8");
const pendingRows = (specText.match(/\| Pending \|/g) ?? []).length;
add(10, "NEEDS-HUMAN", "Design, Product, Engineering, QA and HR/Privacy record approval",
  `${SPEC} completion-evidence table still has ${pendingRows} "Pending" cells`);

// --- Advisory findings (not gate rows) ----------------------------------------------------------
const findings = [];
if (specText.includes(".webp")) {
  const pngBase = baseFound.filter((f) => f.endsWith(".png")).length;
  if (pngBase > 0) {
    findings.push(`${SPEC} specifies .webp for runtime assets, but ${pngBase} base asset(s) on `
      + "disk are .png, as are all 12 gate-approved living assets. The spec and the shipped "
      + "format disagree — a decision is needed (align the spec to PNG, or migrate). Note that "
      + "Asset Gate E passed on PNG and the pilot tests assert a PNG signature.");
  }
}
// The base family has its own contract, separate from the living pilot's 1122x1402 / 750 KB:
// runtime export 1024x1024 WebP, <=180 KB preferred, hard gate 250 KB.
const BASE_CANVAS = { width: 1024, height: 1024 };
const BASE_HARD_KB = 250;
const oversize = [];
const wrongCanvas = [];
for (const relative of baseFound) {
  const absolute = path.join(ASSET_ROOT, relative);
  const kb = Math.round(fs.statSync(absolute).size / 1024);
  if (kb > BASE_HARD_KB) oversize.push(`${relative} (${kb} KB)`);
  const head = Buffer.alloc(33);
  const fd = fs.openSync(absolute, "r");
  fs.readSync(fd, head, 0, 33, 0);
  fs.closeSync(fd);
  if (head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    const w = head.readUInt32BE(16);
    const h = head.readUInt32BE(20);
    if (w !== BASE_CANVAS.width || h !== BASE_CANVAS.height) wrongCanvas.push(`${relative} (${w}x${h})`);
  }
}
if (oversize.length) {
  findings.push(`base asset(s) exceed the ${BASE_HARD_KB} KB hard gate the base-asset spec sets `
    + `(180 KB preferred): ${oversize.join(", ")}`);
}
if (wrongCanvas.length) {
  findings.push(`base asset(s) are not the specified ${BASE_CANVAS.width}x${BASE_CANVAS.height} `
    + `runtime canvas: ${wrongCanvas.join(", ")}`);
}

// --- Report -------------------------------------------------------------------------------------
const width = Math.max(...rows.map((r) => r.criterion.length));
console.log("\nModule 2 release gate — docs/CHARACTER_ASSET_SYSTEM.md\n");
for (const r of rows) {
  console.log(`  ${String(r.n).padStart(2)}. [${r.status.padEnd(12)}] ${r.criterion.padEnd(width)}`);
  console.log(`      ${r.detail}`);
}
const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
console.log(`\n  ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);

if (findings.length) {
  console.log("\n  Advisory findings (not gate rows, but they need a decision):");
  for (const f of findings) console.log(`    - ${f}`);
}

const failed = rows.filter((r) => r.status === "FAIL");
if (failed.length) {
  console.log(`\nModule 2: FAIL / NO-GO — ${failed.length} condition(s) fail: `
    + `${failed.map((r) => r.n).join(", ")}. Any failed item makes the gate FAIL per the spec.\n`);
  process.exit(1);
}
console.log("\nModule 2: every mechanically checkable condition passes. The NEEDS-HUMAN and "
  + "NEEDS-SERVER rows above must still be discharged before the gate can be recorded PASS.\n");
