// Regenerate the Gate E responsive review sheets that outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md cites.
//
// Rows are INTJ, ISTJ, ENFP, ESFP; columns are Female, Male, Neutral — the layout the gate document
// describes. The sheet is rendered at the two review widths so a human reviewer can judge the
// visual, parity, bias and readability criteria, which this script deliberately does NOT decide.
//
// Usage: npm run gate:sheets      (no server needed; reads the PNGs straight off disk)

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const OUT = path.join(projectRoot, "outputs");
const WIDTHS = [360, 390];
const TYPES = [["INTJ", "intj", "observant-curiosity"], ["ISTJ", "istj", "observant-curiosity"],
               ["ENFP", "enfp", "idea-spark"], ["ESFP", "esfp", "idea-spark"]];
const PRESENTATIONS = ["female", "male", "neutral"];

async function loadChromium() {
  for (const specifier of ["playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try { return (await import(specifier)).chromium; } catch { /* next */ }
  }
  throw new Error("Playwright is not resolvable. Install it, or run where a global playwright exists.");
}

const rows = TYPES.map(([label, dir, action]) => {
  const cells = PRESENTATIONS.map((presentation) => {
    const relative = `public/character-assets/living/v1/enneagram-2/${dir}/${presentation}-${action}.png`;
    const file = path.join(projectRoot, relative);
    if (!fs.existsSync(file)) throw new Error(`missing approved asset: ${relative}`);
    const base64 = fs.readFileSync(file).toString("base64");
    return `<figure><img alt="${label} ${presentation}" src="data:image/png;base64,${base64}"><figcaption>${presentation}</figcaption></figure>`;
  }).join("");
  return `<section><h2>${label} &times; Core 2 &middot; ${action}</h2><div class="row">${cells}</div></section>`;
}).join("");

const html = `<!doctype html><meta charset="utf-8"><title>Gate E review sheet</title><style>
*{box-sizing:border-box}body{margin:0;padding:10px;background:#fefdfa;color:#16362f;
  font:13px/1.4 system-ui,sans-serif}
h1{margin:0 0 2px;font-size:15px}p.note{margin:0 0 10px;font-size:11px;color:#59675f}
section{margin-bottom:12px;padding:8px;border:1px solid #dfe7e0;border-radius:10px;background:#fff}
h2{margin:0 0 6px;font-size:12px;letter-spacing:.4px;color:#3e6d58}
.row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
figure{margin:0;min-width:0}
/* Checkerboard proves the alpha channel is real rather than a white flatten. */
img{display:block;width:100%;height:auto;border-radius:6px;
  background-image:linear-gradient(45deg,#e8ece7 25%,transparent 25%,transparent 75%,#e8ece7 75%),
                   linear-gradient(45deg,#e8ece7 25%,transparent 25%,transparent 75%,#e8ece7 75%);
  background-size:12px 12px;background-position:0 0,6px 6px}
figcaption{margin-top:2px;font-size:10px;color:#75827a;text-align:center}
</style><h1>Core 2 pilot — Gate E review sheet</h1>
<p class="note">Rows INTJ / ISTJ / ENFP / ESFP &middot; columns Female / Male / Neutral &middot;
rendered at review width. Checkerboard behind each asset is the page background showing through real alpha.</p>
${rows}`;

const chromium = await loadChromium();
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() =>
      [...document.images].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 60000 });
    const target = path.join(OUT, `CORE2_POSE_ACTION_GATE_E_${width}.png`);
    await page.screenshot({ path: target, fullPage: true });
    const { size } = fs.statSync(target);
    console.log(`  wrote outputs/CORE2_POSE_ACTION_GATE_E_${width}.png  (${Math.round(size / 1024)} KB)`);
    await context.close();
  }
} finally {
  await browser.close();
}
console.log("Gate E review sheets regenerated. Visual, parity and bias criteria remain a human review.");
