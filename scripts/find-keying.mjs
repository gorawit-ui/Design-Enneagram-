// Search for the reverse-keying set that best defeats straight-lining, and print it as source.
//
// Why this is searched rather than chosen: every item is authored with its first pole first, so
// option position maps to the same pole throughout, and answering the same position all the way
// down produces an extreme profile that arrives as a *confident* result. Measured on this item set
// with nothing reverse-keyed, a full 24-answer session of nothing but option 1 returns ISTJ-A at
// "clear" confidence, and option 4 returns ENFP-T at "clear".
//
// Reversing the authored option order on some items makes position bias cancel instead of
// accumulate. Which items, though, is not obvious by inspection: the MBTI side has two poles per
// item and balances by picking one reversed item per axis, but each Enneagram item carries four
// different cores plus secondary weights, so a hand-picked set flattens one position and tilts
// another. So it is searched: all 1024 reversal combinations of the ten Enneagram foundation items
// against all sixteen one-per-axis MBTI combinations, scored on how many straight-line positions
// still yield a confident answer.
//
// The objective is that answering the same position throughout produces "ambiguous" on both MBTI
// and Enneagram — a result that says the answers carry no signal, which is the truth about them.
//
// Usage: node scripts/find-keying.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");

// The reversal decisions this script does not make. Challenge items are asked one or two at a time
// rather than in a block, so they cannot be straight-lined into a profile the way the foundation
// can, and their keying is set for consistency rather than derived here.
const FIXED_CHALLENGE_REVERSALS = [
  "c-sn", "c-jp", "c-at",
  "c-core-2", "c-core-4", "c-core-6", "c-core-8",
  "c-wing-1", "c-wing-3", "c-wing-5", "c-wing-7", "c-wing-9",
];
const MBTI_AXES = ["ie", "sn", "tf", "jp"];

function compile(reversedIds) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-find-keying-"));
  const dataPath = path.join(projectRoot, "app/lib/assessment-data.ts");
  const original = fs.readFileSync(dataPath, "utf8");
  const patched = original.replace(
    /const REVERSED_ITEMS: ReadonlySet<string> = new Set\(\[[\s\S]*?\]\);/,
    `const REVERSED_ITEMS: ReadonlySet<string> = new Set(${JSON.stringify(reversedIds)});`,
  );
  if (patched === original) throw new Error("could not find REVERSED_ITEMS to patch");
  const scratch = path.join(temporaryDirectory, "src");
  fs.mkdirSync(scratch, { recursive: true });
  for (const file of ["assessment-data.ts", "character-system.ts", "scoring.ts"]) {
    fs.copyFileSync(path.join(projectRoot, "app/lib", file), path.join(scratch, file));
  }
  fs.writeFileSync(path.join(scratch, "assessment-data.ts"), patched);
  const program = ts.createProgram(
    ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(scratch, f)),
    {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      outDir: path.join(temporaryDirectory, "out"),
      esModuleInterop: true,
      skipLibCheck: true,
      strict: true,
    },
  );
  program.emit();
  const out = path.join(temporaryDirectory, "out");
  const loaded = {
    scoring: require(path.join(out, "scoring.js")),
    data: require(path.join(out, "assessment-data.js")),
  };
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  return loaded;
}

/** How many straight-line positions still yield a confident answer. Zero is the goal. */
function straightLinePenalty({ scoring, data }) {
  let penalty = 0;
  const detail = [];
  for (const position of [0, 1, 2, 3]) {
    const foundation = data.FOUNDATION_QUESTIONS.map((q) => ({ questionId: q.id, optionIndex: position }));
    const adaptive = scoring.selectChallengeQuestions(foundation).map((q) => ({ questionId: q.id, optionIndex: position }));
    const result = scoring.scoreAssessment([...foundation, ...adaptive]);
    // "close" is a partial failure and "clear" a full one: both name a type or core off answers
    // that carry no preference at all.
    const cost = (confidence) => (confidence === "ambiguous" ? 0 : confidence === "close" ? 1 : 3);
    penalty += cost(result.mbti.confidence) + cost(result.enneagram.confidence);
    detail.push(`pos ${position + 1}: ${result.mbti.type ?? "null"}/${result.mbti.confidence} core ${result.enneagram.core ?? "null"}/${result.enneagram.confidence}`);
  }
  return { penalty, detail };
}

// Enumerate: every subset of the ten Enneagram foundation items, times every one-per-axis choice
// for the four MBTI axes. Cache compiles by the reversal set so repeated candidates cost nothing.
const { data: probe } = compile([]);
const enneagramIds = probe.FOUNDATION_QUESTIONS.filter((q) => q.id.startsWith("f-e-")).map((q) => q.id);
const mbtiIds = probe.FOUNDATION_QUESTIONS.filter((q) => !q.id.startsWith("f-e-")).map((q) => q.id);
console.error(`searching ${2 ** enneagramIds.length} Enneagram subsets x ${2 ** MBTI_AXES.length} MBTI choices`);
console.error(`  Enneagram foundation: ${enneagramIds.join(", ")}`);
console.error(`  MBTI foundation:      ${mbtiIds.join(", ")}\n`);

let best = null;
let evaluated = 0;
for (let mbtiMask = 0; mbtiMask < 2 ** MBTI_AXES.length; mbtiMask += 1) {
  // Exactly one of each axis's two items is reversed, which is what makes position bias cancel
  // rather than double on that axis. The mask picks which of the two.
  const mbtiReversed = MBTI_AXES.map((axis, index) => `f-${axis}-${((mbtiMask >> index) & 1) + 1}`);
  for (let enneagramMask = 0; enneagramMask < 2 ** enneagramIds.length; enneagramMask += 1) {
    const enneagramReversed = enneagramIds.filter((_, index) => (enneagramMask >> index) & 1);
    // Half the Enneagram block, give or take one: a set that reverses almost nothing or almost
    // everything reintroduces the pattern it exists to break, whatever it scores.
    if (Math.abs(enneagramReversed.length - enneagramIds.length / 2) > 1) continue;
    const reversed = [...mbtiReversed, ...enneagramReversed, ...FIXED_CHALLENGE_REVERSALS];
    const { penalty, detail } = straightLinePenalty(compile(reversed));
    evaluated += 1;
    if (best === null || penalty < best.penalty) {
      best = { penalty, detail, mbtiReversed, enneagramReversed };
      console.error(`penalty ${penalty}  mbti [${mbtiReversed.join(" ")}]  enneagram [${enneagramReversed.join(" ")}]`);
      if (penalty === 0) break;
    }
  }
  if (best?.penalty === 0) break;
}

console.error(`\nevaluated ${evaluated} candidate set(s); best penalty ${best.penalty}`);
for (const line of best.detail) console.error(`  ${line}`);
console.error("");

process.stdout.write(`const REVERSED_ITEMS: ReadonlySet<string> = new Set([
  ${best.mbtiReversed.map((id) => `"${id}"`).join(", ")},
  ${best.enneagramReversed.map((id) => `"${id}"`).join(", ")},
  ${FIXED_CHALLENGE_REVERSALS.slice(0, 3).map((id) => `"${id}"`).join(", ")},
  ${FIXED_CHALLENGE_REVERSALS.slice(3, 7).map((id) => `"${id}"`).join(", ")},
  ${FIXED_CHALLENGE_REVERSALS.slice(7).map((id) => `"${id}"`).join(", ")},
]);
`);
