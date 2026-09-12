// Two weaknesses that can be found without anyone's answers.
//
// A respondent reported a result two centres away from the type she knows herself as, and her
// answers are not recoverable — she sent a screenshot and a PDF from before the code was printed
// into it. So this measures the instrument itself rather than her session.
//
// 1. SEPARABILITY. For each pair of cores, how many of the ten foundation items would the two
//    answer differently? An item whose best option is the same for both records them identically
//    and carries no information about which of the two a respondent is. A pair separated by only
//    two or three items is decided by those items alone, which puts the whole weight of the
//    distinction on their wording.
//
// 2. MBTI AXIS RESOLUTION. The reported result had an unresolved T/F axis, shown as
//    "ENTJ-T / ENFJ-T". This measures how often each axis fails to resolve across simulated
//    respondents, so "T/F is the weak one" is a number rather than an impression.
//
// Usage: npm run items:discrimination

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "disc-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));
const data = require(path.join(tmp, "assessment-data.js"));

const cores = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const foundation = data.FOUNDATION_QUESTIONS.filter((q) => q.id.startsWith("f-e-"));

const bestFor = (question, core) => {
  let best = null;
  let bestValue = 0;
  question.options.forEach((option, index) => {
    const value = option.weights?.enneagram?.[core] ?? 0;
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
};

// --- 1. separability -----------------------------------------------------------------------------
const separating = {};
for (const a of cores) {
  for (const b of cores) {
    if (a >= b) continue;
    let count = 0;
    for (const question of foundation) {
      const optionA = bestFor(question, a);
      const optionB = bestFor(question, b);
      // A pair is separated by an item when each has an option and they are different ones. An
      // item that offers neither of them anything separates nothing.
      if (optionA !== null && optionB !== null && optionA !== optionB) count += 1;
      else if ((optionA === null) !== (optionB === null)) count += 1;
    }
    separating[`${a}-${b}`] = count;
  }
}

const pad = (value, width) => String(value).padStart(width);
console.log(`How many of the ${foundation.length} foundation items separate each pair of cores\n`);
console.log(`     ${cores.map((c) => pad(c, 3)).join("")}`);
for (const a of cores) {
  const row = cores.map((b) => {
    if (a === b) return "  ·";
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    return pad(separating[key], 3);
  }).join("");
  console.log(`  ${a}  ${row}`);
}

const ranked = Object.entries(separating).sort((a, b) => a[1] - b[1]);
console.log(`\nweakest pairs (fewest items deciding them):`);
for (const [pair, count] of ranked.slice(0, 6)) {
  console.log(`  ${pair.replace("-", " vs ")}: ${count} of ${foundation.length} items`);
}
const values = Object.values(separating);
const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
console.log(`  (median ${values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]}, mean ${mean.toFixed(1)})`);

// --- 2. which MBTI axis fails to resolve ----------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const SESSIONS = Number(process.argv[2] ?? 2000);
const random = mulberry32(4242);
const unresolved = { IE: 0, SN: 0, TF: 0, JP: 0, AT: 0 };
let anyUnresolved = 0;
for (let session = 0; session < SESSIONS; session += 1) {
  const answers = [];
  for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
    const question = scoring.selectNextQuestion(answers);
    if (!question) break;
    answers.push({ questionId: question.id, optionIndex: Math.floor(random() * question.options.length) });
  }
  const result = scoring.scoreAssessment(answers);
  let any = false;
  for (const [axis, dimension] of Object.entries(result.dimensions)) {
    // The scorer's own definition of an unusable axis.
    if (dimension.margin < 2 || dimension.evidence < 2) { unresolved[axis] += 1; any = true; }
  }
  if (any) anyUnresolved += 1;
}
console.log(`\nMBTI axes that fail to resolve, over ${SESSIONS} simulated respondents:`);
for (const [axis, count] of Object.entries(unresolved).sort((a, b) => b[1] - a[1])) {
  const share = (count / SESSIONS) * 100;
  console.log(`  ${axis}  ${pad(share.toFixed(1), 5)}%  ${"#".repeat(Math.round(share / 2))}`);
}
console.log(`  at least one axis unresolved: ${((anyUnresolved / SESSIONS) * 100).toFixed(1)}%`);
console.log(`\n  (random answering is the least coherent respondent possible, so these rates are an`);
console.log(`   upper bound. The RANKING between axes is the part that carries over.)`);
