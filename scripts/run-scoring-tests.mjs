import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-scoring-tests-"));
const sourceFiles = [
  "app/lib/assessment-data.ts",
  "app/lib/character-system.ts",
  "app/lib/scoring.ts",
  "app/lib/result-insights.ts",
  "app/lib/assessment-fixtures.ts",
  "app/lib/profile-contract.ts",
].map((file) => path.join(projectRoot, file));

try {
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
    const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => os.EOL,
    });
    throw new Error(`Unable to compile scoring modules for tests.${os.EOL}${message}`);
  }

  const scoring = require(path.join(temporaryDirectory, "scoring.js"));
  const data = require(path.join(temporaryDirectory, "assessment-data.js"));
  const fixtures = require(path.join(temporaryDirectory, "assessment-fixtures.js"));
  const profileContract = require(path.join(temporaryDirectory, "profile-contract.js"));

  assert.deepEqual(profileContract.PROFILE_FIELDS, ["nameAndNickname", "team", "gender"], "three-field profile contract");
  assert.deepEqual(Object.keys(profileContract.INITIAL_PROFILE), profileContract.PROFILE_FIELDS, "profile contains no unapproved fields");

  for (const [name, expectation] of Object.entries(fixtures.FIXTURE_EXPECTATIONS)) {
    const result = scoring.scoreAssessment(fixtures.ASSESSMENT_FIXTURES[name]);
    if ("mbti" in expectation) assert.equal(result.mbti.type, expectation.mbti, `${name}: MBTI`);
    if ("mbtiConfidence" in expectation) assert.equal(result.mbti.confidence, expectation.mbtiConfidence, `${name}: MBTI confidence`);
    if ("core" in expectation) assert.equal(result.enneagram.core, expectation.core, `${name}: core`);
    if ("enneagramConfidence" in expectation) assert.equal(result.enneagram.confidence, expectation.enneagramConfidence, `${name}: Enneagram confidence`);
    if ("wing" in expectation) assert.equal(result.wing, expectation.wing, `${name}: wing`);
    if ("wingStatus" in expectation) assert.equal(result.wingStatus, expectation.wingStatus, `${name}: wing status`);
  }

  assert.equal(scoring.scoreAssessment(fixtures.ASSESSMENT_FIXTURES.intjA5w6).enneagram.confidence, "close", "close Enneagram confidence");

  const empty = scoring.scoreAssessment([]);
  assert.equal(empty.mbti.confidence, "ambiguous", "empty MBTI confidence");
  assert.equal(empty.enneagram.confidence, "ambiguous", "empty Enneagram confidence");
  assert.equal(empty.enneagram.core, null, "empty core");
  assert.equal(empty.wing, null, "empty wing");
  assert.equal(empty.wingStatus, "unavailable", "empty wing status");

  const invalid = scoring.scoreAssessment([{ questionId: "missing", optionIndex: 99 }]);
  assert.equal(invalid.mbti.confidence, "ambiguous", "invalid answer is ignored");
  assert.equal(invalid.enneagram.core, null, "invalid answer does not create a core");

  for (let core = 1; core <= 9; core += 1) {
    const left = core === 1 ? 9 : core - 1;
    const right = core === 9 ? 1 : core + 1;
    assert.equal(scoring.isValidWing(core, null), true, `core ${core}: null wing`);
    for (let wing = 1; wing <= 9; wing += 1) {
      assert.equal(scoring.isValidWing(core, wing), wing === left || wing === right, `core ${core}: wing ${wing}`);
    }
  }

  for (const [name, answers] of Object.entries(fixtures.ASSESSMENT_FIXTURES)) {
    if (answers.length === 0) continue;
    const challenges = scoring.selectChallengeQuestions(answers.slice(0, data.FOUNDATION_QUESTIONS.length));
    assert.equal(challenges.length, 2, `${name}: challenge count`);
    assert.ok(challenges[0].challengeFor?.dimension, `${name}: dimension challenge`);
    assert.ok(challenges[1].challengeFor?.core || challenges[1].challengeFor?.wingCore, `${name}: Enneagram challenge`);
  }

  const allQuestions = [...data.FOUNDATION_QUESTIONS, ...data.DIMENSION_CHALLENGES, ...data.CORE_CHALLENGES, ...data.WING_CHALLENGES];
  assert.equal(data.FOUNDATION_QUESTIONS.length, 18, "foundation question count");
  assert.equal(data.MAX_QUESTIONS, 20, "session question cap");
  assert.ok(allQuestions.every((question) => question.options.length === 4), "every question has four scored choices");

  console.log(`Module 1 tests passed: three-field profile contract, ${Object.keys(fixtures.ASSESSMENT_FIXTURES).length} scoring fixtures, confidence boundaries, all wing adjacencies, challenge routing, and the 20-question contract.`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
