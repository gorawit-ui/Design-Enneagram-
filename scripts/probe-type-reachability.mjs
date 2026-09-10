// For every Enneagram core and each of its two wings: if a respondent answers every item as
// favourably to that type as the item set allows, does the scorer return that type?
//
// This is the question the fixtures cannot answer. Every fixture in app/lib/assessment-fixtures.ts
// was searched for -- an answer vector reverse-engineered until it hit a target -- which proves the
// scorer is self-consistent and says nothing about whether a given type is expressible at all.
//
// Nothing here is hand-picked, deliberately. An earlier version of this probe had me choosing the
// option a type "would" pick, which made the result an argument about my reading of ten Thai
// sentences rather than a measurement. Here every answer is derived: at each position, take the
// option maximising (core weight x 3) + (wing weight x 1.5), with the MBTI side answered as a
// fixed preference so the Enneagram result is not confounded by an MBTI tie. That is an upper
// bound on how well a type can do -- a real person answers less consistently -- so a type that
// fails HERE cannot be reached by anyone.
//
// Usage: node scripts/probe-type-reachability.mjs [--verbose]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reach-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));
const data = require(path.join(tmp, "assessment-data.js"));

const WINGS = { 1: [9, 2], 2: [1, 3], 3: [2, 4], 4: [3, 5], 5: [4, 6], 6: [5, 7], 7: [6, 8], 8: [7, 9], 9: [8, 1] };
// Answered as INTJ-A throughout: the Enneagram question is the one under test, and letting the
// MBTI side wander would put an ambiguous type in every row for reasons unrelated to the cores.
const MBTI = new Set(["I", "N", "T", "J", "A"]);
const verbose = process.argv.includes("--verbose");
// How strongly the derived answers lean on the wing, relative to the core at 3. Exposed because
// the whole result could otherwise be an artifact of one number I picked: at 1.5 a respondent is
// modelled as caring about their wing half as much as their core, and if the misses below only
// appear at that setting they are about this script rather than about the items. Sweep it.
const WING_PULL = Number((process.argv.find((a) => a.startsWith("--wing-pull=")) ?? "--wing-pull=1.5").split("=")[1]);

function answerAs(core, wing) {
  const answers = [];
  const donations = [];
  for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
    const question = scoring.selectNextQuestion(answers);
    if (!question) break;
    let bestIndex = 0;
    let bestScore = -Infinity;
    question.options.forEach((option, index) => {
      const e = option.weights?.enneagram ?? {};
      const m = option.weights?.mbti ?? {};
      let score = (e[core] ?? 0) * 3 + (e[wing] ?? 0) * WING_PULL;
      for (const [pole, w] of Object.entries(m)) score += (MBTI.has(pole) ? 2 : -1) * w;
      if (score > bestScore) { bestScore = score; bestIndex = index; }
    });
    const chosen = question.options[bestIndex].weights?.enneagram ?? {};
    // A donation: the item offered nothing carrying this core, so the answer went elsewhere.
    if (question.id.startsWith("f-e-") && !(core in chosen)) {
      donations.push(`${question.id}->${Object.keys(chosen).join("/") || "none"}`);
    }
    answers.push({ questionId: question.id, optionIndex: bestIndex });
  }
  return { answers, donations };
}

const rows = [];
for (const core of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  for (const wing of WINGS[core]) {
    const { answers, donations } = answerAs(core, wing);
    const result = scoring.scoreAssessment(answers);
    const ranked = Object.entries(result.scores.enneagram)
      .map(([c, v]) => ({ c: +c, v })).sort((a, b) => b.v - a.v);
    rows.push({
      core, wing, donations,
      gotCore: result.enneagram.core, coreConfidence: result.enneagram.confidence,
      gotWing: result.wing, wingStatus: result.wingStatus,
      gotMbti: result.mbti.type, margin: ranked.length > 1 ? ranked[0].v - ranked[1].v : null,
      runnerUp: ranked[1]?.c ?? null,
      ok: result.enneagram.core === core && result.wing === wing,
    });
  }
}

console.log(`wing pull ${WING_PULL} against a core weight of 3\n`);
console.log("target   got core            got wing        margin  runner-up   donations");
for (const r of rows) {
  const core = `${r.gotCore ?? "null"} (${r.coreConfidence})`;
  const wing = `${r.gotWing ?? "null"} (${r.wingStatus})`;
  console.log(` ${String(r.core) + "w" + r.wing}    ${core.padEnd(18)} ${wing.padEnd(15)} `
    + `${String(r.margin ?? "-").padStart(5)}   ${String(r.runnerUp ?? "-").padStart(6)}      ${r.donations.length}`
    + `   ${r.ok ? "" : "  <-- MISS"}`);
  if (verbose && r.donations.length) console.log(`          ${r.donations.join("  ")}`);
}

const misses = rows.filter((r) => !r.ok);
const coreMisses = rows.filter((r) => r.gotCore !== r.core);
console.log(`\n${rows.length - misses.length}/${rows.length} core+wing pairs reachable`
  + `   ·   core alone: ${rows.length - coreMisses.length}/${rows.length}`);
const tightest = [...rows].sort((a, b) => (a.margin ?? 99) - (b.margin ?? 99)).slice(0, 3);
console.log(`tightest margins: ${tightest.map((r) => `${r.core}w${r.wing} by ${r.margin} over ${r.runnerUp}`).join("  ·  ")}`);
const donationCount = {};
for (const r of rows) donationCount[r.core] = Math.max(donationCount[r.core] ?? 0, r.donations.length);
console.log(`forced donations per core (of 10 foundation items): `
  + Object.entries(donationCount).map(([c, n]) => `${c}:${n}`).join("  "));
if (misses.length) {
  console.log("\nA miss means: even answering as favourably to that type as the items allow, the");
  console.log("scorer returns something else. That is a finding about the item set, not the scorer.");
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(misses.length ? 1 : 0);
