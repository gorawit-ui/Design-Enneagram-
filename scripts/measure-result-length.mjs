// How long is the result page, and how far down is the answer?
//
// docs/UX_REVIEW_2026-09-10.md §3 found it 4797px on a phone -- about 5.7 screens -- with nothing
// to say so, against an onsite playbook that gives a participant sixty seconds to read it. The
// summary card was the first half of the answer. This measures what is left, per section, so the
// rest is a decision about specific blocks rather than a feeling about length.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run result:length

import { loadChromium } from "./lib/google-fonts.mjs";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const ANSWERS = [3, 1, 0, 1, 2, 1, 2, 1, 1, 1, 3, 0, 3, 0, 0, 0, 0, 1, 3, 0, 1, 3, 1, 1];
const VIEWPORT = { width: 390, height: 844 };

const chromium = await loadChromium();
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.click(".hero-copy .primary-button");
  await page.waitForSelector(".profile-card");
  const inputs = page.locator(".profile-card input:not([type=checkbox])");
  await inputs.nth(0).fill("Length");
  await page.click('.segmented button:has-text("ไม่ระบุ")');
  await inputs.nth(1).fill("QA");
  await page.check(".consent input[type=checkbox]");
  await page.click(".profile-card .primary-button.full");
  await page.waitForSelector(".question-card");
  for (const choice of ANSWERS) {
    await page.waitForSelector(".answers button");
    const available = await page.locator(".answers button").count();
    await page.locator(".answers button").nth(Math.min(choice, available - 1)).click();
    await page.click(".question-actions .primary-button");
  }
  await page.waitForSelector(".result-wrap");
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(600);

  const report = await page.evaluate((viewportHeight) => {
    const wrap = document.querySelector(".result-wrap");
    const sections = [...wrap.children].map((element) => {
      const box = element.getBoundingClientRect();
      return {
        name: String(element.className).split(" ")[0] || element.tagName.toLowerCase(),
        height: Math.round(box.height),
        screens: Math.round((box.height / viewportHeight) * 10) / 10,
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim().length,
      };
    });
    return {
      total: Math.round(wrap.getBoundingClientRect().height),
      document: document.documentElement.scrollHeight,
      sections,
    };
  }, VIEWPORT.height);

  const screens = (report.document / VIEWPORT.height).toFixed(1);
  console.log(`result page at ${VIEWPORT.width}x${VIEWPORT.height}\n`);
  console.log(`  ${report.document}px — ${screens} screens of scrolling\n`);
  const pad = (value, width) => String(value).padEnd(width);
  console.log(`${pad("section", 22)}${pad("height", 9)}${pad("screens", 9)}chars`);
  let cumulative = 0;
  for (const section of report.sections) {
    cumulative += section.height;
    console.log(`${pad(section.name, 22)}${pad(`${section.height}px`, 9)}${pad(section.screens, 9)}${section.text}`);
  }
  console.log(`\ncumulative height of the sections: ${cumulative}px`);
  await context.close();
} finally {
  await browser.close().catch(() => {});
}
