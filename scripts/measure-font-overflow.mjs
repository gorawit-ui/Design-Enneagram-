// Which font candidates break the layout, and where.
//
// Swapping the Thai family is not a variable change: the welcome headline is `white-space: nowrap`
// at a clamped size, and the candidates run from 100% to 114% of the current family's width on the
// same sentence. This swaps each candidate into the running app and reports what overflows, so the
// font decision can be made knowing which choices are free and which come with a layout fix.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run type:overflow

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const CACHE = path.join(projectRoot, "outputs/typography/.font-cache");
const CHROME_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
  + "Chrome/126.0.0.0 Safari/537.36";

const FAMILIES = [
  "Noto Sans Thai", "Sarabun", "Anuphan", "IBM Plex Sans Thai", "Krub", "Bai Jamjuree",
  "Prompt", "Kanit", "Noto Sans Thai Looped", "IBM Plex Sans Thai Looped", "Mitr", "Niramit",
  "Maitree", "Trirong",
];
// 450 is the weight the swap proposal raises body text to; the headline sits at 600.
const WEIGHT = Number(process.env.BODY_WEIGHT ?? 450);
// 900px earns its place: it is the first width above the 899px breakpoint, so the two-column
// welcome layout appears with the narrowest hero column it ever gets. A swap that is clean at 390,
// 768 and 1280 can still overlap the illustration here, which is how the first look at these
// screenshots read as "Sarabun overflows" when the measurement at three widths said it did not.
const VIEWPORTS = [{ w: 390, h: 844 }, { w: 768, h: 1024 }, { w: 900, h: 900 }, { w: 1280, h: 800 }];

async function inlinedFontCss(family) {
  fs.mkdirSync(CACHE, { recursive: true });
  const cssPath = path.join(CACHE, `${family.replace(/[^a-z0-9]/gi, "_")}.css`);
  if (fs.existsSync(cssPath)) return fs.readFileSync(cssPath, "utf8");
  const href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}`
    + ":wght@400;500;600;700&display=block";
  let css = await (await fetch(href, { headers: { "user-agent": CHROME_UA } })).text();
  for (const source of [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? [])]) {
    const file = path.join(CACHE, source.split("/").pop());
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, Buffer.from(await (await fetch(source, { headers: { "user-agent": CHROME_UA } })).arrayBuffer()));
    }
    css = css.split(source).join(`data:font/woff2;base64,${fs.readFileSync(file).toString("base64")}`);
  }
  fs.writeFileSync(cssPath, css);
  return css;
}

async function loadChromium() {
  for (const specifier of ["playwright", "playwright-core", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try { return (await import(specifier)).chromium; } catch { /* next */ }
  }
  throw new Error("Playwright is not resolvable.");
}

// Two different failures, and they are not the same thing. A nowrap headline wider than its own
// column overlaps whatever sits beside it -- on the welcome screen, the illustration. Anything
// past the document edge is a horizontal scrollbar on a phone.
function measure() {
  const root = document.documentElement;
  const report = { scrollsX: root.scrollWidth > root.clientWidth + 1, nowrapOverflow: [], pastViewport: [] };
  for (const element of document.querySelectorAll("body *")) {
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const box = element.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) continue;
    const name = `${element.tagName.toLowerCase()}.${String(element.className).trim().split(/\s+/).join(".")}`.slice(0, 40);
    // scrollWidth beats clientWidth when the line does not fit the box it is laid out in.
    if (element.scrollWidth > element.clientWidth + 1 && style.overflowX === "visible") {
      report.nowrapOverflow.push(`${name} +${element.scrollWidth - element.clientWidth}px`);
    }
    if (!String(element.className).includes("ambient")
      && (box.left < -1 || box.right > root.clientWidth + 1)) {
      report.pastViewport.push(`${name} +${Math.round(box.right - root.clientWidth)}px`);
    }
  }
  return report;
}

const chromium = await loadChromium();
const browser = await chromium.launch();
const results = [];
try {
  for (const family of FAMILIES) {
    const css = family === "Noto Sans Thai" ? null : await inlinedFontCss(family);
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      if (css) {
        await page.addStyleTag({ content: css });
        await page.addStyleTag({ content: `body, body *:not(.monogram):not(.type-code) {`
          + ` font-family: '${family}', sans-serif !important; }`
          + ` .hero-text, .fine-print, .secure-note, .summary-line { font-weight: ${WEIGHT} !important; }` });
        await page.evaluate(async ([name, text]) => {
          await Promise.all([400, 450, 500, 600, 700].map((weight) =>
            document.fonts.load(`${weight} 40px '${name}'`, text).catch(() => {})));
          await document.fonts.ready;
        }, [family, "เข้าใจตัวเองให้ชัดขึ้น ทำงานและเติบโตไปด้วยกัน"]);
        await page.waitForTimeout(250);
      }
      const report = await page.evaluate(measure);
      results.push({ family, viewport: `${viewport.w}px`, ...report });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const pad = (value, width) => String(value).padEnd(width);
console.log(`Welcome screen, each candidate swapped in at body weight ${WEIGHT}.\n`);
console.log(`${pad("family", 25)}${VIEWPORTS.map((viewport) => pad(`${viewport.w}px`, 20)).join("")}`);
for (const family of FAMILIES) {
  const cells = VIEWPORTS.map((viewport) => {
    const row = results.find((item) => item.family === family && item.viewport === `${viewport.w}px`);
    const problems = row.nowrapOverflow.length + row.pastViewport.length + (row.scrollsX ? 1 : 0);
    if (problems === 0) return "ok";
    const worst = [...row.nowrapOverflow, ...row.pastViewport][0] ?? "scrolls sideways";
    return `${row.scrollsX ? "SCROLLS " : ""}${worst}`;
  });
  console.log(`${pad(family, 25)}${cells.map((cell) => pad(cell, 20)).join("")}`);
}

const detail = results.filter((row) => row.nowrapOverflow.length || row.pastViewport.length || row.scrollsX);
if (detail.length > 0) {
  console.log(`\nwhat overflows:`);
  for (const row of detail) {
    console.log(`  ${row.family} @ ${row.viewport}`
      + (row.scrollsX ? " — page scrolls sideways" : "")
      + (row.nowrapOverflow.length ? `\n      text wider than its box: ${row.nowrapOverflow.join(", ")}` : "")
      + (row.pastViewport.length ? `\n      past the viewport edge: ${row.pastViewport.join(", ")}` : ""));
  }
} else {
  console.log(`\nNo candidate overflows anything at any of the three widths.`);
}
