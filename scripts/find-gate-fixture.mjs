// Re-derive the answer vector the responsive gate walks: a whole session that scores Core 2 x INTJ-A
// with MBTI named and the Enneagram core not ambiguous, so the approved INTJ character is on screen.
//
// The gate's array goes stale whenever selection or the item bank changes; this prints a fresh one.
// It answers as a person of that type would (their own marks, the core counted double against the
// wing) and, if that is not enough, perturbs one answer at a time, deterministically.
//
// Usage: node scripts/find-gate-fixture.mjs  -> paste the printed array into run-responsive-gate-tests.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "gate-fixture-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out, esModuleInterop: true, skipLibCheck: true },
).emit();
const { selectNextQuestion, scoreAssessment } = require(path.join(out, "scoring.js"));

const TARGET = { core: 2, wing: 3, poles: ["I", "N", "T", "J", "A"], type: "INTJ-A" };

function ideal(question) {
  let best = 0, bestValue = -1;
  question.options.forEach((option, index) => {
    const e = option.weights.enneagram, m = option.weights.mbti;
    const value = e ? (e[TARGET.core] ?? 0) * 2 + (e[TARGET.wing] ?? 0) : TARGET.poles.reduce((s, p) => s + (m?.[p] ?? 0), 0);
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
}

// Walk a session. `override[i]` replaces the answer at position i; everything else answers ideally.
function walk(override = {}) {
  const answers = [];
  for (;;) {
    const question = selectNextQuestion(answers);
    if (!question) break;
    const i = answers.length;
    answers.push({ questionId: question.id, optionIndex: override[i] ?? ideal(question) });
  }
  return answers;
}

const good = (answers) => {
  const r = scoreAssessment(answers);
  return r.mbti.type === TARGET.type && r.enneagram.core === TARGET.core && r.enneagram.confidence !== "ambiguous";
};

let found = walk();
if (!good(found)) {
  found = null;
  outer: for (let i = 0; i < 24; i++) for (let o = 0; o < 9; o++) {
    const answers = walk({ [i]: o });
    if (good(answers)) { found = answers; break outer; }
  }
}
if (!found) { console.error("no session found — widen the search"); process.exit(1); }
const r = scoreAssessment(found);
console.log(`// ${found.length} answers -> ${r.mbti.type} x core ${r.enneagram.core} (${r.enneagram.confidence}), wing ${r.wingStatus}`);
console.log(`const ANSWERS = [${found.map((a) => a.optionIndex).join(", ")}];`);
