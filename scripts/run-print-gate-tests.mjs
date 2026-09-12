// Gate — the PDF export, executed against the running app.
//
// The print stylesheet is an allow-list: everything inside .result-wrap is hidden and exactly two
// sections are opted back in. That is the right shape -- a section added later cannot silently
// appear in the PDF -- but it has one failure mode, and the failure mode shipped: if neither
// opted-in section renders, the allow-list hides the entire page and the export is a blank sheet.
// That is what an ambiguous result did, because the summary card returned null without a core, and
// it was reported from a phone as "the PDF is empty" before any test noticed.
//
// So this gate prints a result of every shape the scorer can produce and asserts that something
// came out. It needs a browser, so like gate:responsive it is not part of `npm test`.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run gate:print                     (or BASE_URL=http://127.0.0.1:3000 npm run gate:print)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT_DIR = path.join(projectRoot, "outputs/print");

// Every shape the result can take. The answers come from app/lib/assessment-fixtures.ts and from
// scripts/find-fixtures.mjs-style searching, as option indexes in the order the app asks them.
const CASES = [
  { key: "clear-5w6", label: "core and wing both resolved",
    answers: [3, 1, 0, 1, 2, 1, 2, 1, 1, 1, 3, 0, 3, 0, 0, 0, 0, 1, 3, 0, 1, 3, 1, 1] },
  { key: "ambiguous-wing", label: "core resolved, wing ambiguous",
    answers: [3, 0, 1, 3, 0, 1, 2, 2, 0, 0, 3, 2, 2, 1, 0, 2, 3, 0, 0, 2, 3, 1, 0, 2] },
  { key: "ambiguous-mbti", label: "core resolved, MBTI ambiguous",
    answers: [3, 3, 2, 2, 3, 3, 3, 3, 0, 1, 0, 1, 0, 3, 3, 1, 2, 0, 2, 2, 0, 3, 2, 0] },
  { key: "ambiguous-core", label: "no core resolved — the case that printed blank",
    answers: [0, 1, 2, 3, 0, 3, 2, 2, 2, 3, 5, 3, 3, 0, 0, 1, 1, 0, 0, 3, 1, 1, 1, 3] },
];

// A phone, because that is where the bug was reported from, and a desktop.
const VIEWPORTS = [
  { w: 390, h: 844, label: "390px", mobile: true },
  { w: 1280, h: 800, label: "desktop", mobile: false },
];

async function loadChromium() {
  for (const specifier of ["playwright", "playwright-core", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try { return (await import(specifier)).chromium; } catch { /* next */ }
  }
  throw new Error("Playwright is not resolvable.");
}

async function reachResult(page, answers) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.click(".hero-copy .primary-button");
  await page.waitForSelector(".profile-card");
  const inputs = page.locator(".profile-card input:not([type=checkbox])");
  await inputs.nth(0).fill("Print Gate");
  await page.click('.segmented button:has-text("ไม่ระบุ")');
  await inputs.nth(1).fill("QA");
  await page.check(".consent input[type=checkbox]");
  await page.click(".profile-card .primary-button.full");
  await page.waitForSelector(".question-card");
  for (const choice of answers) {
    await page.waitForSelector(".answers button");
    const available = await page.locator(".answers button").count();
    await page.locator(".answers button").nth(Math.min(choice, available - 1)).click();
    await page.click(".question-actions .primary-button");
  }
  await page.waitForSelector(".result-wrap");
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(250);
}

// Pages in the PDF, counted off the page objects rather than the page tree's /Count, which can sit
// behind an object stream.
const pageCount = (buffer) => (buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

const chromium = await loadChromium();
fs.mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const failures = [];
const rows = [];

try {
  for (const testCase of CASES) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.w, height: viewport.h },
        isMobile: viewport.mobile, hasTouch: viewport.mobile, deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await reachResult(page, testCase.answers);

      const onScreen = await page.evaluate(() => ({
        card: (document.querySelector(".summary-card")?.innerText ?? "").replace(/\s+/g, " ").trim().length,
        radar: document.querySelector(".score-radar") !== null,
      }));

      await page.emulateMedia({ media: "print" });
      const measurePrint = () => {
        const visible = [...document.querySelectorAll(".result-wrap > *")]
          .filter((element) => getComputedStyle(element).display !== "none");
        const body = visible.map((element) => element.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
        return {
          sections: visible.map((element) => String(element.className).split(" ")[0]),
          text: body.length,
          // The raw text as well, so a check can look for something inside it rather than only
          // measure how much of it there is.
          codes: body.match(/TDFB1\|[^\s]+/g) ?? [],
          raw: body,
        };
      };
      await page.waitForTimeout(150);
      const printed = await page.evaluate(measurePrint);
      const pdf = await page.pdf({ format: "A4", printBackground: true });
      fs.writeFileSync(path.join(OUT_DIR, `${testCase.key}-${viewport.label}.pdf`), pdf);

      // The second export. The button adds this class and opens the <details> before printing --
      // a closed <details> renders nothing, so the facilitator section would otherwise print as an
      // empty bar -- and this reproduces both so the gate tests what the button actually does.
      await page.evaluate(() => {
        document.documentElement.classList.add("print-full");
        for (const element of document.querySelectorAll(".result-wrap details")) element.open = true;
      });
      await page.waitForTimeout(150);
      const printedFull = await page.evaluate(measurePrint);
      const pdfFull = await page.pdf({ format: "A4", printBackground: true });
      fs.writeFileSync(path.join(OUT_DIR, `${testCase.key}-${viewport.label}-full.pdf`), pdfFull);
      await page.evaluate(() => document.documentElement.classList.remove("print-full"));
      await page.emulateMedia({ media: "screen" });
      await context.close();

      const checks = [
        ["summary card renders on screen", onScreen.card > 300],
        ["radar renders on screen", onScreen.radar === true],
        ["print keeps the summary card", printed.sections.includes("summary-card")],
        ["print carries real text", printed.text > 300],
        ["pdf is not an empty sheet", pdf.length > 20000],
        ["pdf is at most 2 pages", pageCount(pdf) <= 2],
        // The full export has to be MORE than the summary, or the second button is a lie. It also
        // has to stay an allow-list: the sections it adds are named, and the export row and the
        // internal mapping panel stay out of both.
        ["full report carries more text", printedFull.text > printed.text * 1.5],
        ["full report keeps the summary card first", printedFull.sections[0] === "summary-card"],
        ["full report is not an empty sheet", pdfFull.length > 20000],
        ["full report runs to more than one page", pageCount(pdfFull) >= 2],
        ["full report stays under eight pages", pageCount(pdfFull) <= 8],
        ["neither export prints the buttons", !printed.sections.includes("export-row")
          && !printedFull.sections.includes("export-row")],
        ["neither export prints the internal mapping panel", !printed.sections.includes("mapping-details")
          && !printedFull.sections.includes("mapping-details")],
        // The full report has to carry the session code. A PDF is what people actually send back,
        // and the first two that came back — a screenshot, then a PDF — both carried the verdict
        // and lost the answers, which are the only part that can show the scoring to be wrong.
        ["full report carries the session code", (printedFull.codes ?? []).length === 1
          && /TDFB1\|b=[a-z0-9]+\|n=\d+\|a=\d+/.test(printedFull.codes[0])],
        ["the one-page card does not", !(printed.codes ?? []).length],
      ];
      for (const [name, passed] of checks) {
        if (!passed) failures.push(`${testCase.key} @ ${viewport.label}: ${name}`);
      }
      rows.push({
        case: testCase.key, viewport: viewport.label, cardChars: onScreen.card,
        printChars: printed.text, kb: Math.round(pdf.length / 1024), pages: pageCount(pdf),
        fullChars: printedFull.text, fullKb: Math.round(pdfFull.length / 1024), fullPages: pageCount(pdfFull),
        pass: checks.every(([, passed]) => passed),
      });
    }
  }
} finally {
  await browser.close();
}

const pad = (value, width) => String(value).padEnd(width);
console.log(`${pad("case", 17)}${pad("viewport", 10)}${pad("1-page", 18)}${pad("full report", 20)}result`);
for (const row of rows) {
  console.log(`${pad(row.case, 17)}${pad(row.viewport, 10)}`
    + `${pad(`${row.printChars}ch ${row.kb}KB ${row.pages}p`, 18)}`
    + `${pad(`${row.fullChars}ch ${row.fullKb}KB ${row.fullPages}p`, 20)}${row.pass ? "PASS" : "FAIL"}`);
}
console.log(`\nPDFs written to outputs/print/`);

if (failures.length > 0) {
  console.error(`\n${failures.length} failing checks:`);
  for (const failure of failures) console.error(`  - ${failure}`);
}
assert.equal(failures.length, 0, `${failures.length} print-gate checks failed`);
console.log("\nprint gate: PASS");
