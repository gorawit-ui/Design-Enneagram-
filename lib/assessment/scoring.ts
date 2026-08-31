import { adjacentWings, allQuestions } from "./questions.ts";
import type { Answer, AssessmentResult, EnneagramType, MbtiAxis, Question } from "./types.ts";

const axes: MbtiAxis[] = ["IE", "SN", "TF", "JP"];
const letters: Record<MbtiAxis, [string, string]> = { IE: ["I", "E"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] };

export function scoreAssessment(answers: Answer[], questions: Question[] = allQuestions): AssessmentResult {
  const bank = new Map(questions.map((question) => [question.id, question]));
  const axisScores = Object.fromEntries(axes.map((axis) => [axis, 0])) as Record<MbtiAxis, number>;
  const axisEvidence = Object.fromEntries(axes.map((axis) => [axis, 0])) as Record<MbtiAxis, number>;
  const typeScores = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index + 1, 0])) as Record<EnneagramType, number>;
  const wingScores = { ...typeScores };

  for (const answer of answers) {
    const question = bank.get(answer.questionId);
    if (!question) continue;
    const centered = Math.max(-2, Math.min(2, answer.value - 3));
    for (const axis of axes) if (question.mbti?.[axis]) {
      axisScores[axis] += centered * question.mbti[axis]!;
      axisEvidence[axis] += 2 * Math.abs(question.mbti[axis]!);
    }
    for (let type = 1; type <= 9; type++) {
      const key = type as EnneagramType;
      typeScores[key] += centered * (question.enneagram?.[key] ?? 0);
      wingScores[key] += centered * (question.wing?.[key] ?? 0);
    }
  }

  const resultAxes = Object.fromEntries(axes.map((axis) => {
    const normalized = axisEvidence[axis] ? axisScores[axis] / axisEvidence[axis] : 0;
    const confidence = Math.min(1, Math.abs(normalized));
    const letter = Math.abs(normalized) < .12 ? "X" : normalized > 0 ? letters[axis][1] : letters[axis][0];
    return [axis, { letter, score: normalized, confidence }];
  })) as AssessmentResult["mbti"]["axes"];
  const overall = Math.min(...axes.map((axis) => resultAxes[axis].confidence));

  const ranked = (Object.entries(typeScores) as Array<[string, number]>).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
  const margin = ranked[0][1] - ranked[1][1];
  const coreConfidence = Math.max(0, Math.min(1, margin / 4));
  const core = (coreConfidence >= .12 ? Number(ranked[0][0]) : null) as EnneagramType | null;
  const provisionalCore = Number(ranked[0][0]) as EnneagramType;
  const [left, right] = adjacentWings(provisionalCore);
  const wingMargin = Math.abs(wingScores[left] - wingScores[right]);
  const wingConfidence = Math.min(1, wingMargin / 4);
  const wing = core && wingMargin > .35 ? (wingScores[left] > wingScores[right] ? left : right) : null;

  return {
    mbti: { label: axes.map((axis) => resultAxes[axis].letter).join(""), overall, axes: resultAxes },
    enneagram: { core, coreConfidence, alternatives: ranked.slice(core ? 1 : 0, core ? 3 : 2).map(([type]) => Number(type) as EnneagramType), wing, wingConfidence, wingStatus: wing ? (wingConfidence > .55 ? "clear" : "tentative") : "ambiguous" },
  };
}
