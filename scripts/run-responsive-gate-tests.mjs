// Gate E — UX (responsive) criterion, executed against the running app.
//
// The plan's UX PASS reads: "primary character/action remains readable at 360 px, 390 px, and
// desktop; ... no horizontal overflow". This script executes that against a real browser instead
// of leaving it to manual review, and writes the screenshots it judged into outputs/gate-e/ so the
// evidence stops being ephemeral.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run gate:responsive                      (or BASE_URL=http://127.0.0.1:3000 npm run gate:responsive)
//
// Requires Playwright + Chromium. Not part of `npm test` because it needs a running server.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT_DIR = path.join(projectRoot, "outputs/gate-e");

// Deterministic answers that score Core 2 x INTJ-A with both axes non-ambiguous: 18 foundation
// questions, then the six adaptive ones those answers select (c-at, c-at2, c-ie, c-core-2,
// c-wing-2, c-sn). Searched for against the current item bank rather than hand-tuned.
//
// The previous array had twenty entries, from when the session was twenty questions long. After
// docs/QUESTION_COUNT_DECISION.md fixed the count at 24 this gate answered twenty and then waited
// thirty seconds for a result page that was still four questions away, so it had been failing on
// a timeout rather than on anything it measures. Re-derive with a search over selectNextQuestion
// if the item bank changes again; ITEM_BANK_VERSION in assessment-data.ts is what moves.
const ANSWERS = [1, 0, 0, 1, 3, 0, 2, 1, 2, 3, 0, 0, 1, 1, 1, 3, 0, 3, 3, 1, 1, 3, 1, 1];

// The plan's UX PASS names three widths: 360 px, 390 px, and desktop.
const VIEWPORTS = [
  { w: 360, h: 800, label: "360px" },
  { w: 390, h: 844, label: "390px" },
  { w: 1280, h: 800, label: "desktop" },
];
const PRESENTATIONS = [
  { thai: "ผู้หญิง", key: "female" },
  { thai: "ผู้ชาย", key: "male" },
  { thai: "ไม่ระบุ", key: "neutral" },
];
const APPROVED_INTJ = {
  female: "/character-assets/living/v1/enneagram-2/intj/female-observant-curiosity.png",
  male: "/character-assets/living/v1/enneagram-2/intj/male-observant-curiosity.png",
  neutral: "/character-assets/living/v1/enneagram-2/intj/neutral-observant-curiosity.png",
};

async function loadChromium() {
  for (const specifier of ["playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try {
      return (await import(specifier)).chromium;
    } catch {
      // try the next resolution strategy
    }
  }
  throw new Error(
    "Playwright is not resolvable. Install it (npm i -D playwright && npx playwright install chromium) "
    + "or run this script where a global playwright is available.",
  );
}

async function reachResult(page, presentationThai) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.click(".hero-copy .primary-button");
  await page.waitForSelector(".profile-card");
  const inputs = page.locator(".profile-card input:not([type=checkbox])");
  await inputs.nth(0).fill("Gate E");
  await page.click(`.segmented button:has-text("${presentationThai}")`);
  await inputs.nth(1).fill("QA");
  await page.check(".consent input[type=checkbox]");
  await page.click(".profile-card .primary-button.full");
  await page.waitForSelector(".question-card");
  for (const choice of ANSWERS) {
    await page.waitForSelector(".answers button");
    await page.locator(".answers button").nth(choice).click();
    await page.click(".question-actions .primary-button");
  }
  await page.waitForSelector(".result-wrap");
  // The PNG must be decoded and every animation at rest, or the measured boxes are mid-flight.
  await page.waitForFunction(() => {
    const img = document.querySelector(".result-character-image");
    return img && img.complete && img.naturalWidth > 0;
  }, null, { timeout: 30000 });
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(300);
}

function measure() {
  const de = document.documentElement;
  const img = document.querySelector(".result-character-image");
  const rect = img.getBoundingClientRect();
  const offenders = [];
  for (const el of document.querySelectorAll("*")) {
    const box = el.getBoundingClientRect();
    if (box.width <= 0) continue;
    const style = getComputedStyle(el);
    if (style.overflowX === "auto" || style.overflowX === "scroll") continue;
    // .ambient blurs are decorative and deliberately positioned off-canvas.
    if ((el.className || "").toString().includes("ambient")) continue;
    if (box.left < -1 || box.right > de.clientWidth + 1) {
      offenders.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().trim().slice(0, 40)}`);
    }
  }
  return {
    canScrollX: de.scrollWidth > de.clientWidth,
    clientWidth: de.clientWidth,
    offenders,
    img: {
      src: decodeURIComponent(img.currentSrc || img.src),
      left: Math.round(rect.left), right: Math.round(rect.right),
      width: Math.round(rect.width), height: Math.round(rect.height),
      loaded: img.complete && img.naturalWidth > 0,
      withinViewport: rect.left >= -1 && rect.right <= de.clientWidth + 1,
    },
  };
}

const chromium = await loadChromium();
fs.mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const failures = [];
const rows = [];

try {
  for (const vp of VIEWPORTS) {
    for (const presentation of PRESENTATIONS) {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("pageerror", (error) => consoleErrors.push(String(error)));
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

      await reachResult(page, presentation.thai);
      const measured = await page.evaluate(measure);
      const shot = path.join(OUT_DIR, `live-${vp.label}-${presentation.key}.png`);
      await page.screenshot({ path: shot });

      const checks = [
        ["no horizontal scroll", measured.canScrollX === false],
        ["no content outside viewport", measured.offenders.length === 0],
        ["character image decoded", measured.img.loaded === true],
        ["character fully in viewport", measured.img.withinViewport === true],
        ["character is visible (>=120px wide)", measured.img.width >= 120],
        ["approved asset for presentation", measured.img.src.includes(APPROVED_INTJ[presentation.key])],
        ["no console errors", consoleErrors.length === 0],
      ];
      const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
      if (failed.length) {
        failures.push(`${vp.label}/${presentation.key}: ${failed.join("; ")}`
          + (measured.offenders.length ? ` [outside: ${[...new Set(measured.offenders)].slice(0, 4).join(", ")}]` : ""));
      }
      rows.push(`  ${vp.label.padEnd(7)} ${presentation.key.padEnd(7)} img ${measured.img.width}x${measured.img.height}`
        + ` @${measured.img.left}  offenders=${measured.offenders.length}  scrollX=${measured.canScrollX}`
        + `  ${failed.length ? "FAIL" : "PASS"}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(rows.join("\n"));
console.log(`\nEvidence written to ${path.relative(projectRoot, OUT_DIR)}/`);
assert.equal(failures.length, 0, `Gate E responsive criterion FAILED:\n  - ${failures.join("\n  - ")}`);
console.log(`Gate E responsive criterion PASSED at ${VIEWPORTS.map((v) => v.label).join(", ")}, `
  + "all three presentations — no horizontal overflow, no content clipped outside the viewport, "
  + "character readable and rendered from the approved asset.");
