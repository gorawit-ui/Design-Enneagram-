/**
 * Replay a finished session from its one-line code.
 *
 * The code carries option indexes, not question ids, because `selectNextQuestion` is a pure
 * function of the answers so far -- feeding the indexes back through it reproduces which items
 * were asked, in what order. That is the whole reason the export is a code and not a screenshot:
 * a picture of a verdict cannot be checked, a replay can.
 *
 * It also re-scores the answers with the CURRENT code and compares against the verdict stored in
 * the code. If those disagree, either the bank moved or the scoring changed, and the difference is
 * the thing worth looking at. A silent disagreement is the failure mode this guards against.
 *
 *   npm run replay -- 'TDFB1|b=...|a=...'
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "replay-"));
ts.createProgram(
  ["assessment-data.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out,
    esModuleInterop: true, skipLibCheck: true },
).emit();
const S = require(path.join(out, "scoring.js"));
const D = require(path.join(out, "assessment-data.js"));

const code = process.argv[2];
if (!code || !code.startsWith("TDFB1|")) {
  console.error("usage: npm run replay -- 'TDFB1|b=...|n=24|a=...'");
  process.exit(1);
}
const field = Object.fromEntries(
  code.trim().split("|").slice(1).map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1)]),
);

const sameBank = field.b === D.ITEM_BANK_VERSION;
console.log(`bank in code ${field.b}   bank now ${D.ITEM_BANK_VERSION}   ${sameBank ? "match" : "MISMATCH — the replay below indexes into DIFFERENT items than the respondent saw"}`);

// Digits only: a pasted code sometimes picks up a stray character from the chat client.
const digits = field.a.replace(/[^0-9]/g, "").split("").map(Number);
const seconds = (field.d ?? "").replace(/[^0-9,]/g, "").split(",").filter(Boolean).map(Number);

const answers = [];
for (const optionIndex of digits) {
  const question = S.selectNextQuestion(answers);
  if (!question) break;
  answers.push({ questionId: question.id, optionIndex });
}
const result = S.scoreAssessment(answers);

const byId = Object.fromEntries(
  [...D.FOUNDATION_QUESTIONS, ...D.DIMENSION_CHALLENGES, ...D.CORE_CHALLENGES, ...D.WING_CHALLENGES]
    .map((q) => [q.id, q]),
);

console.log("\n  #   sec  item          answer");
answers.forEach((answer, i) => {
  const question = byId[answer.questionId];
  const option = question.options[answer.optionIndex];
  const weights = option.weights?.enneagram ?? option.weights?.mbti ?? {};
  const shown = Object.entries(weights).map(([k, v]) => `${k}:${v}`).join(" ");
  const s = seconds[i];
  const mark = s === undefined ? "" : s >= 45 ? "  <-- long" : s <= 15 ? "  (quick)" : "";
  console.log(` ${String(i + 1).padStart(2)}  ${String(s ?? "-").padStart(4)}  ${answer.questionId.padEnd(12)} ${String.fromCharCode(65 + answer.optionIndex)}. ${option.text.padEnd(32)} ${shown.padEnd(12)}${mark}`);
});

const wing = result.wingStatus === "valid" ? `w${result.wing}` : "";
const replayed = `${result.enneagram.core ?? "x"}${wing}`;
console.log("\n--- scored now ---");
console.log(`enneagram  ${replayed}  (${result.enneagram.confidence}, wing ${result.wingStatus})`);
console.log(`mbti       ${result.mbti.type ?? "x"}  (${result.mbti.confidence})${result.mbti.candidate ? `  candidate ${result.mbti.candidate}` : ""}`);
console.log(`in code    e=${field.e}  m=${field.m}  c=${field.c}`);
if (sameBank && (replayed !== field.e || (result.mbti.type ?? "x") !== field.m)) {
  console.log("*** the replay DISAGREES with the stored verdict — scoring changed since this session ***");
}
console.log(`\nenneagram scores  ${JSON.stringify(result.scores.enneagram)}`);
console.log(`mbti scores       ${JSON.stringify(result.scores.mbti)}`);
console.log(`dimensions        ${JSON.stringify(result.dimensions)}`);

if (seconds.length > 0) {
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const sorted = [...seconds].sort((a, b) => a - b);
  const foundation = seconds.slice(0, 18);
  const adaptive = seconds.slice(18);
  console.log(`\ntotal ${sum(seconds)}s = ${(sum(seconds) / 60).toFixed(1)} min   mean ${(sum(seconds) / seconds.length).toFixed(1)}s   median ${sorted[Math.floor(sorted.length / 2)]}s`);
  console.log(`Q1-18 mean ${(sum(foundation) / foundation.length).toFixed(1)}s   Q19-24 mean ${(sum(adaptive) / adaptive.length).toFixed(1)}s`);
  // The progress line promises "about N minutes left" at 24s per question. A respondent whose real
  // pace is slower than that is told, all the way through, that they are running late.
  console.log(`app tells them  24s/question = ${(24 * 24 / 60).toFixed(1)} min total`);
}
