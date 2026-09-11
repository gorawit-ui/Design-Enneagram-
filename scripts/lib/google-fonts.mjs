// Shared plumbing for the typography scripts.
//
// Three scripts now need the same two things, and both are things that fail quietly if you get
// them wrong, so they live here rather than being copied a third time:
//
//   1. The browser in this environment cannot reach fonts.googleapis.com -- only the proxied Node
//      fetch can. Linking the stylesheet renders every candidate in the same fallback face, which
//      is what the first specimen sheet did: fourteen cards that all looked identical.
//   2. A face injected after first paint stays "unloaded" until something asks for it, and
//      document.fonts.ready does not ask. Measuring there reads fallback metrics.

import fs from "node:fs";
import path from "node:path";

const CHROME_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
  + "Chrome/126.0.0.0 Safari/537.36";

export async function loadChromium() {
  for (const specifier of ["playwright", "playwright-core", "/opt/node22/lib/node_modules/playwright/index.mjs"]) {
    try { return (await import(specifier)).chromium; } catch { /* try the next resolution strategy */ }
  }
  throw new Error("Playwright is not resolvable.");
}

export const googleFontsUrl = (families, weights = "400;500;600;700") =>
  `https://fonts.googleapis.com/css2?${families
    .map((family) => `family=${family.replace(/ /g, "+")}:wght@${weights}`).join("&")}&display=block`;

/** The stylesheet for these families with every font file inlined as a data URI. Cached on disk. */
export async function inlinedFontCss(families, cacheDir, weights) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const cssPath = path.join(cacheDir, `${families.join("+").replace(/[^a-z0-9+]/gi, "_")}.css`);
  if (fs.existsSync(cssPath)) return fs.readFileSync(cssPath, "utf8");

  const response = await fetch(googleFontsUrl(families, weights), { headers: { "user-agent": CHROME_UA } });
  if (!response.ok) throw new Error(`Google Fonts returned ${response.status} for ${families.join(", ")}`);
  let css = await response.text();
  const sources = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) ?? [])];
  if (sources.length === 0) throw new Error(`no font files in the stylesheet for ${families.join(", ")}`);
  for (const source of sources) {
    const file = path.join(cacheDir, source.split("/").pop());
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

/**
 * Load every face for the sample text, then prove each family measures differently from a family
 * that does not exist. Throws rather than returning a flag: a specimen that silently fell back is
 * worse than no specimen, because it looks like an answer.
 */
export async function assertFacesLoaded(page, families, probeText = "0123456789") {
  await page.evaluate(async ([names, text]) => {
    await Promise.all(names.flatMap((family) => [400, 450, 500, 600, 700].map((weight) =>
      document.fonts.load(`${weight} 40px '${family}'`, text).catch(() => {}))));
    await document.fonts.ready;
  }, [families, probeText]);

  const report = await page.evaluate(([names, text]) => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;left:-9999px;display:inline-block;white-space:nowrap";
    probe.textContent = text;
    document.body.appendChild(probe);
    // setProperty with "important", because a page under a font override sets its own !important
    // family and would otherwise win over the probe's inline style.
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
