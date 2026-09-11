// Gate — large print, executed against the running app.
//
// The feature is two numbers (1.10 below 768px, 1.25 above) and both are measured rather than
// chosen: media queries do not follow `zoom`, so a factor that is safe at one width overflows at
// another, and the safe maximum moves whenever the layout changes. This is what stops those two
// numbers from quietly becoming wrong.
//
// It checks the real thing rather than the CSS: toggle the control, walk every screen, and assert
// that nothing leaves the viewport and that the text actually got bigger.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run gate:largeprint

import assert from "node:assert/strict";
import { loadChromium } from "./lib/google-fonts.mjs";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const ANSWERS = [3, 1, 0, 1, 2, 1, 2, 1, 1, 1, 3, 0, 3, 0, 0, 0, 0, 1, 3, 0, 1, 3, 1, 1];
const VIEWPORTS = [
  { w: 360, h: 800, label: "360px", expected: 1.1 },
  { w: 390, h: 844, label: "390px", expected: 1.1 },
  { w: 768, h: 1024, label: "768px", expected: 1.25 },
  { w: 1280, h: 800, label: "desktop", expected: 1.25 },
];

// Every element that leaves the viewport. .ambient is decorative and deliberately off-canvas.
function overflowing() {
  const root = document.documentElement;
  const out = [];
  for (const element of document.querySelectorAll("body *")) {
    if (String(element.className).includes("ambient")) continue;
    const box = element.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) continue;
    if (box.left < -1 || box.right > root.clientWidth + 1) {
      out.push(`${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]} +${Math.round(box.right - root.clientWidth)}px`);
    }
  }
  return { scrollsX: root.scrollWidth > root.clientWidth + 1, offenders: out };
}

const sample = () => {
  const target = document.querySelector(".hero-text, .question-card h1, .summary-line");
  return target ? Math.round(target.getBoundingClientRect().height) : 0;
};

const chromium = await loadChromium();
const browser = await chromium.launch();
const failures = [];
const rows = [];

try {
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const before = await page.evaluate(sample);
    await page.click(".text-size-toggle");
    await page.waitForTimeout(250);
    const after = await page.evaluate(sample);
    const applied = await page.evaluate(() => Number(getComputedStyle(document.querySelector(".app-shell")).zoom));

    // Every screen, not just the welcome one: large print is turned on at the start of an activity
    // and has to survive the whole session.
    const screens = { welcome: await page.evaluate(overflowing) };
    await page.click(".hero-copy .primary-button");
    await page.waitForSelector(".profile-card");
    const inputs = page.locator(".profile-card input:not([type=checkbox])");
    await inputs.nth(0).fill("Large Print");
    await page.click('.segmented button:has-text("ไม่ระบุ")');
    await inputs.nth(1).fill("QA");
    screens.profile = await page.evaluate(overflowing);
    await page.check(".consent input[type=checkbox]");
    await page.click(".profile-card .primary-button.full");
    await page.waitForSelector(".question-card");
    screens.question = await page.evaluate(overflowing);
    for (const choice of ANSWERS) {
      await page.waitForSelector(".answers button");
      const available = await page.locator(".answers button").count();
      await page.locator(".answers button").nth(Math.min(choice, available - 1)).click();
      await page.click(".question-actions .primary-button");
    }
    await page.waitForSelector(".result-wrap");
    await page.waitForTimeout(300);
    screens.result = await page.evaluate(overflowing);

    // It has to be remembered, or every participant re-enables it on every screen.
    await page.reload({ waitUntil: "networkidle" });
    const persisted = await page.evaluate(() =>
      document.documentElement.classList.contains("large-print"));
    await context.close();

    const bad = Object.entries(screens).filter(([, report]) => report.scrollsX || report.offenders.length > 0);
    const checks = [
      [`zoom is ${viewport.expected}`, Math.abs(applied - viewport.expected) < 0.001],
      ["text actually got bigger", after > before],
      ["nothing overflows on any screen", bad.length === 0],
      ["the setting survives a reload", persisted === true],
    ];
    for (const [name, passed] of checks) if (!passed) failures.push(`${viewport.label}: ${name}`
      + (name.startsWith("nothing") ? ` — ${bad.map(([screen, r]) => `${screen}: ${r.offenders.slice(0, 2).join(", ") || "scrolls sideways"}`).join(" · ")}` : ""));
    rows.push({ viewport: viewport.label, applied, before, after, bad: bad.length, pass: checks.every(([, p]) => p) });
  }
} finally {
  await browser.close();
}

const pad = (value, width) => String(value).padEnd(width);
console.log(`${pad("viewport", 11)}${pad("zoom", 7)}${pad("sample text", 22)}${pad("screens with overflow", 23)}result`);
for (const row of rows) {
  console.log(`${pad(row.viewport, 11)}${pad(row.applied, 7)}${pad(`${row.before}px -> ${row.after}px`, 22)}`
    + `${pad(row.bad, 23)}${row.pass ? "PASS" : "FAIL"}`);
}
if (failures.length > 0) {
  console.error(`\n${failures.length} failing checks:`);
  for (const failure of failures) console.error(`  - ${failure}`);
}
assert.equal(failures.length, 0, `${failures.length} large-print checks failed`);
console.log("\nlarge print gate: PASS");
