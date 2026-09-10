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
    assert.equal(challenges.length, data.ADAPTIVE_QUESTIONS, `${name}: challenge count`);
    // Slots 1-2 are the A/T pair, unconditionally. A/T has no foundation coverage since the count
    // moved to 24, and an axis with fewer than two answers scores as ambiguous, so without both of
    // these reserved every respondent would be handed a null MBTI type.
    assert.deepEqual([challenges[0].id, challenges[1].id], ["c-at", "c-at2"], `${name}: A/T slots reserved`);
    assert.ok(challenges[2].challengeFor?.dimension, `${name}: dimension challenge`);
    assert.ok(challenges[3].challengeFor?.core && challenges[4].challengeFor?.core, `${name}: two core challenges`);
    assert.notEqual(challenges[3].id, challenges[4].id, `${name}: the two core challenges differ`);
    assert.ok(challenges[5].challengeFor?.wingCore, `${name}: wing challenge`);
    assert.equal(new Set(challenges.map((q) => q.id)).size, challenges.length, `${name}: no question is asked twice`);
  }

  const allQuestions = [...data.FOUNDATION_QUESTIONS, ...data.DIMENSION_CHALLENGES, ...data.CORE_CHALLENGES, ...data.WING_CHALLENGES];
  assert.equal(data.FOUNDATION_QUESTIONS.length, 18, "foundation question count");
  assert.equal(data.MAX_QUESTIONS, 24, "session question cap");
  assert.equal(data.FOUNDATION_QUESTIONS.length + data.ADAPTIVE_QUESTIONS, data.MAX_QUESTIONS, "foundation plus adaptive fills the session");

  // Keyed direction balance. Option position mapped to the same pole on every item, so answering
  // the same position throughout produced an extreme profile arriving as a *confident* result:
  // measured with nothing reversed, a full session of option 1 returns ISTJ-A at "clear" and
  // option 4 returns ENFP-T at "clear". The reversal set in assessment-data.ts is derived by
  // `npm run keying` to defeat exactly this, and here we assert the property rather than the list,
  // so the list stays free to change.
  //
  // The session must be COMPLETE for this to test anything. A/T has no foundation coverage since
  // the count moved to 24, so a foundation-only straight line scores ambiguous on the A/T axis
  // alone and the assertion passes whatever the keying is — a vacuous test that reads like a real
  // one. Answering the adaptive block too is what makes it bite.
  for (const position of [0, 1, 2, 3]) {
    const foundation = data.FOUNDATION_QUESTIONS.map((question) => ({ questionId: question.id, optionIndex: position }));
    const adaptive = scoring.selectChallengeQuestions(foundation).map((question) => ({ questionId: question.id, optionIndex: position }));
    const answers = [...foundation, ...adaptive];
    assert.equal(answers.length, data.MAX_QUESTIONS, `straight line at option ${position + 1} is a full session`);
    const result = scoring.scoreAssessment(answers);
    assert.equal(result.mbti.confidence, "ambiguous", `straight-lining option ${position + 1} must not yield a confident MBTI type`);
    assert.equal(result.mbti.type, null, `straight-lining option ${position + 1} must not name a type`);
    assert.equal(result.enneagram.confidence, "ambiguous", `straight-lining option ${position + 1} must not yield a confident core`);
    assert.equal(result.enneagram.core, null, `straight-lining option ${position + 1} must not name a core`);
  }
  for (const axis of ["IE", "SN", "TF", "JP"]) {
    const items = allQuestions.filter((question) => question.kind === "foundation" && question.id.startsWith(`f-${axis.toLowerCase()}-`));
    assert.equal(items.length, 2, `${axis}: two foundation items`);
    assert.equal(items.filter((question) => data.isReverseKeyed(question.id)).length, 1, `${axis}: exactly one of its two foundation items is reverse-keyed`);
  }
  assert.ok(allQuestions.every((question) => question.options.length === 4), "every question has four scored choices");

  console.log(`Module 1 tests passed: three-field profile contract, ${Object.keys(fixtures.ASSESSMENT_FIXTURES).length} scoring fixtures, confidence boundaries, all wing adjacencies, challenge routing, the 24-question contract, and keyed direction balance.`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
