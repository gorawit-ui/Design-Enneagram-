// Font specimens for the Thai + Latin decision, rendered rather than described.
//
// A list of family names is not a decision aid: "Sarabun" and "Anuphan" mean nothing until you see
// the app's own sentences set in them, at the app's own sizes. This renders each candidate with
// real copy pulled from the product, and also swaps the candidate into the live result page so the
// comparison is against the thing being changed rather than against a specimen sheet.
//
// Usage:
//   npm run build && npm run start -- --port 3000 &
//   npm run type:specimens

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT = path.join(projectRoot, "outputs/typography");

// Loopless Thai first (the current family is loopless, so these are like-for-like), then looped,
// then the serifs. `note` is why the family is on the list at all.
const THAI = [
  { family: "Noto Sans Thai", note: "ปัจจุบัน — loopless, น้ำหนักบาง" },
  { family: "Sarabun", note: "loopless · มาตรฐานเอกสารราชการไทย" },
  { family: "Anuphan", note: "loopless · ตัวกว้าง ช่องในตัวอักษรเปิด" },
  { family: "IBM Plex Sans Thai", note: "loopless · คู่แฝดกับ IBM Plex Sans (metric ตรงกัน)" },
  { family: "Krub", note: "loopless · ตัวกลม อ่านสบาย" },
  { family: "Bai Jamjuree", note: "loopless · ตัวแคบ ประหยัดที่" },
  { family: "Prompt", note: "loopless geometric · ทรงเรขาคณิต" },
  { family: "Kanit", note: "loopless · หนาแน่น ใช้เป็นหัวข้อดี" },
  { family: "Noto Sans Thai Looped", note: "มีหัว · อ่านง่ายแบบไทยดั้งเดิม" },
  { family: "IBM Plex Sans Thai Looped", note: "มีหัว · คู่แฝดกับ IBM Plex Sans" },
  { family: "Mitr", note: "มีหัวกลม · เป็นมิตร ไม่เป็นทางการ" },
  { family: "Niramit", note: "มีหัว · ตัวเรียว ทางการ" },
  { family: "Maitree", note: "serif มีหัว · สำหรับเนื้อความยาว" },
  { family: "Trirong", note: "serif · มีบุคลิก ใช้เป็นหัวข้อ" },
];

const LATIN = [
  { family: "Playfair Display", note: "ปัจจุบัน (หัวข้อ/ป้าย) — serif contrast สูง บางที่ขนาดเล็ก" },
  { family: "Inter", note: "sans · ออกแบบมาสำหรับ UI ขนาดเล็ก" },
  { family: "IBM Plex Sans", note: "sans · คู่กับ IBM Plex Sans Thai" },
  { family: "Source Sans 3", note: "sans · เป็นกลาง อ่านง่าย" },
  { family: "Public Sans", note: "sans · ตัวหนาแน่น ชัดที่ขนาดเล็ก" },
  { family: "DM Sans", note: "sans geometric · ทันสมัย" },
  { family: "Plus Jakarta Sans", note: "sans · บุคลิกชัด ใช้เป็นแบรนด์ได้" },
  { family: "Instrument Serif", note: "serif display · ใช้แทน Playfair เฉพาะหัวข้อใหญ่" },
  { family: "Source Serif 4", note: "serif · contrast ต่ำกว่า Playfair ไม่บางที่ขนาดเล็ก" },
  { family: "Newsreader", note: "serif · อ่านสบายทั้งหัวข้อและเนื้อความ" },
  { family: "Fraunces", note: "serif display · ปรับ soft/wonk ได้ มีบุคลิก" },
];

const HEADLINE = "เข้าใจตัวเองให้ชัดขึ้น";
const BODY = "นำความรู้ที่ลึกออกมาแบ่งให้คนอื่นใช้ได้โดยไม่รู้สึกว่าถูกสอน จึงเห็นโครงของปัญหาก่อนคนอื่น";
const SMALL = "ไม่มีการส่งข้อมูลออกจากเครื่องคุณ — ทั้งสามปุ่มนี้สร้างไฟล์หรือข้อความให้คุณเลือกเองว่าจะให้ใคร";
const LABEL = "สิ่งที่กลัวจริง ๆ";
const MIXED = "INTJ-A × Enneagram 5w6 · ลักษณ์ 5 · Wing 6";
const LATIN_HEAD = "Personality is a map, not a box";
const LATIN_BODY = "The result names a direction, not a verdict. Nine cores, five axes, twenty-four items.";

const url = (families) => `https://fonts.googleapis.com/css2?${families
  .map((family) => `family=${family.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=block`;

// The browser in this container cannot reach fonts.googleapis.com -- only the proxied Node fetch
// can. An earlier run of this script linked the stylesheet and rendered fourteen cards that were
// all the same fallback face, which is worse than no specimen at all, so the faces are fetched
// here and inlined as data URIs. loadedFaces below is the check that they arrived.
const CHROME_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
  + "Chrome/126.0.0.0 Safari/537.36";
const CACHE = path.join(OUT, ".font-cache");

async function inlinedFontCss(families) {
  fs.mkdirSync(CACHE, { recursive: true });
  const cssPath = path.join(CACHE, `${families.join("+").replace(/[^a-z0-9+]/gi, "_")}.css`);
  if (fs.existsSync(cssPath)) return fs.readFileSync(cssPath, "utf8");

  const response = await fetch(url(families), { headers: { "user-agent": CHROME_UA } });
  if (!response.ok) throw new Error(`Google Fonts returned ${response.status}`);
  let css = await response.text();
  const sources = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? [])];
  if (sources.length === 0) throw new Error("no font files in the returned stylesheet");
  for (const source of sources) {
    const file = path.join(CACHE, source.split("/").pop());
    if (!fs.existsSync(file)) {
      const font = await fetch(source, { headers: { "user-agent": CHROME_UA } });
      if (!font.ok) throw new Error(`${source} returned ${font.status}`);
      fs.writeFileSync(file, Buffer.from(await font.arrayBuffer()));
    }
    const mime = file.endsWith(".woff2") ? "font/woff2" : "font/woff";
    css = css.split(source).join(`data:${mime};base64,${fs.readFileSync(file).toString("base64")}`);
  }
  fs.writeFileSync(cssPath, css);
  return css;
}

// A specimen sheet whose faces silently fell back is the failure this script already shipped once.
// The probe string has to be in the script the families cover: a Latin family has no Thai glyphs
// and would measure as fallback against Thai text however well it loaded.
async function assertFacesLoaded(page, families, probeText = "เข้าใจตัวเองให้ชัดขึ้น") {
  // A face injected after first paint stays "unloaded" until something asks for it, and
  // document.fonts.ready does not ask -- it resolves against what is already pending. Measuring
  // there reads the fallback metrics, which is how this check first reported a working swap as
  // broken. Loading each face explicitly for the sample text is what makes it real.
  await page.evaluate(async ([names, text]) => {
    await Promise.all(names.flatMap((family) => [400, 450, 500, 600, 700].map((weight) =>
      document.fonts.load(`${weight} 40px '${family}'`, text).catch(() => {}))));
    await document.fonts.ready;
  }, [families, `${probeText} INTJ-A 5w6`]);

  const report = await page.evaluate(([names, text]) => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;left:-9999px;display:inline-block;white-space:nowrap";
    probe.textContent = text;
    document.body.appendChild(probe);
    // setProperty with "important", because on the swapped page the override this script injects is
    // itself !important and would otherwise win over the probe's own inline font.
    const widthOf = (family) => {
      probe.style.setProperty("font-size", "40px", "important");
      probe.style.setProperty("font-weight", "400", "important");
      probe.style.setProperty("font-family", `'${family}', monospace`, "important");
      return Math.round(probe.getBoundingClientRect().width * 10) / 10;
    };
    const fallback = widthOf("__no_such_family__");
    const widths = names.map((family) => ({ family, width: widthOf(family) }));
    probe.remove();
    return { faces: document.fonts.size, fallback, widths };
  }, [families, probeText]);
  const identical = report.widths.filter((row) => row.width === report.fallback).map((row) => row.family);
  if (report.faces === 0 || identical.length > 0) {
    throw new Error(`fonts did not load (${report.faces} faces); measured as fallback: ${identical.join(", ")}`);
  }
  return report;
}

function sheet(title, subtitle, items, blocks) {
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<style>__FONT_CSS__</style>
<style>
  body { margin: 0; background: #fefdfa; color: #333; font-family: system-ui, sans-serif; }
  .sheet { padding: 26px 30px 34px; }
  h1 { margin: 0 0 4px; font-size: 20px; color: #16362f; letter-spacing: -.3px; }
  .sub { margin: 0 0 20px; font-size: 12px; color: #5d6862; }
  .card { border: 1px solid #dfe5df; border-radius: 12px; background: #fff; padding: 15px 18px 17px; margin-bottom: 11px; }
  .card.current { border-color: #b9553f; background: #fdf7f4; }
  .name { display: flex; align-items: baseline; gap: 9px; margin-bottom: 9px; }
  .name b { font-size: 13px; color: #16362f; letter-spacing: .2px; }
  .name span { font-size: 10.5px; color: #6e7a73; }
  .tag { margin-left: auto; font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; color: #b9553f; }
</style></head><body><div class="sheet">
<h1>${title}</h1><p class="sub">${subtitle}</p>
${items.map((item) => `<div class="card${/ปัจจุบัน/.test(item.note) ? " current" : ""}">
  <div class="name"><b>${item.family}</b><span>${item.note}</span>${/ปัจจุบัน/.test(item.note) ? '<span class="tag">in use now</span>' : ""}</div>
  <div style="font-family:'${item.family}',sans-serif">${blocks}</div>
</div>`).join("")}
</div></body></html>`;
}

const THAI_BLOCKS = `
  <div style="font-size:38px;font-weight:600;line-height:1.34;letter-spacing:-1px;color:#16362f">${HEADLINE}</div>
  <div style="font-size:15px;font-weight:400;line-height:1.75;color:#59645f;margin-top:7px">${BODY}</div>
  <div style="font-size:15px;font-weight:500;line-height:1.75;color:#454f4a;margin-top:3px">${BODY}</div>
  <div style="font-size:13px;font-weight:400;line-height:1.7;color:#5d6862;margin-top:5px">${SMALL}</div>
  <div style="margin-top:8px;display:flex;gap:16px;align-items:baseline;flex-wrap:wrap">
    <span style="font-size:11.5px;font-weight:700;color:#3e6d58;letter-spacing:.3px">${LABEL}</span>
    <span style="font-size:14px;font-weight:400;color:#3f4d45">${MIXED}</span>
    <span style="font-size:16px;font-weight:600;color:#16362f">ถัดไป →</span>
  </div>`;

const LATIN_BLOCKS = `
  <div style="font-size:34px;font-weight:600;line-height:1.2;letter-spacing:-.8px;color:#16362f">${LATIN_HEAD}</div>
  <div style="font-size:15px;font-weight:400;line-height:1.7;color:#59645f;margin-top:7px">${LATIN_BODY}</div>
  <div style="margin-top:8px;display:flex;gap:18px;align-items:baseline;flex-wrap:wrap">
    <span style="font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#3e6d58">TDFB Personality Quest</span>
    <span style="font-size:14px;font-weight:500;letter-spacing:1.6px;color:#3f4d45">INTJ-A · 5w6</span>
    <span style="font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#5d6862">Employee · ready</span>
  </div>`;

async function loadChromium() {
  for (const specifier of ["playwright", "playwright-core", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try { return (await import(specifier)).chromium; } catch { /* next */ }
  }
  throw new Error("Playwright is not resolvable.");
}

const chromium = await loadChromium();
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, html, width] of [
    ["thai-candidates", sheet("ฟอนต์ไทยที่เลือกได้", "ประโยคจริงจากเว็บ ขนาดจริงที่ใช้อยู่ · แถวที่ 2 ของแต่ละการ์ดคือน้ำหนัก 500 เทียบกับ 400", THAI, THAI_BLOCKS), 900],
    ["latin-candidates", sheet("ฟอนต์อังกฤษที่เลือกได้", "ใช้กับหัวข้อ ป้าย และรหัสประเภท (ตอนนี้คือ Playfair Display)", LATIN, LATIN_BLOCKS), 900],
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const families = (name === "thai-candidates" ? THAI : LATIN).map((item) => item.family);
    await page.setContent(html.replace("__FONT_CSS__", await inlinedFontCss(families)), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const loaded = await assertFacesLoaded(page, families,
      name === "thai-candidates" ? "เข้าใจตัวเองให้ชัดขึ้น" : "Personality is a map");
    // Set width relative to the family in use, because the welcome headline is `white-space:
    // nowrap` at a clamped size: a family 14% wider does not just look different, it overflows.
    // Anything far from 100% needs the headline re-tuned as part of the swap.
    const base = loaded.widths.find((row) => row.width && /Noto Sans Thai$|Playfair/.test(row.family));
    console.log(`  ${loaded.faces} faces loaded. Width of the sample line, against ${base.family} = 100%:`);
    for (const row of [...loaded.widths].sort((a, b) => a.width - b.width)) {
      const relative = Math.round((row.width / base.width) * 1000) / 10;
      console.log(`    ${String(relative).padStart(5)}%  ${String(row.width).padStart(5)}px  ${row.family}`);
    }
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    await context.close();
    console.log(`outputs/typography/${name}.png`);
  }

  // The same two screens, once as they are and once with a candidate swapped in, so the comparison
  // is against the product rather than against a specimen.
  const swaps = JSON.parse(process.env.SWAPS ?? '[["current",null],["sarabun","Sarabun"],["anuphan","Anuphan"],["plex","IBM Plex Sans Thai Looped"]]');
  for (const [label, family] of swaps) {
    const context = await browser.newContext({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    if (family) {
      await page.addStyleTag({ content: await inlinedFontCss([family]) });
      // Body weight goes up with the family swap: the complaint is thinness, and 400 in a new
      // family is still 400. This is the proposed change, not just a family substitution.
      await page.addStyleTag({ content: `body, body * { font-family: '${family}', sans-serif !important; }
        body { font-weight: 450 !important; } .hero-text, .fine-print, .secure-note { font-weight: 450 !important; }` });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await assertFacesLoaded(page, [family]);
    }
    await page.screenshot({ path: path.join(OUT, `welcome-${label}.png`) });
    await context.close();
    console.log(`outputs/typography/welcome-${label}.png`);
  }
} finally {
  await browser.close();
}
