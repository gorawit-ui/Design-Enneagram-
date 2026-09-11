// Typography audit, executed against the running app.
//
// "The text reads thin and flat" is an impression until it is measured. This script walks every
// visible text node on the four screens and records the family / size / weight / colour the browser
// actually resolved, then computes the WCAG contrast of each against its real painted background.
//
// The background is sampled from pixels, not from CSS: an earlier version read `background-color`
// up the ancestor chain, which cannot see a gradient or an image, and duly reported the white hero
// headline as 1.02:1. Instead the page is screenshotted twice -- once as it is, once with every
// glyph made transparent -- and the ink-free shot gives the colour actually painted behind each
// run of text.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run type:audit                     (or BASE_URL=http://127.0.0.1:3000 npm run type:audit)

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const projectRoot = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT = path.join(projectRoot, "outputs/typography");

// The `intjA5w6` fixture from app/lib/assessment-fixtures.ts, as option indexes. A CLEAR result is
// required, not just any result: the depth, radar, cross-reading and tension-map sections only
// render when the Enneagram core is unambiguous, and unrendered text cannot be measured.
const ANSWERS = [3, 1, 0, 1, 2, 1, 2, 1, 1, 1, 3, 0, 3, 0, 0, 0, 0, 1, 3, 0, 1, 3, 1, 1];

const VIEWPORTS = [
  { w: 390, h: 844, label: "390px" },
  { w: 1280, h: 800, label: "desktop" },
];

async function loadChromium() {
  for (const specifier of ["playwright", "playwright-core", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try {
      return (await import(specifier)).chromium;
    } catch { /* try the next resolution strategy */ }
  }
  throw new Error("Playwright is not resolvable.");
}

// One row per run of text, boxed by its own Range rather than by its parent element: a parent's box
// includes padding and siblings, and sampling those would read the padding as the background.
function collect() {
  const rows = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const element = node.parentElement;
    if (!element) continue;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || Number(style.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    range.detach();
    if (rect.width < 1 || rect.height < 1) continue;

    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight);
    rows.push({
      text: text.slice(0, 44),
      selector: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().split(/\s+/).join(".")}` : ""}`.slice(0, 52),
      family: style.fontFamily.split(",")[0].replace(/["']/g, ""),
      size: Math.round(size * 10) / 10,
      weight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      colour: style.color,
      // WCAG "large text" is >=24px, or >=18.66px at weight 700+.
      large: size >= 24 || (size >= 18.66 && weight >= 700),
      thai: /[฀-๿]/.test(text),
      box: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      },
    });
  }
  return rows;
}

async function screenshotWithoutInk(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{color:transparent!important;text-shadow:none!important;`
      + `-webkit-text-stroke-color:transparent!important;caret-color:transparent!important}`,
  });
  const buffer = await page.screenshot({ fullPage: true });
  return buffer;
}

const lin = (value) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrastOf = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};
const parseColour = (value) => {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
};
const composite = (top, bottom) => ({
  r: top.r * top.a + bottom.r * (1 - top.a),
  g: top.g * top.a + bottom.g * (1 - top.a),
  b: top.b * top.a + bottom.b * (1 - top.a),
});

// The mean of the ink-free pixels under a run of text. A run that straddles two colours (a headline
// over a gradient) averages them, which is what a reader's eye does with it anyway.
function meanUnder(raw, width, height, channels, box) {
  const x0 = Math.max(0, box.x);
  const y0 = Math.max(0, box.y);
  const x1 = Math.min(width, box.x + box.w);
  const y1 = Math.min(height, box.y + box.h);
  if (x1 <= x0 || y1 <= y0) return null;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const index = (y * width + x) * channels;
      r += raw[index];
      g += raw[index + 1];
      b += raw[index + 2];
      n += 1;
    }
  }
  return { r: r / n, g: g / n, b: b / n };
}

async function walkScreens(page, onScreen) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await onScreen("welcome", page);
  await page.click(".hero-copy .primary-button");
  await page.waitForSelector(".profile-card");
  const inputs = page.locator(".profile-card input:not([type=checkbox])");
  await inputs.nth(0).fill("Type Audit");
  await page.click('.segmented button:has-text("ไม่ระบุ")');
  await inputs.nth(1).fill("QA");
  await onScreen("profile", page);
  await page.check(".consent input[type=checkbox]");
  await page.click(".profile-card .primary-button.full");
  await page.waitForSelector(".question-card");
  await onScreen("question", page);
  for (const choice of ANSWERS) {
    await page.waitForSelector(".answers button");
    await page.locator(".answers button").nth(choice).click();
    await page.click(".question-actions .primary-button");
  }
  await page.waitForSelector(".result-wrap");
  await page.waitForFunction(() => {
    const img = document.querySelector(".result-character-image");
    return !img || (img.complete && img.naturalWidth > 0);
  }, null, { timeout: 30000 });
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))));
  await page.waitForTimeout(300);
  await onScreen("result", page);
}

const chromium = await loadChromium();
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const all = [];
try {
  for (const vp of VIEWPORTS) {
    // Each screen is measured in its own context: the ink-hiding stylesheet is not reversible, so
    // the shot has to be the last thing that happens to a page.
    for (const target of ["welcome", "profile", "question", "result"]) {
      const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      let rows = null;
      await walkScreens(page, async (screen) => {
        if (screen !== target || rows) return;
        rows = await page.evaluate(collect);
        const shot = await screenshotWithoutInk(page);
        const image = sharp(shot);
        const meta = await image.metadata();
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        for (const row of rows) {
          const background = meanUnder(data, info.width, info.height, info.channels, row.box);
          const foreground = parseColour(row.colour);
          row.background = background
            ? `rgb(${Math.round(background.r)}, ${Math.round(background.g)}, ${Math.round(background.b)})` : null;
          row.contrast = background
            ? Math.round(contrastOf(composite(foreground, background), background) * 100) / 100 : null;
          all.push({ viewport: vp.label, screen, ...row });
        }
        void meta;
      });
      await context.close();
      if (!rows) throw new Error(`screen ${target} was never reached`);
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(OUT, "nodes.json"), `${JSON.stringify(all, null, 2)}\n`);

const pad = (value, width) => String(value).padStart(width);
const measured = all.filter((row) => row.contrast !== null);
const families = new Map();
for (const row of all) families.set(row.family, (families.get(row.family) ?? 0) + 1);

console.log(`${all.length} runs of text measured across ${VIEWPORTS.length} viewports x 4 screens\n`);
console.log("families actually resolved:");
for (const [family, count] of [...families].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${pad(count, 5)}  ${family}`);
}

const weights = new Map();
for (const row of all) weights.set(row.weight, (weights.get(row.weight) ?? 0) + 1);
console.log("\nweights actually resolved:");
for (const [weight, count] of [...weights].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${pad(count, 5)}  w${weight}`);
}

const key = (row) => `${row.family}|${row.size}|${row.weight}|${row.colour}|${row.background}`;
const groups = new Map();
for (const row of measured) {
  const existing = groups.get(key(row)) ?? { ...row, count: 0, samples: [] };
  existing.count += 1;
  if (existing.samples.length < 1 && row.text) existing.samples.push(row.text);
  groups.set(key(row), existing);
}
const ranked = [...groups.values()].sort((a, b) => a.contrast - b.contrast || a.size - b.size);
const line = (row) => `  ${pad(row.size, 5)}px  w${row.weight}  ${pad(row.contrast.toFixed(2), 6)}:1  ${pad(row.count, 3)}x  `
  + `${row.colour.padEnd(19)} on ${String(row.background).padEnd(19)}  ${row.samples[0] ?? ""}`;

const report = (title, rows) => {
  console.log(`\n${title} — ${rows.reduce((sum, row) => sum + row.count, 0)} runs in ${rows.length} distinct styles:`);
  for (const row of rows) console.log(line(row));
};

report("below WCAG AA contrast (4.5:1, or 3:1 for large text)", ranked.filter((row) => row.contrast < (row.large ? 3 : 4.5)));
report("under 14px", [...ranked].filter((row) => row.size < 14).sort((a, b) => a.size - b.size));
report("Thai body text under 15px at weight < 500", [...ranked]
  .filter((row) => row.thai && row.weight < 500 && row.size < 15).sort((a, b) => a.size - b.size));

console.log(`\nfull node list: outputs/typography/nodes.json`);
