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
    const sequence = scoring.sessionQuestions(answers);
    assert.equal(sequence.length, data.MAX_QUESTIONS, `${name}: session length`);
    assert.deepEqual(sequence.map((q) => q.id), answers.map((a) => a.questionId), `${name}: the fixture answers the questions selection actually asks`);
    assert.equal(new Set(sequence.map((q) => q.id)).size, sequence.length, `${name}: no question is asked twice`);
    const foundation = sequence.slice(0, data.FOUNDATION_QUESTIONS.length);
    assert.deepEqual(foundation.map((q) => q.id), data.FOUNDATION_QUESTIONS.map((q) => q.id), `${name}: the foundation block is fixed and in order`);
    const adaptive = sequence.slice(data.FOUNDATION_QUESTIONS.length);
    assert.equal(adaptive.length, data.ADAPTIVE_QUESTIONS, `${name}: adaptive block size`);
    // Slots 1-2 are the A/T pair, unconditionally. A/T has no foundation coverage since the count
    // moved to 24, and an axis with fewer than two answers scores as ambiguous, so without both of
    // these reserved every respondent would be handed a null MBTI type.
    assert.deepEqual([adaptive[0].id, adaptive[1].id], ["c-at", "c-at2"], `${name}: A/T slots reserved`);
    assert.ok(adaptive.slice(2).every((q) => q.challengeFor), `${name}: every adaptive question targets something`);
    // The Enneagram floor. A greedy "always ask about the narrowest gap" rule spent all four
    // remaining slots on MBTI axes for any respondent whose four axes landed close together, which
    // is common with two foundation items each -- and reached the result with no adaptive Enneagram
    // evidence at all, which is the opposite of why the count moved to 24.
    const mbtiSlots = adaptive.filter((q) => /^c-(ie|sn|tf|jp)$/.test(q.id)).length;
    const enneagramSlots = adaptive.filter((q) => /^c-(core|wing)-/.test(q.id)).length;
    assert.ok(mbtiSlots <= 2, `${name}: MBTI takes at most two of the four open slots (took ${mbtiSlots})`);
    assert.ok(enneagramSlots >= 2, `${name}: the Enneagram keeps at least two of the four open slots (kept ${enneagramSlots})`);
    // Core challenges are capped at two so the wing keeps a slot. Uncapped, the rival rule kept
    // firing while the core stayed unclear -- which it usually does -- and a typical respondent got
    // three core challenges and no wing question, leaving wingStatus ambiguous for want of asking.
    assert.ok(adaptive.filter((q) => q.challengeFor?.core).length <= 2, `${name}: at most two core challenges`);
    assert.equal(adaptive.filter((q) => q.challengeFor?.wingCore).length, 1, `${name}: exactly one wing challenge`);
  }

  // Selection is a function of the answers before each question, not a block chosen once. The old
  // batch version was computed at question 18 and stored, so a respondent who went back and changed
  // a foundation answer kept the block picked for the answers they no longer had -- reproduced at
  // the time: a leading core moving from 9 to 1 kept c-core-9, c-core-2 and c-wing-9, so the wing
  // question asked about a core that was not theirs and the core they landed on got no adaptive
  // evidence at all.
  {
    const beforeChange = data.FOUNDATION_QUESTIONS.map((question, index) => ({ questionId: question.id, optionIndex: [0, 1, 2, 3][index % 4] }));
    const afterChange = beforeChange.map((answer, index) => (index >= 8 && index <= 10 ? { ...answer, optionIndex: 3 } : answer));
    const adaptiveFor = (prefix) => {
      const answers = [...prefix];
      while (answers.length < data.MAX_QUESTIONS) {
        const question = scoring.selectNextQuestion(answers);
        if (!question) break;
        answers.push({ questionId: question.id, optionIndex: 1 });
      }
      return answers.slice(data.FOUNDATION_QUESTIONS.length).map((a) => a.questionId);
    };
    assert.notDeepEqual(adaptiveFor(beforeChange), adaptiveFor(afterChange), "changing a foundation answer must re-derive the adaptive block");
    // And the wing question belongs to the core leading AT THE MOMENT IT IS CHOSEN -- which is the
    // whole point of choosing one question at a time. Checking it against the leader after the
    // foundation block would be asserting the old batch behaviour: an adaptive answer can move the
    // lead, and the wing question is supposed to follow it there.
    for (const prefix of [beforeChange, afterChange]) {
      const answers = [...prefix];
      let sawWing = false;
      while (answers.length < data.MAX_QUESTIONS) {
        const question = scoring.selectNextQuestion(answers);
        if (!question) break;
        if (question.challengeFor?.wingCore) {
          sawWing = true;
          assert.equal(question.challengeFor.wingCore, scoring.scoreAssessment(answers).enneagram.top.value,
            "the wing question belongs to the core leading when it was chosen");
        }
        answers.push({ questionId: question.id, optionIndex: 1 });
      }
      assert.ok(sawWing, "a wing question is always asked");
    }
  }

  // The budget, over many simulated sessions rather than the four fixtures. Both slot-starvation
  // bugs in this selector -- MBTI eating every open slot, and a third core challenge eating the
  // wing's -- were invisible on the fixtures and obvious the moment a few hundred answer patterns
  // were run through it.
  {
    let seed = 7;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let trial = 0; trial < 300; trial += 1) {
      const answers = [];
      while (answers.length < data.MAX_QUESTIONS) {
        const question = scoring.selectNextQuestion(answers);
        if (!question) break;
        answers.push({ questionId: question.id, optionIndex: Math.floor(random() * 4) });
      }
      assert.equal(answers.length, data.MAX_QUESTIONS, "every simulated session reaches full length");
      assert.equal(new Set(answers.map((a) => a.questionId)).size, answers.length, "no question is asked twice");
      const adaptive = answers.slice(data.FOUNDATION_QUESTIONS.length).map((a) => a.questionId);
      assert.deepEqual(adaptive.slice(0, 2), ["c-at", "c-at2"], "A/T pair holds the first two adaptive slots");
      const mbti = adaptive.filter((id) => /^c-(ie|sn|tf|jp)$/.test(id)).length;
      const core = adaptive.filter((id) => /^c-core-/.test(id)).length;
      const wing = adaptive.filter((id) => /^c-wing-/.test(id)).length;
      assert.ok(mbti >= 1 && mbti <= 2, `MBTI takes one or two open slots, took ${mbti}`);
      assert.ok(core <= 2, `at most two core challenges, got ${core}`);
      assert.equal(wing, 1, `exactly one wing challenge, got ${wing}`);
      assert.equal(mbti + core + wing, 4, "the four open slots are all spent on something targeted");
    }
  }

  // The second core challenge prefers a rival that is NOT adjacent to the leader. The wing question
  // already weights both neighbours, so asking a neighbour's core challenge as well pushes the same
  // core twice and can hand it the lead on duplicated evidence.
  {
    const prefix = data.FOUNDATION_QUESTIONS.map((question, index) => ({ questionId: question.id, optionIndex: index % 4 }));
    const leading = scoring.scoreAssessment(prefix).enneagram.top.value;
    const neighbours = [leading === 1 ? 9 : leading - 1, leading === 9 ? 1 : leading + 1];
    const answers = [...prefix];
    const adaptiveQuestions = [];
    while (answers.length < data.MAX_QUESTIONS) {
      const question = scoring.selectNextQuestion(answers);
      if (!question) break;
      adaptiveQuestions.push(question);
      answers.push({ questionId: question.id, optionIndex: 1 });
    }
    const coreIds = adaptiveQuestions
      .map((q) => q.challengeFor?.core)
      .filter((core) => core !== undefined && core !== leading);
    for (const core of coreIds) {
      assert.ok(!neighbours.includes(core), `the second core challenge (${core}) must not be a neighbour of the leading core (${leading})`);
    }
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
    const answers = [];
    for (let slot = 0; slot < data.MAX_QUESTIONS; slot += 1) {
      const question = scoring.selectNextQuestion(answers);
      if (!question) break;
      answers.push({ questionId: question.id, optionIndex: position });
    }
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

  console.log(`Module 1 tests passed: three-field profile contract, ${Object.keys(fixtures.ASSESSMENT_FIXTURES).length} scoring fixtures, confidence boundaries, all wing adjacencies, sequential adaptive selection, the 24-question contract, and keyed direction balance.`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
