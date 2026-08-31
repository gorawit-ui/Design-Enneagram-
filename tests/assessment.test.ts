import assert from "node:assert/strict";
import test from "node:test";
import { adjacentWings, allQuestions, foundationQuestions } from "../lib/assessment/questions.ts";
import { scoreAssessment } from "../lib/assessment/scoring.ts";
import { selectNextQuestion } from "../lib/assessment/selector.ts";
import type { Answer, EnneagramType } from "../lib/assessment/types.ts";

test("foundation contains exactly 18 approved-flow questions", () => {
  assert.equal(foundationQuestions.length, 18);
  assert.equal(new Set(foundationQuestions.map((q) => q.id)).size, 18);
});

test("wing adjacency wraps correctly for every core", () => {
  assert.deepEqual(adjacentWings(1), [9, 2]);
  assert.deepEqual(adjacentWings(9), [8, 1]);
  for (let core = 2; core <= 8; core++) assert.deepEqual(adjacentWings(core as EnneagramType), [core - 1, core + 1]);
});

test("wing tie remains ambiguous and never defaults left", () => {
  const answers = foundationQuestions.map((q) => ({ questionId: q.id, value: q.id === "f-e-7" ? 5 : 3 }));
  const result = scoreAssessment(answers);
  assert.equal(result.enneagram.core, 7);
  assert.equal(result.enneagram.wing, null);
  assert.equal(result.enneagram.wingStatus, "ambiguous");
});

test("MBTI axes calculate independently", () => {
  const values = [5, 1, 1, 5, 1, 5, 1, 5];
  const answers = foundationQuestions.slice(0, 8).map((q, index) => ({ questionId: q.id, value: values[index] }));
  const result = scoreAssessment(answers);
  assert.equal(result.mbti.label, "ENFP");
  assert.equal(result.mbti.axes.IE.score, 1);
});

test("deterministic selector returns unique questions and stops at 24", () => {
  const answers: Answer[] = [];
  const selected: string[] = [];
  while (answers.length < 24) {
    const question = selectNextQuestion(answers, selected);
    assert.ok(question, `question exists for slot ${answers.length + 1}`);
    assert.ok(!selected.includes(question.id));
    selected.push(question.id);
    answers.push({ questionId: question.id, value: answers.length % 2 ? 4 : 5 });
  }
  assert.equal(new Set(selected).size, 24);
  assert.equal(selectNextQuestion(answers, selected), null);
  assert.equal(answers.slice(18, 20).every((a) => allQuestions.find((q) => q.id === a.questionId)?.purpose === "mbti_challenge"), true);
  assert.equal(answers.slice(20, 22).every((a) => allQuestions.find((q) => q.id === a.questionId)?.purpose === "core_challenge"), true);
  assert.equal(answers.slice(22, 24).every((a) => allQuestions.find((q) => q.id === a.questionId)?.purpose === "wing_challenge"), true);
});
