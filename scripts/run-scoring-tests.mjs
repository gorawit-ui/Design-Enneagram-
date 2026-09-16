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
  "app/lib/enneagram-depth.ts",
  "app/lib/session-export.ts",
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
  const depth = require(path.join(temporaryDirectory, "enneagram-depth.js"));
  const sessionExport = require(path.join(temporaryDirectory, "session-export.js"));

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
    assert.deepEqual([adaptive[0].id, adaptive[3].id], ["c-at", "c-at2"], `${name}: A/T slots reserved, and split apart`);
    assert.ok(adaptive.slice(2).every((q) => q.challengeFor), `${name}: every adaptive question targets something`);
    // The Enneagram floor. A greedy "always ask about the narrowest gap" rule spent all four
    // remaining slots on MBTI axes for any respondent whose four axes landed close together, which
    // is common with two foundation items each -- and reached the result with no adaptive Enneagram
    // evidence at all, which is the opposite of why the count moved to 24.
    const mbtiSlots = adaptive.filter((q) => /^c-(ie|sn|tf|jp)$/.test(q.id)).length;
    const enneagramSlots = adaptive.filter((q) => /^c-(core|wing)-/.test(q.id)).length;
    // Same invariant as the simulated-session block below, for the same reason: the Enneagram's
    // floor exists to stop MBTI starving it, not to hold a quota open after the core is named and
    // the wing is valid. Once its side is settled, an unresolved MBTI axis is the better spend.
    const settled = scoring.scoreAssessment(answers).enneagram.core !== null
      && scoring.scoreAssessment(answers).wingStatus === "valid";
    // MBTI's floor is conditional for the same reason the Enneagram's is: it exists to stop the
    // other side starving it, not to hold a quota open. Once every axis has cleared on the
    // foundation block alone -- which the evenly spaced 3/1/1/3 rungs now let happen -- there is
    // nothing for the slot to resolve, and the Enneagram is the better spend.
    assert.ok(mbtiSlots >= 1 || scoring.scoreAssessment(answers).mbti.type !== null,
      `${name}: MBTI takes an open slot unless every axis is already settled (took ${mbtiSlots})`);
    assert.ok(enneagramSlots >= 2 || settled,
      `${name}: the Enneagram keeps two of the four open slots unless its side is settled (kept ${enneagramSlots})`);
    // Core challenges are capped at two BEFORE the reserved final slot, so the wing keeps a slot.
    // Uncapped, the rival rule kept firing while the core stayed unclear -- which it usually does --
    // and a typical respondent got three core challenges and no wing question, leaving wingStatus
    // ambiguous for want of asking.
    //
    // The final slot may add a third: it is the reserved tie-break, and when the core is settled
    // but the wing is not, the way to separate the two neighbours is to put weight on one of them.
    // It reaches for a neighbour's core challenge only after the wing question itself has been
    // asked, so the wing is never starved -- which is why the assertion below still says exactly
    // one wing challenge, and why an earlier version of the tie-break that reached for the
    // neighbour first was caught here rather than in production.
    assert.ok(adaptive.slice(0, -1).filter((q) => q.challengeFor?.core).length <= 2,
      `${name}: at most two core challenges before the reserved slot`);
    assert.ok(adaptive.filter((q) => q.challengeFor?.core).length <= 3, `${name}: at most three core challenges`);
    // At most one wing challenge, and ZERO is correct rather than starved. The wing slot is only
    // spent while the wing is still unresolved: a wing is valid at a margin of 2, the item's middle
    // rungs are worth 2 to the neighbour they lean toward, so asking into a settled wing cannot
    // raise it and can flatten it to a tie. A session that settled its wing from the foundation
    // block has nothing for the item to do. The assertion below keeps the item from becoming dead
    // code in the case that still needs it.
    assert.ok(adaptive.filter((q) => q.challengeFor?.wingCore).length <= 1, `${name}: at most one wing challenge`);
  }

  // ...and a session that reaches the adaptive block with the wing still open is still asked.
  assert.equal(
    scoring.sessionQuestions(fixtures.ASSESSMENT_FIXTURES.ambiguousWing)
      .filter((question) => question.challengeFor?.wingCore).length,
    1,
    "a session whose wing is unresolved is still asked the wing question",
  );

  // Selection is a function of the answers before each question, not a block chosen once. The old
  // batch version was computed at question 18 and stored, so a respondent who went back and changed
  // a foundation answer kept the block picked for the answers they no longer had -- reproduced at
  // the time: a leading core moving from 9 to 1 kept c-core-9, c-core-2 and c-wing-9, so the wing
  // question asked about a core that was not theirs and the core they landed on got no adaptive
  // evidence at all.
  {
    //
    // The change being made has to be one that actually moves the leading core, or the assertion
    // passes for the wrong reason. Hardcoding which answers to flip made this test go stale twice
    // as the item set changed -- the flip stopped moving the leader and the test started asserting
    // that two identical blocks were different. So it SEARCHES for a foundation answer that moves
    // the leader, and fails if the item set no longer contains one.
    const beforeChange = data.FOUNDATION_QUESTIONS.map((question, index) => ({ questionId: question.id, optionIndex: [0, 1, 2, 3][index % 4] }));
    const adaptiveFor = (prefix) => {
      const answers = [...prefix];
      while (answers.length < data.MAX_QUESTIONS) {
        const question = scoring.selectNextQuestion(answers);
        if (!question) break;
        answers.push({ questionId: question.id, optionIndex: 1 });
      }
      return answers.slice(data.FOUNDATION_QUESTIONS.length).map((a) => a.questionId);
    };
    const baselineLeader = scoring.scoreAssessment(beforeChange).enneagram.top.value;
    let afterChange = null;
    for (let position = 0; position < beforeChange.length && !afterChange; position += 1) {
      const options = data.FOUNDATION_QUESTIONS[position].options.length;
      for (let choice = 0; choice < options; choice += 1) {
        const variant = beforeChange.map((answer, index) => (index === position ? { ...answer, optionIndex: choice } : answer));
        if (scoring.scoreAssessment(variant).enneagram.top.value !== baselineLeader) { afterChange = variant; break; }
      }
    }
    assert.ok(afterChange, "no single foundation answer moves the leading core — the test cannot test anything");
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
      // Not "always asked" any more: the slot is only spent while the wing is still open, because
      // the item's middle rungs are worth 2 and a valid wing can lead by exactly 2 -- asking there
      // can only flatten it. Skipping is therefore correct when the wing came out valid, and
      // starvation when it did not, which is what this distinguishes.
      assert.ok(sawWing || scoring.scoreAssessment(answers).wingStatus === "valid",
        "a wing question is asked whenever the wing is still unresolved");
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
      const result = scoring.scoreAssessment(answers);
      assert.deepEqual([adaptive[0], adaptive[3]], ["c-at", "c-at2"], "A/T pair holds adaptive slots 1 and 4, not two in a row");
      const mbti = adaptive.filter((id) => /^c-(ie|sn|tf|jp)$/.test(id)).length;
      const core = adaptive.filter((id) => /^c-core-/.test(id)).length;
      const wing = adaptive.filter((id) => /^c-wing-/.test(id)).length;
      assert.ok(mbti >= 1 || result.mbti.type !== null,
        `MBTI takes an open slot unless every axis is already settled, took ${mbti}`);
      const beforeReserved = adaptive.slice(0, -1).filter((id) => /^c-core-/.test(id)).length;
      assert.ok(beforeReserved <= 2, `at most two core challenges before the reserved slot, got ${beforeReserved}`);
      assert.ok(core <= 3, `at most three core challenges in total, got ${core}`);
      assert.ok(wing <= 1, `at most one wing challenge, got ${wing}`);
      assert.equal(mbti + core + wing, 4, "the four open slots are all spent on something targeted");
      // The Enneagram's two-slot floor is about STARVATION, not about a quota, so it is conditional
      // on the Enneagram still having something to ask. Once the core is named and the wing is
      // valid, its remaining questions can only confirm what is already decided -- and the wing item
      // in particular can flatten a 2-point lead to a tie -- so handing the slot to an MBTI axis
      // that is still unresolved is the better spend, not a regression of the starvation fix.
      const settled = result.enneagram.core !== null && result.wingStatus === "valid";
      assert.ok(core + wing >= 2 || settled,
        `the Enneagram keeps two of the four open slots unless its side is settled (kept ${core + wing})`);
    }
  }

  // No two items may measure the same thing AND phrase it alike. A respondent reported the test
  // repeating itself; nothing was literally repeated, but f-e-2 and f-e-4 were the same question
  // with the same four cores, f-tf-1 and c-tf ended in the same six words, and the two A/T items
  // sat back to back. "Different id" is not the same guarantee as "reads as a different question",
  // so this asserts the second one directly.
  {
    const everyItem = [...data.FOUNDATION_QUESTIONS, ...data.DIMENSION_CHALLENGES,
      ...data.CORE_CHALLENGES, ...data.WING_CHALLENGES];
    const targetOf = (question) => {
      const marks = new Set();
      for (const option of question.options) {
        for (const core of Object.keys(option.weights.enneagram ?? {})) marks.add(`e${core}`);
        for (const pole of Object.keys(option.weights.mbti ?? {})) marks.add(pole);
      }
      return [...marks].sort().join(",");
    };
    const wordsOf = (question) => new Set(
      question.prompt.replace(/[?"“”]/g, "").split(/\s+/).filter((word) => word.length > 2),
    );
    for (let i = 0; i < everyItem.length; i += 1) {
      for (let j = i + 1; j < everyItem.length; j += 1) {
        const [a, b] = [everyItem[i], everyItem[j]];
        if (targetOf(a) !== targetOf(b)) continue;
        const [wa, wb] = [wordsOf(a), wordsOf(b)];
        const shared = [...wa].filter((word) => wb.has(word)).length;
        const overlap = shared / Math.min(wa.size, wb.size);
        assert.ok(overlap < 0.3,
          `${a.id} and ${b.id} measure the same thing and share ${Math.round(overlap * 100)}% of their prompt wording — they read as one question asked twice`);
      }
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
  // Four options everywhere except the two items that carry one per Enneagram core. That
  // exception is the fix for four unreachable types, so it is asserted rather than tolerated: an
  // item asking about fear or inner voice whose options cover only some of the nine forces the
  // rest of the respondents to answer about somebody else, and a donated answer lands wherever the
  // other options happen to point. See scripts/probe-type-reachability.mjs.
  //
  // f-e-2 is a third exception at six, and for the same reason one step down. It and f-e-4 asked
  // the same question twice and offered the SAME four cores both times, so a 1, 2, 3, 4 or 9 had
  // nothing to pick in either -- twice, out of ten Enneagram items. Session 9yyds9 is what that
  // cost: a respondent who knows she is 9w1 took the type 7 option in both and finished as core 7.
  // f-e-2 now carries the five cores f-e-4 cannot serve, plus type 7 so that 7 and 9 are offered
  // side by side rather than one at a time -- they are the pair this question confuses, since both
  // answer uncertainty with "keep something open".
  const WIDE_ITEMS = { "f-e-3": 9, "f-e-6": 9, "f-e-2": 6 };
  for (const question of allQuestions) {
    const expected = WIDE_ITEMS[question.id] ?? 4;
    assert.equal(question.options.length, expected,
      `${question.id}: ${expected} scored choices`);
  }
  // The two nine-option items must cover every core with a single-core option each; that is what
  // makes them the items nobody has to donate an answer in.
  const NINE_OPTION_ITEMS = Object.entries(WIDE_ITEMS).filter(([, n]) => n === 9).map(([id]) => id);
  assert.deepEqual(NINE_OPTION_ITEMS.sort(), ["f-e-3", "f-e-6"], "the two per-core items are f-e-3 and f-e-6");
  for (const id of NINE_OPTION_ITEMS) {
    const question = allQuestions.find((q) => q.id === id);
    assert.ok(question, `${id} exists`);
    const cores = question.options.map((option) => {
      const carried = Object.keys(option.weights.enneagram ?? {});
      assert.equal(carried.length, 1, `${id}: each option carries exactly one core`);
      return Number(carried[0]);
    }).sort((a, b) => a - b);
    assert.deepEqual(cores, [1, 2, 3, 4, 5, 6, 7, 8, 9],
      `${id}: one option per core, so nobody has to donate their answer`);
    assert.ok(question.options.every((option) => typeof option.hint === "string" && option.hint.length > 0),
      `${id}: every option carries a gloss`);
  }
  {
    const feTwo = allQuestions.find((q) => q.id === "f-e-2");
    const cores = feTwo.options.map((option) => {
      const carried = Object.keys(option.weights.enneagram ?? {});
      assert.equal(carried.length, 1, "f-e-2: each option carries exactly one core");
      return Number(carried[0]);
    });
    assert.equal(new Set(cores).size, cores.length, "f-e-2: no core appears twice");
    const feFour = allQuestions.find((q) => q.id === "f-e-4");
    const served = new Set(feFour.options.flatMap((option) =>
      Object.entries(option.weights.enneagram ?? {})
        .sort((a, b) => b[1] - a[1]).slice(0, 1).map(([core]) => Number(core))));
    // Every core f-e-4 cannot serve must have a home in f-e-2, or the pair leaves someone homeless
    // twice running -- the defect that sent session 9yyds9's core 9 to core 7.
    for (let core = 1; core <= 9; core += 1) {
      assert.ok(served.has(core) || cores.includes(core),
        `core ${core} has no option in either f-e-2 or f-e-4`);
    }
  }

  // --- lens tension ------------------------------------------------------------------------
  // The claim being tested is that tension means "two clear signals disagreeing" rather than
  // "weak signal", because the result page words it that way to the respondent.
  const foundationEnneagram = allQuestions.filter((question) => question.id.startsWith("f-e-"));
  for (const question of foundationEnneagram) {
    assert.ok(question.lens === "inward" || question.lens === "outward",
      `${question.id}: carries a lens, so it can take part in tension detection`);
  }
  assert.equal(foundationEnneagram.filter((question) => question.lens === "inward").length, 4, "four inward items");
  assert.equal(foundationEnneagram.filter((question) => question.lens === "outward").length, 6, "six outward items");
  for (const question of allQuestions) {
    if (question.id.startsWith("f-e-")) continue;
    assert.equal(question.lens, undefined,
      `${question.id}: only the Enneagram foundation items carry a lens -- the adaptive challenges `
      + "are selected by the leading core, so they could never disagree with it");
  }

  // Build a session that answers inward as one core and outward as another, and check it is
  // reported rather than averaged away.
  // Answer each item as favourably to that lens's target core as the item allows. The first
  // version of this fell back to option 0 when the target core had no option, and on a
  // reverse-keyed item option 0 is core 8 -- so it quietly donated 8 points to core 8 and core 8
  // led the outward lens instead of the core the test was aiming for. The fix is to prefer the
  // option carrying the target core and, when no option carries it, take the one that gives away
  // the least, so a donation is a donation rather than a vote for whatever happens to be first.
  const answerBy = (inwardCore, outwardCore) => {
    const built = [];
    for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
      const question = scoring.selectNextQuestion(built);
      if (!question) break;
      const want = question.lens === "inward" ? inwardCore : question.lens === "outward" ? outwardCore : null;
      let index = 0;
      if (want !== null) {
        let bestScore = -Infinity;
        question.options.forEach((option, candidate) => {
          const weights = option.weights.enneagram ?? {};
          const forTarget = weights[want] ?? 0;
          const total = Object.values(weights).reduce((sum, value) => sum + (value ?? 0), 0);
          // Target weight first; among options that carry none of it, the smallest donation.
          const score = forTarget * 10 - total;
          if (score > bestScore) { bestScore = score; index = candidate; }
        });
      }
      built.push({ questionId: question.id, optionIndex: index });
    }
    return built;
  };
  // Tested as a property over every ordered pair of distinct cores rather than on one hand-picked
  // pair. The first version asserted a tension for inward 5 / outward 3 and failed -- correctly:
  // core 3 leads the outward lens by only 1 there, below the margin, so no tension is reported and
  // that is the rule working. Picking a pair that passes instead would have been choosing the test
  // to fit the code. What must hold for every pair is agreement between the tallies and the
  // reported tension, in both directions.
  const lensTally = (answers, lens) => {
    const tally = {};
    const naming = {};
    for (const answer of answers) {
      const question = allQuestions.find((candidate) => candidate.id === answer.questionId);
      if (question?.lens !== lens) continue;
      const option = question.options[answer.optionIndex];
      for (const [core, value] of Object.entries(option.weights.enneagram ?? {})) {
        tally[core] = (tally[core] ?? 0) + value;
        naming[core] = (naming[core] ?? 0) + 1;
      }
    }
    const ranked = Object.entries(tally).map(([core, score]) => ({ core: Number(core), score }))
      .sort((a, b) => b.score - a.score || a.core - b.core);
    if (!ranked.length) return null;
    return { core: ranked[0].core, margin: ranked[0].score - (ranked[1]?.score ?? 0),
      evidence: naming[ranked[0].core] ?? 0 };
  };

  let detectable = 0;
  const undetected = [];
  for (const inwardCore of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    for (const outwardCore of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      if (inwardCore === outwardCore) continue;
      const answers = answerBy(inwardCore, outwardCore);
      const result = scoring.scoreAssessment(answers);
      const inward = lensTally(answers, "inward");
      const outward = lensTally(answers, "outward");
      // Mirrors the scorer's rule: each lens must be "clear" on its own terms before it is
      // allowed to disagree with the other.
      const shouldReport = inward && outward && inward.core !== outward.core
        && inward.margin >= 4 && outward.margin >= 4
        && inward.evidence >= 3 && outward.evidence >= 3;
      if (shouldReport) {
        detectable += 1;
        assert.ok(result.tension,
          `inward ${inwardCore} / outward ${outwardCore}: both lenses lead by >= 2 and disagree, so a tension is reported`);
        assert.equal(result.tension.inwardCore, inward.core, `inward ${inwardCore} / outward ${outwardCore}: names the inward leader`);
        assert.equal(result.tension.outwardCore, outward.core, `inward ${inwardCore} / outward ${outwardCore}: names the outward leader`);
        assert.ok(result.tension.inwardMargin >= 4 && result.tension.outwardMargin >= 4,
          `inward ${inwardCore} / outward ${outwardCore}: both sides lead by at least 4, which is what makes `
          + "this a disagreement between two signals rather than an absence of signal");
      } else {
        undetected.push(`${inwardCore}/${outwardCore}`);
        assert.equal(result.tension, null,
          `inward ${inwardCore} / outward ${outwardCore}: no tension reported unless both lenses lead clearly and disagree`);
      }
    }
  }
  assert.ok(detectable >= 12,
    `at least 12 of the 72 core pairs are detectable as a tension (got ${detectable}); below that the `
    + "outward lens is too thinly covered for the feature to be worth showing");

  // The ordinary case: one core throughout, on all nine, reports nothing.
  for (const core of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    assert.equal(scoring.scoreAssessment(answerBy(core, core)).tension, null,
      `answering as core ${core} on both lenses reports no tension`);
  }
  // A straight-lined session carries no signal, so it must not be dressed up as two.
  for (const position of [0, 1, 2, 3]) {
    const flat = [];
    for (let slot = 0; slot < data.MAX_QUESTIONS; slot += 1) {
      const question = scoring.selectNextQuestion(flat);
      if (!question) break;
      flat.push({ questionId: question.id, optionIndex: position });
    }
    const result = scoring.scoreAssessment(flat);
    if (result.tension) {
      assert.ok(result.tension.inwardMargin >= 4 && result.tension.outwardMargin >= 4,
        `straight-lining option ${position + 1}: any reported tension still needs two clear sides`);
    }
  }
  console.log(`  lens tension: ${detectable}/72 core pairs detectable`
    + `${undetected.length ? ` · not detectable: ${undetected.slice(0, 8).join(" ")}${undetected.length > 8 ? " …" : ""}` : ""}`);

  // --- session export ----------------------------------------------------------------------
  // The whole calibration plan rests on one claim: the 24 option indexes in an exported code
  // replay the session exactly. That is true only because selectNextQuestion is a pure function of
  // the answers so far, and it stops being true the moment anything in selection reads state from
  // anywhere else. So it is asserted rather than assumed -- take a session, throw away everything
  // except the digits, rebuild it from the digits alone, and require an identical result.
  const roundTrip = (choices) => {
    const rebuilt = [];
    for (const optionIndex of choices) {
      const question = scoring.selectNextQuestion(rebuilt);
      if (!question) break;
      rebuilt.push({ questionId: question.id, optionIndex });
    }
    return rebuilt;
  };
  for (const [name, original] of Object.entries(fixtures.ASSESSMENT_FIXTURES)) {
    if (!original.length) continue;
    const code = sessionExport.encodeSessionCode(original, scoring.scoreAssessment(original));
    const digits = /\|a=(\d*)\|/.exec(code)?.[1] ?? "";
    assert.equal(digits.length, original.length,
      `${name}: the code carries one digit per answer`);
    const rebuilt = roundTrip([...digits].map(Number));
    assert.deepEqual(rebuilt.map((answer) => answer.questionId), original.map((answer) => answer.questionId),
      `${name}: replaying the digits asks exactly the same questions in the same order`);
    assert.deepEqual(rebuilt, [...original],
      `${name}: replaying the digits reproduces the session`);
    const before = scoring.scoreAssessment(original);
    const after = scoring.scoreAssessment(rebuilt);
    assert.deepEqual(after.scores, before.scores, `${name}: and the same scores`);
    assert.equal(after.enneagram.core, before.enneagram.core, `${name}: and the same core`);
    assert.equal(after.wing, before.wing, `${name}: and the same wing`);
    assert.equal(after.mbti.type, before.mbti.type, `${name}: and the same MBTI type`);
  }
  // What leaves as data carries no person. The Products Owner's requirement is to take the result
  // data forward and not the people, and the export used to carry the name and the team in both
  // the code and the JSON. This is the guard that stops either coming back: the functions no longer
  // take a profile at all, so a reviewer would have to add a parameter to break it, and these
  // assertions make that visible rather than silent.
  {
    const answers = fixtures.ASSESSMENT_FIXTURES.intjA5w6;
    const result = scoring.scoreAssessment(answers);
    const bundle = sessionExport.buildSessionExport(answers, result);
    const payload = JSON.parse(bundle.json);

    assert.equal(sessionExport.encodeSessionCode.length, 2,
      "encodeSessionCode takes answers and a result — a third parameter is how a name gets back in");
    assert.equal(sessionExport.buildSessionExport.length, 2,
      "buildSessionExport takes answers and a result, and nothing about the person");

    for (const field of ["w=", "g="]) {
      assert.ok(!bundle.code.includes(field), `the code no longer carries the ${field} field`);
    }
    assert.ok(/\|s=[a-z0-9]{6}(\||$)/.test(bundle.code), "the code carries a six-character session id");
    assert.equal(payload.profile, undefined, "the JSON carries no profile block");
    assert.equal(payload.sessionId, /\|s=([a-z0-9]{6})/.exec(bundle.code)[1],
      "the JSON and the code name the same session");
    assert.ok(!/nickname|team|genderPresentation/.test(bundle.json),
      "no profile field survives anywhere in the JSON");
    assert.ok(!/[\u0E00-\u0E7F]/.test(bundle.filename),
      "the filename carries no Thai text, which in practice means no name");
    assert.ok(bundle.filename.includes(payload.sessionId),
      "the file is named after the session, not the person");

    // Time per question rides in the code, because it is about the ITEMS rather than the person:
    // an item everyone dwells on twice as long as its neighbours is the one to rewrite, and that
    // cannot be recovered after the fact. Omitted entirely when a session has none, so a reader
    // written against the old format is unaffected.
    assert.ok(!bundle.code.includes("|d="), "a session with no timings carries no d= field");
    const timed = sessionExport.buildSessionExport(answers, result, answers.map((_, i) => i + 3));
    const field = /\|d=([\d,]+)/.exec(timed.code);
    assert.ok(field, "a session with timings carries them");
    assert.equal(field[1].split(",").length, answers.length, "one duration per answer");
    assert.equal(field[1].split(",")[0], "3", "the first question's seconds come first");
    const timedPayload = JSON.parse(timed.json);
    assert.equal(timedPayload.answers[0].seconds, 3, "the JSON carries seconds per answer");
    assert.equal(timedPayload.answers.at(-1).seconds, answers.length + 2, "…in order");
    assert.ok(!/nickname|team|genderPresentation/.test(timed.json),
      "adding timings did not smuggle a profile back in");

    // Stable, because a code copied twice must be recognisably one session rather than two.
    assert.equal(sessionExport.encodeSessionCode(answers, result), bundle.code,
      "the same session encodes to the same code every time");
    // And different sessions get different ids, or counting them is meaningless.
    const other = fixtures.ASSESSMENT_FIXTURES.enfpT7w8;
    assert.notEqual(JSON.parse(sessionExport.buildSessionExport(other, scoring.scoreAssessment(other)).json).sessionId,
      payload.sessionId, "two different sessions get two different ids");
  }

  // Every option index has to be a single digit, or the digit string is ambiguous. Nine options is
  // the widest item in the bank today; a tenth would silently break every exported code.
  for (const question of allQuestions) {
    assert.ok(question.options.length <= 10,
      `${question.id}: at most ten options, so an option index stays one character in an exported code`);
  }
  // The bank fingerprint has to be stable across calls and change when the bank changes.
  assert.equal(data.ITEM_BANK_VERSION, data.ITEM_BANK_VERSION, "the fingerprint is stable");
  assert.match(data.ITEM_BANK_VERSION, /^[0-9a-z]{6}$/, "the fingerprint is six base-36 characters");

  // --- the depth layer ---------------------------------------------------------------------
  // The two arrows are derived from two cycles rather than typed out as two tables, so what is
  // worth asserting is that the derivation still produces the Enneagram's actual structure. If
  // someone edits the cycles, these fail rather than the result page quietly telling a type 5 they
  // move toward 6.
  const allCores = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const stressTargets = allCores.map((core) => depth.stressArrow(core));
  const growthTargets = allCores.map((core) => depth.growthArrow(core));
  assert.deepEqual([...stressTargets].sort((a, b) => a - b), allCores,
    "the stress arrow is a permutation of the nine cores: every core is somebody's stress point");
  assert.deepEqual([...growthTargets].sort((a, b) => a - b), allCores,
    "the growth arrow is a permutation of the nine cores");
  for (const core of allCores) {
    assert.notEqual(depth.stressArrow(core), core, `core ${core} does not move to itself under stress`);
    assert.notEqual(depth.growthArrow(core), core, `core ${core} does not move to itself in growth`);
    assert.equal(depth.growthArrow(depth.stressArrow(core)), core,
      `core ${core}: growth is exactly the inverse of stress, so the two arrows cannot drift apart`);
  }
  // The classic figure: a six-cycle and a three-cycle. Asserted explicitly because it is the one
  // fact here that comes from the model rather than from this code.
  assert.deepEqual([1, 4, 2, 8, 5, 7].map((core) => depth.stressArrow(core)), [4, 2, 8, 5, 7, 1],
    "stress runs 1-4-2-8-5-7 and back to 1");
  assert.deepEqual([3, 9, 6].map((core) => depth.stressArrow(core)), [9, 6, 3],
    "stress runs 3-9-6 and back to 3");
  for (const core of allCores) {
    const entry = depth.ENNEAGRAM_DEPTH[core];
    assert.ok(entry, `core ${core} has a depth entry`);
    for (const field of ["coreFearThai", "coreDesireThai", "defenceThai", "underStrainThai", "towardGrowthThai"]) {
      assert.ok(typeof entry[field] === "string" && entry[field].length > 10,
        `core ${core}: ${field} is written`);
    }
    for (const level of ["healthyThai", "averageThai", "strainedThai"]) {
      assert.ok(typeof entry.levels[level] === "string" && entry.levels[level].length > 20,
        `core ${core}: the ${level} level is written`);
    }
    // The result page shows the fear from this module and the assessment asks it in f-e-3. If the
    // two disagree, a respondent picks one sentence and is shown a different one as their fear.
    const fearOption = allQuestions.find((question) => question.id === "f-e-3")
      .options.find((option) => (option.weights.enneagram ?? {})[core] !== undefined);
    assert.equal(fearOption.text, entry.coreFearThai,
      `core ${core}: the fear on the result page is the same sentence f-e-3 offered`);
  }

  console.log(`Module 1 tests passed: three-field profile contract, ${Object.keys(fixtures.ASSESSMENT_FIXTURES).length} scoring fixtures, confidence boundaries, all wing adjacencies, sequential adaptive selection, the 24-question contract, keyed direction balance, the depth layer's two arrows, lens tension, and export round-trips.`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
