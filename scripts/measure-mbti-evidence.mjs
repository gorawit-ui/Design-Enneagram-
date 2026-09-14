// How often the MBTI half of the result survives a normal person.
//
// Session wvg9a3 finished with `m=x` -- no type at all -- and the replay shows it was never
// reachable: three of five axes ended at margin 1 with the respondent having answered both of
// their items honestly. Each axis carries exactly two foundation items, an end option is worth 2
// and a middle rung 1, and an axis is unclear below margin 2. So an axis survives only when BOTH
// its items lean the same way. Lean opposite on two axes and the whole type is null.
//
// That is not inconsistency on the respondent's part. f-tf-1 asks how you choose between two
// good options; f-tf-2 asks what you reach for when a conversation disagrees. Deciding by criteria
// and listening first in a conflict is one ordinary person, and this instrument scores it as
// no answer.
//
// Simulated respondents here carry a true MBTI type and answer their pole `consistency` of the
// time, with the residual spread over the other options. The number to read is the naming rate:
// what share of coherent people are handed a type at all.
//
// Usage: node scripts/measure-mbti-evidence.mjs [consistency] [sessions]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mbti-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));
const data = require(path.join(tmp, "assessment-data.js"));

const CONSISTENCY = Number(process.argv[2] ?? 0.75);
const SESSIONS = Number(process.argv[3] ?? 2000);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const AXES = [["I", "E"], ["S", "N"], ["T", "F"], ["J", "P"], ["A", "Turbulent"]];
const random = mulberry32(31337);

/** The option that gives this person's poles the most, across whichever axis the item measures. */
function idealOption(question, poles) {
  let best = null;
  let bestValue = 0;
  question.options.forEach((option, index) => {
    const m = option.weights?.mbti;
    if (!m) return;
    const value = poles.reduce((sum, pole) => sum + (m[pole] ?? 0), 0);
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
}

let named = 0;
let correct = 0;
const deadAxis = Object.fromEntries(AXES.map(([l]) => [l, 0]));
const unclearCount = new Map();

for (let session = 0; session < SESSIONS; session += 1) {
  const poles = AXES.map(([left, right]) => (random() < 0.5 ? left : right));
  const truth = `${poles.slice(0, 4).join("")}-${poles[4] === "Turbulent" ? "T" : "A"}`;
  const answers = [];
  for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
    const question = scoring.selectNextQuestion(answers);
    if (!question) break;
    const ideal = idealOption(question, poles);
    const choice = ideal !== null && random() < CONSISTENCY
      ? ideal
      : Math.floor(random() * question.options.length);
    answers.push({ questionId: question.id, optionIndex: choice });
  }
  const result = scoring.scoreAssessment(answers);
  if (result.mbti.type) {
    named += 1;
    if (result.mbti.type === truth) correct += 1;
  }
  const unclear = Object.entries(result.dimensions).filter(([, d]) => d.margin < 2 || d.evidence < 2);
  unclearCount.set(unclear.length, (unclearCount.get(unclear.length) ?? 0) + 1);
  for (const [name] of unclear) deadAxis[AXES[["IE", "SN", "TF", "JP", "AT"].indexOf(name)][0]] += 1;
}

const pct = (n) => `${((n / SESSIONS) * 100).toFixed(1)}%`;
console.log(`${SESSIONS} respondents carrying a true MBTI type, ${Math.round(CONSISTENCY * 100)}% consistent\n`);
console.log(`  handed a type at all   ${pct(named)}`);
console.log(`  handed the RIGHT type  ${pct(correct)}`);
console.log(`\n  unclear axes per session`);
for (const count of [...unclearCount.keys()].sort((a, b) => a - b)) {
  console.log(`    ${count}  ${pct(unclearCount.get(count))}`);
}
console.log(`\n  how often each axis is the unclear one`);
for (const [axis, [left]] of AXES.entries()) {
  console.log(`    ${["IE", "SN", "TF", "JP", "AT"][axis]}  ${pct(deadAxis[left])}`);
}
