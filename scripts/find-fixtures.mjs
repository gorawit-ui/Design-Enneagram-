// Search for scoring fixtures that satisfy FIXTURE_EXPECTATIONS, and print them as source.
//
// The fixtures used to be hand-tuned choice vectors indexed positionally into FOUNDATION_QUESTIONS.
// That made every change to the item set a puzzle: remove one item and eighteen indices shift, so
// the answer sets silently start describing different people and the expectations stop holding for
// reasons nobody can see in the diff. The item set is going to change again -- reverse keying,
// candidate mode, whatever the January calibration says -- so the fixtures are now generated.
//
// Each fixture is a complete 24-answer session: the 18 foundation answers plus an answer to each of
// the six adaptive questions that those foundation answers actually select. That is a realer
// specimen than the old partial sets, which answered two challenges out of the block.
//
// Deterministic: a fixed seed, a fixed restart count, and a fixed mutation order, so two runs on
// the same item set produce byte-identical output.
//
// Usage:
//   node scripts/find-fixtures.mjs            print the fixture block
//   node scripts/find-fixtures.mjs --write     rewrite app/lib/assessment-fixtures.ts in place

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const SEED = 20260910;
const RESTARTS = 400;
const SWEEPS = 24;

function compileModules() {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-find-fixtures-"));
  const sourceFiles = ["app/lib/assessment-data.ts", "app/lib/character-system.ts", "app/lib/scoring.ts"]
    .map((file) => path.join(projectRoot, file));
  const program = ts.createProgram(sourceFiles, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    outDir: temporaryDirectory,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: true,
    noEmitOnError: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const emitResult = program.emit();
  if (diagnostics.length || emitResult.emitSkipped) {
    throw new Error(ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => os.EOL,
    }));
  }
  return {
    scoring: require(path.join(temporaryDirectory, "scoring.js")),
    data: require(path.join(temporaryDirectory, "assessment-data.js")),
    cleanup: () => fs.rmSync(temporaryDirectory, { recursive: true, force: true }),
  };
}

// A small deterministic PRNG. Math.random would make the output differ per run, which is the whole
// thing this script exists to avoid.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The targets, as the assertions in run-scoring-tests.mjs read them.
const TARGETS = {
  intjA5w6: { mbti: "INTJ-A", core: 5, wing: 6, enneagramConfidence: "close" },
  enfpT7w8: { mbti: "ENFP-T", core: 7, wing: 8 },
  clearCore4w5: { mbti: null, mbtiConfidence: "ambiguous", core: 4, enneagramConfidence: "clear", wing: 5, wingStatus: "valid" },
  ambiguousWing: { core: 5, wing: null, wingStatus: "ambiguous" },
};

/** How far a result is from a target. Zero means every named field matches. */
function distance(result, target) {
  let miss = 0;
  if ("mbti" in target) {
    if (target.mbti === null) {
      if (result.mbti.type !== null) miss += 4;
    } else if (result.mbti.type !== target.mbti) {
      // Count letters so the search has a gradient instead of a cliff.
      const want = target.mbti.replace("-", "");
      const got = (result.mbti.candidate ?? "").replace("-", "");
      for (let i = 0; i < want.length; i += 1) if (want[i] !== got[i]) miss += 1;
      if (result.mbti.type === null) miss += 1;
    }
  }
  if ("mbtiConfidence" in target && result.mbti.confidence !== target.mbtiConfidence) miss += 2;
  if ("core" in target && result.enneagram.core !== target.core) {
    miss += result.enneagram.top.value === target.core ? 1 : 3;
  }
  if ("enneagramConfidence" in target && result.enneagram.confidence !== target.enneagramConfidence) miss += 2;
  if ("wing" in target && result.wing !== target.wing) miss += 2;
  if ("wingStatus" in target && result.wingStatus !== target.wingStatus) miss += 2;
  return miss;
}

function buildAnswers({ scoring, data }, foundationChoices, adaptiveChoices) {
  const foundation = data.FOUNDATION_QUESTIONS.map((question, index) => ({
    questionId: question.id,
    optionIndex: foundationChoices[index],
  }));
  const adaptive = scoring.selectChallengeQuestions(foundation).map((question, index) => ({
    questionId: question.id,
    optionIndex: adaptiveChoices[index],
  }));
  return [...foundation, ...adaptive];
}

function search(modules, target, random) {
  const { scoring, data } = modules;
  const foundationSize = data.FOUNDATION_QUESTIONS.length;
  const adaptiveSize = data.ADAPTIVE_QUESTIONS;
  let best = null;

  for (let restart = 0; restart < RESTARTS; restart += 1) {
    const vector = Array.from({ length: foundationSize + adaptiveSize }, () => Math.floor(random() * 4));
    let current = { vector: [...vector], score: Infinity };
    const evaluate = (candidate) => {
      const answers = buildAnswers(modules, candidate.slice(0, foundationSize), candidate.slice(foundationSize));
      return { answers, score: distance(scoring.scoreAssessment(answers), target) };
    };
    let evaluated = evaluate(current.vector);
    current = { vector: current.vector, score: evaluated.score, answers: evaluated.answers };

    for (let sweep = 0; sweep < SWEEPS && current.score > 0; sweep += 1) {
      let improved = false;
      for (let position = 0; position < current.vector.length; position += 1) {
        for (let option = 0; option < 4; option += 1) {
          if (option === current.vector[position]) continue;
          const trial = [...current.vector];
          trial[position] = option;
          const next = evaluate(trial);
          if (next.score < current.score) {
            current = { vector: trial, score: next.score, answers: next.answers };
            improved = true;
            if (current.score === 0) break;
          }
        }
        if (current.score === 0) break;
      }
      if (!improved) break;
    }

    if (best === null || current.score < best.score) best = current;
    if (best.score === 0) break;
  }
  return best;
}

const modules = compileModules();
try {
  const random = mulberry32(SEED);
  const found = {};
  let failed = false;
  for (const [name, target] of Object.entries(TARGETS)) {
    const result = search(modules, target, random);
    const scored = modules.scoring.scoreAssessment(result.answers);
    const ok = result.score === 0;
    if (!ok) failed = true;
    console.error(`${ok ? "ok  " : "FAIL"} ${name.padEnd(14)} -> ${scored.mbti.type ?? "null"} `
      + `core ${scored.enneagram.core ?? "null"} (${scored.enneagram.confidence}) `
      + `wing ${scored.wing ?? "null"} (${scored.wingStatus})${ok ? "" : `  distance ${result.score}`}`);
    found[name] = result.answers;
  }
  if (failed) {
    console.error("\nNo answer set reaches at least one target. The targets may no longer be");
    console.error("reachable from this item set, which is a finding about the items rather than");
    console.error("a reason to loosen the expectations. Nothing was written.");
    process.exit(1);
  }

  const render = (answers) => `[${answers.map((a) => `{ questionId: "${a.questionId}", optionIndex: ${a.optionIndex} }`).join(", ")}]`;
  const block = Object.entries(found)
    .map(([name, answers]) => `  ${name}: ${render(answers)},`)
    .join("\n");

  const header = `// GENERATED by \`npm run fixtures\` (scripts/find-fixtures.mjs). Do not hand-edit the answer sets:
// they are searched for against FIXTURE_EXPECTATIONS, so any change to the item set is answered by
// re-running the script rather than by re-tuning eighteen indices by hand.
//
// Each fixture is a full 24-answer session -- the 18 foundation answers plus an answer to each of
// the six adaptive questions those answers select.`;

  const output = `${header}
import type { AnswerRecord } from "./scoring";
import { scoreAssessment } from "./scoring";
import { composeResultNarrative } from "./result-insights";

export const ASSESSMENT_FIXTURES: Record<string, readonly AnswerRecord[]> = {
${block}
  ambiguousCore: [],
};

export const FIXTURE_EXPECTATIONS = {
  intjA5w6: { mbti: "INTJ-A", core: 5, wing: 6 },
  enfpT7w8: { mbti: "ENFP-T", core: 7, wing: 8 },
  clearCore4w5: { mbti: null, mbtiConfidence: "ambiguous", core: 4, enneagramConfidence: "clear", wing: 5, wingStatus: "valid" },
  ambiguousWing: { core: 5, wing: null, wingStatus: "ambiguous" },
  ambiguousCore: { core: null, wing: null, wingStatus: "unavailable" },
} as const;

/** Lightweight deterministic checks available to local QA without a test dependency. */
export const RESULT_INSIGHT_CHECKS = Object.fromEntries(
  Object.entries(ASSESSMENT_FIXTURES).map(([name, answers]) => {
    const result = scoreAssessment(answers);
    const narrative = composeResultNarrative(result);
    return [name, {
      type: result.mbti.type,
      core: result.enneagram.core,
      wing: result.wing,
      wingStatus: result.wingStatus,
      hasWingDetail: narrative.wing !== null,
      narrative: narrative.narrative,
    }];
  }),
);
`;

  if (process.argv.includes("--write")) {
    fs.writeFileSync(path.join(projectRoot, "app/lib/assessment-fixtures.ts"), output);
    console.error("\nwrote app/lib/assessment-fixtures.ts");
  } else {
    process.stdout.write(output);
  }
} finally {
  modules.cleanup();
}
