// When a respondent is not a perfect example of their core, where do they land?
//
// Written after a real miss: someone who knows herself as 8w9 came out 3w2. The reachability gate
// already proves a PERFECT 8 gets 8 — it answers every item as favourably to 8 as the options
// allow. Nobody answers like that. This measures the realistic case: a respondent who is mostly
// their core and sometimes picks something else, which is every actual person.
//
// For each core it simulates respondents who choose their core's best option `consistency` of the
// time and something else otherwise, then records the core they actually scored. The diagonal is
// how often the instrument recovers the truth; the off-diagonal says which cores it confuses.
//
// Usage: node scripts/measure-core-confusion.mjs [consistency] [sessions]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "confuse-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));
const data = require(path.join(tmp, "assessment-data.js"));

const CONSISTENCY = Number(process.argv[2] ?? 0.75);
const SESSIONS = Number(process.argv[3] ?? 600);
const cores = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** The option index that gives this core the most, or null when the item has none for it. */
function bestOptionFor(question, core) {
  let best = null;
  let bestValue = 0;
  question.options.forEach((option, index) => {
    const value = option.weights?.enneagram?.[core] ?? 0;
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
}

const matrix = Object.fromEntries(cores.map((core) => [core, { landed: {}, ambiguous: 0 }]));

for (const truth of cores) {
  const random = mulberry32(9000 + truth);
  for (let session = 0; session < SESSIONS; session += 1) {
    const answers = [];
    for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
      const question = scoring.selectNextQuestion(answers);
      if (!question) break;
      const ideal = bestOptionFor(question, truth);
      const consistent = ideal !== null && random() < CONSISTENCY;
      const choice = consistent ? ideal : Math.floor(random() * question.options.length);
      answers.push({ questionId: question.id, optionIndex: choice });
    }
    const result = scoring.scoreAssessment(answers);
    if (result.enneagram.core === null) matrix[truth].ambiguous += 1;
    else matrix[truth].landed[result.enneagram.core] = (matrix[truth].landed[result.enneagram.core] ?? 0) + 1;
  }
}

const pct = (value) => `${Math.round((value / SESSIONS) * 100)}`.padStart(3);
console.log(`${SESSIONS} respondents per core, ${Math.round(CONSISTENCY * 100)}% consistent with their own core\n`);
console.log(`truth │ ${cores.map((c) => ` ${c} `).join(" ")} │ none │ recovered`);
console.log(`──────┼${"─".repeat(cores.length * 4)}┼──────┼──────────`);
for (const truth of cores) {
  const row = cores.map((core) => {
    const value = matrix[truth].landed[core] ?? 0;
    const cell = value === 0 ? "  ." : pct(value);
    return core === truth ? `\x1b[1m${cell}\x1b[0m` : cell;
  }).join(" ");
  const recovered = Math.round(((matrix[truth].landed[truth] ?? 0) / SESSIONS) * 100);
  console.log(`  ${truth}   │ ${row} │ ${pct(matrix[truth].ambiguous)}  │ ${String(recovered).padStart(3)}%`);
}

console.log(`\nworst recovery:`);
const ranked = cores
  .map((core) => ({ core, recovered: (matrix[core].landed[core] ?? 0) / SESSIONS }))
  .sort((a, b) => a.recovered - b.recovered);
for (const row of ranked.slice(0, 4)) {
  const confusions = cores
    .filter((core) => core !== row.core)
    .map((core) => ({ core, share: (matrix[row.core].landed[core] ?? 0) / SESSIONS }))
    .sort((a, b) => b.share - a.share)
    .filter((entry) => entry.share > 0.05)
    .slice(0, 3);
  console.log(`  core ${row.core}: ${Math.round(row.recovered * 100)}% recovered`
    + (confusions.length ? ` · mistaken for ${confusions.map((c) => `${c.core} (${Math.round(c.share * 100)}%)`).join(", ")}` : ""));
}
