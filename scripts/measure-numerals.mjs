// The numbers and code chips, measured and rendered.
//
// "The numbers look dry and small in places" is two complaints, and they have two different
// causes. Dry is stroke weight: the display family is a high-contrast serif whose hairlines thin
// out at chip sizes. Small is the chips themselves -- a 14px glyph centred in a 28px circle, a
// 12px label on a 260px chart.
//
// So this measures both. Ink coverage is the fraction of a chip's area the glyph actually paints,
// which is the closest thing to "how dry does this look" that can be counted rather than argued
// about, and the specimen sheet renders the app's real chips at their real sizes so the number has
// something to be checked against.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run type:numerals

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { assertFacesLoaded, inlinedFontCss, loadChromium } from "./lib/google-fonts.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const projectRoot = path.resolve(import.meta.dirname, "..");
const OUT = path.join(projectRoot, "outputs/typography");
const CACHE = path.join(OUT, ".font-cache");

// Where numbers and code chips actually come from today, measured with a walk over the live app:
//   .summary-badge  "5w6"     Playfair Display 17px/600 in a 52px circle
//   .answer-key     "A".."D"  Playfair Display 14px/600 in a 28px circle
//   .type-code      "INTJ-A"  Playfair Display 17px/500 on the dark hero
//   .radar-label    "1".."9"  Noto Sans Thai   12px/600 (core 15/700, wing 13/700)
// Two families for one job is itself part of why it reads oddly, so the candidates below are
// judged on all four chips at once.
const CANDIDATES = [
  { family: "Playfair Display", note: "ปัจจุบัน — serif contrast สูง เส้นบางที่ขนาดเล็ก" },
  { family: "Noto Sans Thai", note: "ฟอนต์ไทยที่ใช้อยู่ — ใช้ตัวเลขจากตัวเดียวกันทั้งเว็บ" },
  { family: "Inter", note: "sans · เลขคมที่ขนาดเล็ก มี tabular figures" },
  { family: "IBM Plex Sans", note: "sans · เลขมีบุคลิก คู่กับ IBM Plex Sans Thai" },
  { family: "Public Sans", note: "sans · เส้นหนาแน่น ชัดที่ขนาดเล็กมาก" },
  { family: "Space Grotesk", note: "sans · เลขและรหัสดูเป็นเครื่องมือ เหมาะกับ 5w6" },
  { family: "IBM Plex Mono", note: "mono · ทุกตัวกว้างเท่ากัน เลขเรียงตรงคอลัมน์" },
  { family: "Source Serif 4", note: "serif · ถ้าอยากคงความเป็น serif แต่ไม่บาง" },
  { family: "Fraunces", note: "serif · contrast ต่ำกว่า Playfair มาก" },
];

const DIGITS = "0123456789";
// Specimens are rendered at 2x for legibility, so every pixel count measured off a screenshot is
// twice the CSS pixel count the page was laid out in.
const SCALE = 2;

function sheet(css) {
  const chip = (family, size, weight, text, box, dark) => `
    <div class="chip" style="width:${box}px;height:${box}px;${dark ? "background:#16362f;color:#fff" : ""}">
      <span style="font-family:'${family}',serif;font-size:${size}px;font-weight:${weight}">${text}</span>
    </div>`;
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>${css}
    body { margin:0; background:#fefdfa; color:#333; font-family:system-ui,sans-serif; }
    .sheet { padding:24px 28px 30px; }
    h1 { margin:0 0 3px; font-size:19px; color:#16362f; }
    .sub { margin:0 0 18px; font-size:12px; color:#5d6862; }
    .card { border:1px solid #dfe5df; border-radius:12px; background:#fff; padding:14px 16px 16px; margin-bottom:10px; }
    .card.current { border-color:#b9553f; background:#fdf7f4; }
    .name { display:flex; align-items:baseline; gap:9px; margin-bottom:11px; }
    .name b { font-size:13px; color:#16362f; }
    .name span { font-size:10.5px; color:#6e7a73; }
    .row { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
    .chip { border-radius:50%; background:#edf1eb; color:#3e6d58; display:grid; place-items:center; flex:none; }
    .lbl { font-size:9px; letter-spacing:.6px; text-transform:uppercase; color:#95a09a; margin-top:5px; text-align:center; }
    .unit { display:flex; flex-direction:column; align-items:center; }
    .digits { color:#2f3a35; }
    .ink { margin-left:auto; font-size:11px; color:#6e7a73; }
  </style></head><body><div class="sheet">
  <h1>ตัวเลขและรหัส — ชิปจริงจากเว็บ ขนาดจริง</h1>
  <p class="sub">ซ้ายไปขวา: ป้ายสรุป 52px (17px) · ปุ่มตัวเลือก 28px (14px) · ป้ายบนกราฟ (12px) · รหัสประเภทบนพื้นเข้ม (17px) · เลข 0-9 ที่ 14px และ 24px</p>
  ${CANDIDATES.map((item) => `<div class="card${/ปัจจุบัน/.test(item.note) ? " current" : ""}" data-family="${item.family}">
    <div class="name"><b>${item.family}</b><span>${item.note}</span><span class="ink" id="ink-${item.family.replace(/ /g, "_")}"></span></div>
    <div class="row">
      <div class="unit">${chip(item.family, 17, 600, "5w6", 52, true)}<div class="lbl">badge</div></div>
      <div class="unit">${chip(item.family, 14, 600, "A", 28, false)}<div class="lbl">option</div></div>
      <div class="unit"><span style="font-family:'${item.family}',serif;font-size:12px;font-weight:600;color:#36433c">1 2 3 4 5 6 7 8 9</span><div class="lbl">radar</div></div>
      <div class="unit"><span style="font-family:'${item.family}',serif;font-size:17px;font-weight:500;letter-spacing:2px;color:#16362f">INTJ-A · 5w6</span><div class="lbl">type code</div></div>
      <div class="unit"><span class="digits" style="font-family:'${item.family}',serif;font-size:14px;font-weight:600">${DIGITS}</span><div class="lbl">14px</div></div>
      <div class="unit"><span class="digits" style="font-family:'${item.family}',serif;font-size:24px;font-weight:600">${DIGITS}</span><div class="lbl">24px</div></div>
    </div>
  </div>`).join("")}
  </div></body></html>`;
}

const chromium = await loadChromium();
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let coverage = [];
const figures = [];
try {
  const families = CANDIDATES.map((item) => item.family);
  const css = await inlinedFontCss(families, CACHE);
  const context = await browser.newContext({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: SCALE });
  const page = await context.newPage();
  await page.setContent(sheet(css), { waitUntil: "networkidle" });
  const loaded = await assertFacesLoaded(page, families, "0123456789 5w6");
  console.log(`${loaded.faces} faces loaded; every family measures differently from the fallback.\n`);

  // Ink coverage: render "0123456789" alone, at one size, on white, and count how much of the
  // glyphs' own bounding box is painted. A hairline serif paints less of it than a sturdy sans,
  // and that difference is exactly the "dry" complaint.
  for (const family of families) {
    const shot = await page.evaluate(async ([name, digits]) => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;left:0;top:0;background:#fff;padding:6px 8px;z-index:99";
      probe.innerHTML = `<span style="font-family:'${name}',serif;font-size:48px;font-weight:600;color:#000">${digits}</span>`;
      document.body.appendChild(probe);
      await document.fonts.ready;
      const box = probe.getBoundingClientRect();
      probe.id = "ink-probe";
      return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
    }, [family, DIGITS]);
    const buffer = await page.screenshot({ clip: { x: shot.x, y: shot.y, width: shot.w, height: shot.h } });
    const { data, info } = await sharp(buffer).greyscale().raw().toBuffer({ resolveWithObject: true });
    let ink = 0;
    for (let index = 0; index < data.length; index += info.channels) if (data[index] < 128) ink += 1;
    const pixels = info.width * info.height;
    coverage.push({ family, ink: (ink / pixels) * 100, width: shot.w });
    await page.evaluate(() => document.getElementById("ink-probe")?.remove());
  }

  const base = coverage.find((row) => row.family === "Playfair Display").ink;
  await page.evaluate((rows) => {
    for (const row of rows) {
      const cell = document.getElementById(`ink-${row.family.replace(/ /g, "_")}`);
      if (cell) cell.textContent = `ink ${row.ink.toFixed(1)}%  (${row.relative >= 0 ? "+" : ""}${row.relative}% vs Playfair)`;
    }
  }, coverage.map((row) => ({ ...row, relative: Math.round(((row.ink / base) - 1) * 100) })));

  // Lining or oldstyle? Oldstyle figures sit at x-height with 3 4 5 7 9 descending and 6 8
  // ascending, which is beautiful in running prose and wrong in a chip: the digits read as smaller
  // than the letters beside them and the row looks ragged. Measured rather than eyeballed, by
  // rendering each digit alone and comparing the height of its ink.
  for (const family of families) {
    const heights = [];
    for (const digit of DIGITS) {
      const shot = await page.evaluate(async ([name, character]) => {
        const probe = document.createElement("div");
        probe.id = "digit-probe";
        probe.style.cssText = "position:fixed;left:0;top:0;background:#fff;padding:20px;z-index:99";
        probe.innerHTML = `<span style="font-family:'${name}',serif;font-size:80px;font-weight:600;color:#000;line-height:1">${character}</span>`;
        document.body.appendChild(probe);
        await document.fonts.ready;
        const box = probe.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
      }, [family, digit]);
      const buffer = await page.screenshot({ clip: { x: shot.x, y: shot.y, width: shot.w, height: shot.h } });
      const { data, info } = await sharp(buffer).greyscale().raw().toBuffer({ resolveWithObject: true });
      let top = null;
      let bottom = null;
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          if (data[(y * info.width + x) * info.channels] < 128) { if (top === null) top = y; bottom = y; break; }
        }
      }
      heights.push({ digit, top: top / SCALE, height: (bottom - top) / SCALE });
      await page.evaluate(() => document.getElementById("digit-probe")?.remove());
    }
    const tops = heights.map((row) => row.top);
    const sizes = heights.map((row) => row.height);
    figures.push({
      family,
      spread: Math.round(((Math.max(...sizes) - Math.min(...sizes)) / Math.max(...sizes)) * 1000) / 10,
      baselineSpread: Math.round(Math.max(...tops) - Math.min(...tops)),
      shortest: heights.reduce((a, b) => (a.height <= b.height ? a : b)).digit,
      tallest: heights.reduce((a, b) => (a.height >= b.height ? a : b)).digit,
      // At 80px of font-size, how tall is the ink actually? This is the other half of "the numbers
      // look small": a family whose digits only paint two thirds of the em looks smaller than its
      // font-size claims, before anyone changes a single size value.
      tallestPx: Math.round(Math.max(...sizes)),
      shortestPx: Math.round(Math.min(...sizes)),
    });
  }

  await page.screenshot({ path: path.join(OUT, "numeral-candidates.png"), fullPage: true });
  await context.close();
} finally {
  await browser.close();
}

const pad = (value, width) => String(value).padEnd(width);
const base = coverage.find((row) => row.family === "Playfair Display").ink;
console.log(`ink coverage of "${DIGITS}" at 48px/600 — how much of the glyph box each family paints:\n`);
console.log(`${pad("family", 20)}${pad("ink", 9)}${pad("vs current", 12)}width`);
for (const row of [...coverage].sort((a, b) => a.ink - b.ink)) {
  const relative = Math.round(((row.ink / base) - 1) * 100);
  console.log(`${pad(row.family, 20)}${pad(`${row.ink.toFixed(1)}%`, 9)}`
    + `${pad(`${relative >= 0 ? "+" : ""}${relative}%`, 12)}${row.width}px`);
}
console.log(`\ndigit heights at 80px — a large spread means oldstyle figures, which read as`
  + ` smaller and more ragged than the letters beside them:\n`);
console.log(`${pad("family", 20)}${pad("spread", 9)}${pad("tops vary", 11)}${pad("ink height of a digit", 23)}shortest / tallest`);
for (const row of [...figures].sort((a, b) => b.spread - a.spread)) {
  console.log(`${pad(row.family, 20)}${pad(`${row.spread}%`, 9)}${pad(`${row.baselineSpread}px`, 11)}`
    + `${pad(`${row.shortestPx}-${row.tallestPx}px of 80px`, 23)}${row.shortest} / ${row.tallest}`);
}
console.log(`\noutputs/typography/numeral-candidates.png`);
