// What the last adaptive slot is spent on, and what is still unresolved when the session ends.
//
// The 24-item decision fixed the count, so the last question is a fixed budget that gets spent
// whether or not anything still needs deciding. This measures where it goes and how often the
// session finishes with an unresolved core or wing, which is the before/after for reserving it as
// a tie-break.
//
// Simulated respondents answer at random, so the ABSOLUTE ambiguity rate here is not the rate a
// real team would see -- random answering is the least coherent respondent possible. The
// comparison between two versions of the selector on the same seeded answers is the measurement
// this script exists for.
//
// Usage: node scripts/measure-tiebreak.mjs [sessions]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tiebreak-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));
const data = require(path.join(tmp, "assessment-data.js"));

const SESSIONS = Number(process.argv[2] ?? 3000);
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const lastSlot = new Map();
const counts = { coreAmbiguous: 0, wingAmbiguous: 0, wingUnavailable: 0, mbtiAmbiguous: 0, bothClear: 0 };
const marginHistogram = new Map();

for (let session = 0; session < SESSIONS; session += 1) {
  // One seed per session, so the same answer choices are offered to whichever selector is running.
  const random = mulberry32(1000 + session);
  const answers = [];
  let finalQuestion = null;
  for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
    const question = scoring.selectNextQuestion(answers);
    if (!question) break;
    if (position === data.MAX_QUESTIONS - 1) finalQuestion = question.id;
    answers.push({ questionId: question.id, optionIndex: Math.floor(random() * question.options.length) });
  }
  const result = scoring.scoreAssessment(answers);
  const kind = finalQuestion === null ? "(none)"
    : /^c-core-/.test(finalQuestion) ? "core challenge"
      : /^c-wing-/.test(finalQuestion) ? "wing challenge"
        : /^c-(at|at2)$/.test(finalQuestion) ? "A/T" : "MBTI axis";
  lastSlot.set(kind, (lastSlot.get(kind) ?? 0) + 1);

  if (result.enneagram.confidence === "ambiguous") counts.coreAmbiguous += 1;
  if (result.wingStatus === "ambiguous") counts.wingAmbiguous += 1;
  if (result.wingStatus === "unavailable") counts.wingUnavailable += 1;
  if (result.mbti.type === null) counts.mbtiAmbiguous += 1;
  if (result.enneagram.confidence !== "ambiguous" && result.wingStatus === "valid") counts.bothClear += 1;

  const margin = result.enneagram.top.score - result.enneagram.runnerUp.score;
  marginHistogram.set(margin, (marginHistogram.get(margin) ?? 0) + 1);
}

const percent = (value) => `${((value / SESSIONS) * 100).toFixed(1)}%`;
console.log(`${SESSIONS} simulated respondents\n`);
console.log("what the LAST question (Q24) was spent on:");
for (const [kind, count] of [...lastSlot].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${percent(count).padStart(6)}  ${kind}`);
}
console.log("\nhow sessions ended:");
console.log(`  ${percent(counts.coreAmbiguous).padStart(6)}  core ambiguous — no ลักษณ์ named`);
console.log(`  ${percent(counts.wingAmbiguous).padStart(6)}  wing ambiguous`);
console.log(`  ${percent(counts.wingUnavailable).padStart(6)}  wing unavailable (no core to hang it on)`);
console.log(`  ${percent(counts.mbtiAmbiguous).padStart(6)}  MBTI ambiguous`);
console.log(`  ${percent(counts.bothClear).padStart(6)}  core AND wing both resolved`);

console.log("\nmargin between the top core and its runner-up:");
for (const [margin, count] of [...marginHistogram].sort((a, b) => a[0] - b[0]).slice(0, 9)) {
  console.log(`  ${String(margin).padStart(3)}  ${percent(count).padStart(6)}  ${"#".repeat(Math.round((count / SESSIONS) * 200))}`);
}
