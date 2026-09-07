import { FOUNDATION_QUESTIONS } from "./assessment-data";
import type { AnswerRecord } from "./scoring";
import { scoreAssessment } from "./scoring";
import { composeResultNarrative } from "./result-insights";

const byChoice = (choices: readonly number[]): AnswerRecord[] => FOUNDATION_QUESTIONS.map((question, index) => ({ questionId: question.id, optionIndex: choices[index] ?? 0 }));

export const ASSESSMENT_FIXTURES = {
  intjA5w6: [...byChoice([0,0,3,3,0,0,0,0,0,0,0,0,0,0,3,1,3,0]), { questionId: "c-at", optionIndex: 0 }, { questionId: "c-wing-5", optionIndex: 3 }],
  enfpT7w8: [...byChoice([3,3,3,3,3,3,3,3,3,3,2,2,3,2,3,2,2,2]), { questionId: "c-at", optionIndex: 3 }, { questionId: "c-wing-7", optionIndex: 3 }],
  clearCore4w5: [...byChoice([1,0,0,1,2,3,3,0,1,3,3,1,3,3,3,3,3,2]), { questionId: "c-jp", optionIndex: 0 }, { questionId: "c-core-4", optionIndex: 0 }],
  ambiguousWing: byChoice([0,0,3,3,0,0,0,0,0,0,0,0,0,0,3,1,3,3]),
  ambiguousCore: [],
} as const;

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
