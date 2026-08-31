import { coreChallenges, foundationQuestions, mbtiChallenges, wingChallenges } from "./questions.ts";
import { scoreAssessment } from "./scoring.ts";
import type { Answer, EnneagramType, MbtiAxis, Question } from "./types.ts";

const axisOrder: MbtiAxis[] = ["IE", "SN", "TF", "JP"];

export function selectNextQuestion(answers: Answer[], selectedIds: string[]): Question | null {
  if (answers.length < foundationQuestions.length) return foundationQuestions[answers.length];
  if (answers.length >= 24) return null;
  const used = new Set([...answers.map((answer) => answer.questionId), ...selectedIds]);
  const result = scoreAssessment(answers);
  const adaptiveSlot = answers.length - foundationQuestions.length;

  if (adaptiveSlot < 2) {
    const weakest = [...axisOrder].sort((a, b) => result.mbti.axes[a].confidence - result.mbti.axes[b].confidence || axisOrder.indexOf(a) - axisOrder.indexOf(b))[0];
    return mbtiChallenges.find((question) => question.targets?.includes(weakest) && !used.has(question.id)) ?? mbtiChallenges.find((question) => !used.has(question.id)) ?? null;
  }
  if (adaptiveSlot < 4) {
    const candidates = [result.enneagram.core, ...result.enneagram.alternatives].filter(Boolean) as EnneagramType[];
    return coreChallenges.find((question) => candidates.some((type) => question.targets?.includes(type)) && !used.has(question.id)) ?? coreChallenges.find((question) => !used.has(question.id)) ?? null;
  }
  const core = result.enneagram.core ?? result.enneagram.alternatives[0] ?? 1;
  return wingChallenges.find((question) => question.targets?.[0] === core && !used.has(question.id)) ?? null;
}
