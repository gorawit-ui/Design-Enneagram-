// How much does the question set actually differ between two people?
//
// The 24-item decision (docs/QUESTION_COUNT_DECISION.md) fixed the COUNT, not the CONTENT. Whether
// that difference is real or nominal is a measurement, and this is the measurement: simulate many
// respondents, and count how many distinct question sequences come out.
//
// Usage: node scripts/measure-adaptive-variation.mjs [sessions]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "adaptive-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));
const data = require(path.join(tmp, "assessment-data.js"));

const SESSIONS = Number(process.argv[2] ?? 2000);
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const random = mulberry32(20260910);

const foundationSequences = new Set();
const adaptiveSequences = new Map();
const perSlot = Array.from({ length: data.MAX_QUESTIONS }, () => new Set());
let totalAdaptive = 0;

for (let session = 0; session < SESSIONS; session += 1) {
  const answers = [];
  const ids = [];
  for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
    const question = scoring.selectNextQuestion(answers);
    if (!question) break;
    ids.push(question.id);
    perSlot[position].add(question.id);
    answers.push({ questionId: question.id, optionIndex: Math.floor(random() * question.options.length) });
  }
  const foundationCount = data.FOUNDATION_QUESTIONS.length;
  foundationSequences.add(ids.slice(0, foundationCount).join(","));
  const adaptive = ids.slice(foundationCount).join(" ");
  adaptiveSequences.set(adaptive, (adaptiveSequences.get(adaptive) ?? 0) + 1);
  totalAdaptive += ids.length - foundationCount;
}

const foundationCount = data.FOUNDATION_QUESTIONS.length;
console.log(`${SESSIONS} simulated respondents\n`);
console.log(`questions 1-${foundationCount}   ${foundationSequences.size === 1 ? "IDENTICAL for everyone" : `${foundationSequences.size} different sequences`}`);
console.log(`questions ${foundationCount + 1}-${data.MAX_QUESTIONS}  ${adaptiveSequences.size} different sequences across ${SESSIONS} respondents`);
console.log(`             ${(totalAdaptive / SESSIONS).toFixed(1)} adaptive questions each, drawn from a pool of ${
  new Set([...perSlot.slice(foundationCount)].flatMap((slot) => [...slot])).size} possible items\n`);

console.log("what can appear in each adaptive slot:");
for (let position = foundationCount; position < data.MAX_QUESTIONS; position += 1) {
  const options = [...perSlot[position]].sort();
  console.log(`  Q${position + 1}  ${options.length} possible  ${options.slice(0, 6).join(" ")}${options.length > 6 ? ` … +${options.length - 6}` : ""}`);
}

const ranked = [...adaptiveSequences.entries()].sort((a, b) => b[1] - a[1]);
console.log(`\nmost common adaptive blocks:`);
for (const [sequence, count] of ranked.slice(0, 5)) {
  console.log(`  ${(count / SESSIONS * 100).toFixed(1).padStart(5)}%  ${sequence}`);
}
console.log(`\n  the most common block is ${(ranked[0][1] / SESSIONS * 100).toFixed(1)}% of respondents;`
  + ` ${(ranked.filter(([, count]) => count === 1).length / SESSIONS * 100).toFixed(1)}% of respondents got a block nobody else got`);

// One respondent, one changed answer. This is the property the whole design rests on and the
// reason selection is recomputed per question rather than picked once at question 18: change
// something early, and the questions that follow change with it.
console.log(`\n${"-".repeat(78)}\nchanging one answer and re-running:\n`);
const base = [];
for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
  const question = scoring.selectNextQuestion(base);
  if (!question) break;
  base.push({ questionId: question.id, optionIndex: 0 });
}
const describe = (answers) => answers.slice(data.FOUNDATION_QUESTIONS.length).map((a) => a.questionId).join(" ");
const rebuild = (choices) => {
  const built = [];
  for (const optionIndex of choices) {
    const question = scoring.selectNextQuestion(built);
    if (!question) break;
    built.push({ questionId: question.id, optionIndex: Math.min(optionIndex, question.options.length - 1) });
  }
  return built;
};
const baseChoices = base.map((a) => a.optionIndex);
const baseResult = scoring.scoreAssessment(base);
console.log(`  original   core ${baseResult.enneagram.core} · ${describe(base)}`);
for (const changeAt of [3, 11, 14]) {
  const choices = [...baseChoices];
  choices[changeAt] = 2;
  const changed = rebuild(choices);
  const result = scoring.scoreAssessment(changed);
  const different = describe(changed) !== describe(base);
  console.log(`  change Q${changeAt + 1}  core ${result.enneagram.core} · ${describe(changed)}`
    + `   ${different ? "<- different questions" : "(same questions)"}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
