// Gate — the app survives losing the network, executed against a server this script kills.
//
// docs/ONSITE_ACTIVITY_50_MIN.md requires a paper/offline contingency and there was none: if the
// venue's wifi drops mid-activity the room stops. The claim the service worker makes is specific —
// a participant with the page open can finish, and one who reloads still gets the app — and
// neither is testable by reading the worker.
//
// IT KILLS THE SERVER RATHER THAN EMULATING OFFLINE, and that is not belt-and-braces. The first
// version of this gate called context.setOffline(true) and passed every check; probed, an uncached
// URL still returned a real 404 from the server, because Chromium's network emulation does not
// apply to loopback. The gate was vacuous and looked green. Stopping the origin is the only
// unambiguous way to prove a page is running without it.
//
// Usage:
//   npm run build && npm run sw && npm run gate:offline

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { loadChromium } from "./lib/google-fonts.mjs";

const PORT = Number(process.env.OFFLINE_GATE_PORT ?? 3177);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ANSWERS = [3, 1, 0, 1, 2, 1, 2, 1, 1, 1, 3, 0, 3, 0, 0, 0, 0, 1, 3, 0, 1, 3, 1, 1];

// Its own server on its own port, because the test has to end it. Detached so the whole process
// group can be killed: `next start` spawns a child, and killing only the npm wrapper leaves the
// server listening and the gate testing nothing.
let server = null;
async function startServer() {
  server = spawn("npm", ["run", "start", "--", "--port", String(PORT)], { stdio: "ignore", detached: true });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch { /* not up yet */ }
  }
  throw new Error(`the server did not come up on ${PORT}`);
}
function stopServer() {
  if (!server) return;
  try { process.kill(-server.pid, "SIGKILL"); } catch { /* already gone */ }
  server = null;
}
async function serverIsDown() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await fetch(BASE_URL, { signal: AbortSignal.timeout(1000) });
    } catch {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function completeSession(page) {
  await page.click(".hero-copy .primary-button");
  await page.waitForSelector(".profile-card");
  const inputs = page.locator(".profile-card input:not([type=checkbox])");
  await inputs.nth(0).fill("Offline");
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
  await page.waitForSelector(".result-wrap", { timeout: 20000 });
}

const chromium = await loadChromium();
await startServer();
const browser = await chromium.launch();
const failures = [];
const report = [];

try {
  // Both contexts load and register the worker while the server is up, then the server dies once
  // and both are tested against a truly absent origin.
  const contexts = [];
  for (const label of ["mid-session", "reload"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    const registered = await page.evaluate(async () =>
      Boolean((await navigator.serviceWorker.ready.catch(() => null))?.active));
    // The worker precaches on install; cutting the origin before it finishes would test the race,
    // not the feature.
    await page.waitForTimeout(2000);
    contexts.push({ label, context, page, registered });
    if (!registered) failures.push(`${label}: the service worker never became active`);
  }

  stopServer();
  const down = await serverIsDown();
  // Without this the whole gate is theatre: the previous version emulated offline, the emulation
  // silently did nothing on loopback, and every check passed against a live server.
  assert.ok(down, "the server was still answering after it was killed — this gate would prove nothing");

  {
    const { page } = contexts[0];
    const reachable = await page.evaluate(async () => {
      try { await fetch(`/probe-${Math.random()}`, { cache: "no-store" }); return true; } catch { return false; }
    });
    if (reachable) failures.push("the origin was still reachable from the page");

    let completed = true;
    try {
      await completeSession(page);
    } catch {
      completed = false;
    }
    // The character asset is deliberately NOT precached — twelve files, 12MB, one of which is ever
    // shown — so offline it fails and the result view falls back to the drawn character. What must
    // never happen is a broken image icon, which reads as "the app is broken" rather than "the wifi
    // is gone". The fallback comes from an onError handler, so let it fire before judging.
    await page.waitForTimeout(1500);
    const character = await page.evaluate(() => {
      const img = document.querySelector(".result-character-image");
      const fallback = document.querySelector(".character-fallback");
      return {
        imageLoaded: Boolean(img && img.complete && img.naturalWidth > 0),
        brokenImage: Boolean(img && img.complete && img.naturalWidth === 0),
        fallbackShown: Boolean(fallback && fallback.getBoundingClientRect().width > 0),
      };
    });
    report.push({ case: "wifi drops mid-session", originReachable: reachable, completed, character });
    if (!completed) failures.push("a session in progress could not be finished offline");
    if (!character.imageLoaded && !character.fallbackShown) {
      failures.push("the result page showed neither the character nor its fallback");
    }
    if (character.brokenImage) failures.push("the result page showed a broken image");
  }

  {
    const { page } = contexts[1];
    let reloaded = true;
    try {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForSelector(".hero-copy .primary-button", { timeout: 10000 });
    } catch {
      reloaded = false;
    }
    const styled = reloaded ? await page.evaluate(() =>
      getComputedStyle(document.querySelector(".hero-copy .primary-button")).backgroundColor) : "";
    report.push({ case: "reload with no origin", reloaded, styled });
    if (!reloaded) failures.push("the app did not load from cache after the origin went away");
    // An unstyled page "loads" and is unusable, which is worse than failing: it looks like the app
    // is broken rather than the network.
    if (reloaded && (styled === "rgba(0, 0, 0, 0)" || styled === "")) {
      failures.push("the cached page came back unstyled");
    }
  }
} finally {
  await browser.close();
  stopServer();
}

for (const row of report) console.log(JSON.stringify(row));
if (failures.length > 0) {
  console.error(`\n${failures.length} failing checks:`);
  for (const failure of failures) console.error(`  - ${failure}`);
}
assert.equal(failures.length, 0, `${failures.length} offline checks failed`);
console.log("\noffline gate: PASS");
