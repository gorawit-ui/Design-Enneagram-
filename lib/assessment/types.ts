export const TOTAL_QUESTIONS = 24;
export const FOUNDATION_QUESTIONS = 18;
export const ADAPTIVE_QUESTIONS = 6;
export const MAX_AI_CALLS_PER_SESSION = 3;
export const WEB_TARGET_MINUTES = 8;
export const WEB_HARD_LIMIT_MINUTES = 10;

export type MbtiAxis = "IE" | "SN" | "TF" | "JP";
export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Purpose = "mbti_foundation" | "enneagram_foundation" | "mbti_challenge" | "core_challenge" | "wing_challenge";

export interface Question {
  id: string;
  phase: "foundation" | "adaptive";
  purpose: Purpose;
  prompt: string;
  context: string;
  mbti?: Partial<Record<MbtiAxis, number>>;
  enneagram?: Partial<Record<EnneagramType, number>>;
  wing?: Partial<Record<EnneagramType, number>>;
  targets?: Array<MbtiAxis | EnneagramType>;
}

export interface Answer { questionId: string; value: number }
export type ConfidenceLabel = "clear" | "tentative" | "ambiguous";

export interface AssessmentResult {
  mbti: { label: string; overall: number; axes: Record<MbtiAxis, { letter: string; score: number; confidence: number }> };
  enneagram: { core: EnneagramType | null; coreConfidence: number; alternatives: EnneagramType[]; wing: EnneagramType | null; wingConfidence: number; wingStatus: ConfidenceLabel };
}
