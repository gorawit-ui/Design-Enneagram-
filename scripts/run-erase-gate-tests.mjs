// Gate — the delete route actually deletes, executed against the running app.
//
// The playbook promises a "delete/export route" (ONSITE_ACTIVITY_50_MIN.md, minutes 47-50). The
// deleting half is three separate stores — a localStorage preference, the service worker's cache,
// and the worker's own registration — and each is named by a string that can drift out of the
// button without anything failing. A cache-name change alone would leave the button clearing
// nothing while still reporting success.
//
// So the gate MAKES the data first and asserts it was there before deleting it. A delete test that
// runs against an empty browser passes forever.
//
// Usage:
//   npm run build && npm run sw && npm run start -- --port 3000 &
//   npm run gate:erase

import assert from "node:assert/strict";
import { loadChromium } from "./lib/google-fonts.mjs";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";

const inventory = async () => ({
  keys: Object.keys(window.localStorage).filter((key) => key.startsWith("tdfb-")).length,
  caches: (await caches.keys()).filter((name) => name.startsWith("tdfb-pq-")).length,
  workers: (await navigator.serviceWorker.getRegistrations()).length,
});

const chromium = await loadChromium();
const browser = await chromium.launch();
const failures = [];

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Bounded rather than awaited outright: an unbounded wait on serviceWorker.ready turns "the
  // worker did not register" into a hang, which is how this suite once burned ten minutes and
  // printed nothing.
  const active = await page.evaluate(async () => {
    const ready = navigator.serviceWorker.ready.then((registration) => Boolean(registration.active));
    const giveUp = new Promise((resolve) => setTimeout(() => resolve(false), 15000));
    return Promise.race([ready, giveUp]).catch(() => false);
  });
  if (!active) failures.push("the service worker never became active, so there was no cache to clear");

  // Large print writes the only preference this app stores.
  await page.click(".text-size-toggle");
  await page.waitForTimeout(1200);

  const before = await page.evaluate(inventory);
  for (const [name, count] of Object.entries(before)) {
    if (count === 0) failures.push(`nothing to delete in ${name} — this gate would prove nothing`);
  }

  await page.click(".data-control summary");
  await page.click(".data-control-body .secondary-button");
  await page.waitForSelector(".data-control-done, .data-control-error", { timeout: 15000 });
  const message = await page.evaluate(() =>
    document.querySelector(".data-control-done, .data-control-error")?.textContent ?? "");
  const after = await page.evaluate(inventory);

  if (after.keys !== 0) failures.push(`a stored setting survived (${after.keys})`);
  if (after.caches !== 0) failures.push(`a cache survived (${after.caches})`);
  if (after.workers !== 0) failures.push(`the service worker stayed registered (${after.workers})`);
  // Reporting success while leaving data behind is the worst outcome of the three, so the message
  // is checked against the reality rather than trusted.
  const claimedSuccess = Boolean(await page.$(".data-control-done"));
  const reallyClean = after.keys === 0 && after.caches === 0 && after.workers === 0;
  if (claimedSuccess !== reallyClean) failures.push("the message and the actual state disagree");

  console.log(`before: ${JSON.stringify(before)}`);
  console.log(`after:  ${JSON.stringify(after)}`);
  console.log(`page said: ${message}`);
  await context.close();
} finally {
  await browser.close().catch(() => {});
}

if (failures.length > 0) {
  console.error(`\n${failures.length} failing checks:`);
  for (const failure of failures) console.error(`  - ${failure}`);
}
assert.equal(failures.length, 0, `${failures.length} erase checks failed`);
console.log("\nerase gate: PASS");
