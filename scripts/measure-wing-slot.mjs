// What the wing question does to a wing that is already decided.
//
// Session wvg9a3 finished with no wing, and the replay shows why: the respondent's wing was
// `2` and `valid` at 4-2 from question 19 onward, the last slot asked the wing question anyway,
// and a middle-rung answer worth 2 to the other neighbour made it 4-4. The wing rule is
// `|left - right| >= 2`, so a lead of exactly 2 is the one lead a 2-point answer can erase.
// Asking there cannot improve a valid wing and can destroy one.
//
// This measures that: simulated respondents carry a true core AND a true wing, and the same seeded
// answers are run through the selector as it stands and through the one-line variant that spends
// the slot elsewhere when the wing is already valid.
//
// Usage: node scripts/measure-wing-slot.mjs [consistency] [sessions-per-pair]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

const CURRENT = `  const wing = unasked(\`c-wing-\${result.enneagram.top.value}\`);
  if (wing) return wing;`;
const VARIANT = `  if (result.wingStatus !== "valid") {
    const wing = unasked(\`c-wing-\${result.enneagram.top.value}\`);
    if (wing) return wing;
  }`;

/** Compile app/lib against a scoring.ts that may have been patched, and return its exports. */
function build(label, patch) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `wing-${label}-`));
  const src = path.join(dir, "src");
  fs.mkdirSync(src);
  for (const file of ["assessment-data.ts", "character-system.ts", "scoring.ts"]) {
    let text = fs.readFileSync(path.join(root, "app/lib", file), "utf8");
    if (file === "scoring.ts" && patch) {
      if (!text.includes(CURRENT)) throw new Error("scoring.ts no longer contains the wing rule this script patches");
      text = text.replace(CURRENT, VARIANT);
    }
    fs.writeFileSync(path.join(src, file), text);
  }
  const out = path.join(dir, "out");
  ts.createProgram(
    ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(src, f)),
    { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out, esModuleInterop: true, skipLibCheck: true },
  ).emit();
  return { scoring: require(path.join(out, "scoring.js")), data: require(path.join(out, "assessment-data.js")) };
}

const CONSISTENCY = Number(process.argv[2] ?? 0.75);
const SESSIONS = Number(process.argv[3] ?? 400);
const cores = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const wingsOf = (core) => [core === 1 ? 9 : core - 1, core === 9 ? 1 : core + 1];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/**
 * The option a person with this core and this wing would pick: their core first, their wing as the
 * tie-breaker. On a wing item the core carries no weight in any option, so the wing decides -- which
 * is the whole point of the item, and makes this respondent the easy case rather than a hard one.
 */
function idealOption(question, core, wing) {
  let best = null;
  let bestValue = 0;
  question.options.forEach((option, index) => {
    const e = option.weights?.enneagram;
    if (!e) return;
    const value = (e[core] ?? 0) * 2 + (e[wing] ?? 0);
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
}

function run(build, label) {
  const { scoring, data } = build;
  const tally = { named: 0, correct: 0, total: 0, askedWhenValid: 0, brokeAValidWing: 0, rescued: 0 };
  for (const core of cores) {
    for (const wing of wingsOf(core)) {
      const random = mulberry32(4200 + core * 31 + wing);
      for (let session = 0; session < SESSIONS; session += 1) {
        const answers = [];
        let before = null;
        for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
          const question = scoring.selectNextQuestion(answers);
          if (!question) break;
          if (/^c-wing-/.test(question.id)) before = scoring.scoreAssessment(answers);
          const ideal = idealOption(question, core, wing);
          const choice = ideal !== null && random() < CONSISTENCY
            ? ideal
            : Math.floor(random() * question.options.length);
          answers.push({ questionId: question.id, optionIndex: choice });
        }
        const result = scoring.scoreAssessment(answers);
        tally.total += 1;
        if (result.wingStatus === "valid") tally.named += 1;
        if (result.wingStatus === "valid" && result.enneagram.core === core && result.wing === wing) tally.correct += 1;
        if (before && before.wingStatus === "valid") {
          tally.askedWhenValid += 1;
          if (result.wingStatus !== "valid") tally.brokeAValidWing += 1;
        }
        if (before && before.wingStatus !== "valid" && result.wingStatus === "valid") tally.rescued += 1;
      }
    }
  }
  const pct = (n) => `${((n / tally.total) * 100).toFixed(1)}%`;
  console.log(`${label}`);
  console.log(`  wing named            ${pct(tally.named)}`);
  console.log(`  wing named AND right  ${pct(tally.correct)}`);
  console.log(`  asked when already valid   ${tally.askedWhenValid}  (${pct(tally.askedWhenValid)})`);
  console.log(`  ...and broke it            ${tally.brokeAValidWing}  (${tally.askedWhenValid ? ((tally.brokeAValidWing / tally.askedWhenValid) * 100).toFixed(1) : "0"}% of those)`);
  console.log(`  rescued an unresolved wing ${tally.rescued}  (${pct(tally.rescued)})`);
  return tally;
}

console.log(`${SESSIONS} sessions x 18 core/wing pairs = ${SESSIONS * 18}, ${Math.round(CONSISTENCY * 100)}% consistent\n`);
const a = run(build("cur", false), "as it stands — the wing slot is spent whenever the item is unasked");
console.log();
const b = run(build("var", true), "variant — spend it elsewhere when the wing is already valid");
console.log(`\ndelta  named ${(((b.named - a.named) / a.total) * 100).toFixed(1)} pts   correct ${(((b.correct - a.correct) / a.total) * 100).toFixed(1)} pts`);
