import { CORE_CHALLENGES, DIMENSION_CHALLENGES, FOUNDATION_QUESTIONS, WING_CHALLENGES, type AssessmentQuestion } from "./assessment-data";
import type { BaseMbtiType, EnneagramCore, Identity, MbtiType } from "./character-system";

export type AnswerRecord = { questionId: string; optionIndex: number };
export type Confidence = "clear" | "close" | "ambiguous";
type Candidate<T> = { value: T; score: number };
export type AssessmentResult = {
  dimensions: Record<"IE" | "SN" | "TF" | "JP" | "AT", { left: number; right: number; margin: number; evidence: number }>;
  mbti: { status: Confidence; type: MbtiType | null; candidate: string; runnerUp: string; confidence: Confidence };
  enneagram: { status: Confidence; core: EnneagramCore | null; top: Candidate<EnneagramCore>; runnerUp: Candidate<EnneagramCore>; confidence: Confidence };
  wing: EnneagramCore | null;
  wingStatus: "valid" | "ambiguous" | "unavailable";
  scores: { mbti: Record<string, number>; enneagram: Record<EnneagramCore, number> };
};

const ALL_QUESTIONS = [...FOUNDATION_QUESTIONS, ...DIMENSION_CHALLENGES, ...CORE_CHALLENGES, ...WING_CHALLENGES];
const questionMap = new Map(ALL_QUESTIONS.map((question) => [question.id, question]));
const pairs = { IE: ["I","E"], SN: ["S","N"], TF: ["T","F"], JP: ["J","P"], AT: ["A","Turbulent"] } as const;
const cores = [1,2,3,4,5,6,7,8,9] as const;

export function scoreAssessment(answers: readonly AnswerRecord[]): AssessmentResult {
  const mbti: Record<string, number> = { I:0,E:0,S:0,N:0,T:0,F:0,J:0,P:0,A:0,Turbulent:0 };
  const enneagram = Object.fromEntries(cores.map((core) => [core, 0])) as Record<EnneagramCore, number>;
  const evidence: Record<string, number> = {};
  for (const answer of answers) {
    const option = questionMap.get(answer.questionId)?.options[answer.optionIndex];
    if (!option) continue;
    for (const [pole, value] of Object.entries(option.weights.mbti ?? {})) { mbti[pole] += value ?? 0; evidence[pole] = (evidence[pole] ?? 0) + 1; }
    for (const [core, value] of Object.entries(option.weights.enneagram ?? {})) { const key = Number(core) as EnneagramCore; enneagram[key] += value ?? 0; evidence[`e${key}`] = (evidence[`e${key}`] ?? 0) + 1; }
  }
  const dimensions = Object.fromEntries(Object.entries(pairs).map(([name, [left,right]]) => [name, { left: mbti[left], right: mbti[right], margin: Math.abs(mbti[left]-mbti[right]), evidence:(evidence[left]??0)+(evidence[right]??0) }])) as AssessmentResult["dimensions"];
  const letters = Object.values(pairs).map(([left,right]) => mbti[left] >= mbti[right] ? left : right);
  const base = letters.slice(0,4).join("") as BaseMbtiType;
  const identity = (letters[4] === "Turbulent" ? "T" : "A") as Identity;
  const unclearDimensions = Object.values(dimensions).filter((dimension) => dimension.margin < 2 || dimension.evidence < 2).length;
  const mbtiConfidence: Confidence = unclearDimensions > 0 ? "ambiguous" : Object.values(dimensions).some((d) => d.margin < 4) ? "close" : "clear";
  const weakest = (Object.entries(dimensions) as [keyof typeof pairs, AssessmentResult["dimensions"]["IE"]][]).sort((a,b) => a[1].margin-b[1].margin)[0][0];
  const runnerLetters = [...letters]; runnerLetters[Object.keys(pairs).indexOf(weakest)] = runnerLetters[Object.keys(pairs).indexOf(weakest)] === pairs[weakest][0] ? pairs[weakest][1] : pairs[weakest][0];
  const candidates = cores.map((value) => ({ value, score: enneagram[value] })).sort((a,b) => b.score-a.score || a.value-b.value);
  const [top, runnerUp] = candidates;
  const coreMargin = top.score-runnerUp.score;
  const coreEvidence = evidence[`e${top.value}`] ?? 0;
  const enneagramConfidence: Confidence = coreMargin < 2 || coreEvidence < 2 ? "ambiguous" : coreMargin < 4 || coreEvidence < 3 ? "close" : "clear";
  const core = enneagramConfidence === "ambiguous" ? null : top.value;
  let wing: EnneagramCore | null = null;
  let wingStatus: AssessmentResult["wingStatus"] = core ? "ambiguous" : "unavailable";
  if (core) {
    const left = (core === 1 ? 9 : core-1) as EnneagramCore;
    const right = (core === 9 ? 1 : core+1) as EnneagramCore;
    if (Math.abs(enneagram[left]-enneagram[right]) >= 2) { wing = enneagram[left] > enneagram[right] ? left : right; wingStatus = "valid"; }
  }
  return {
    dimensions,
    mbti: { status: mbtiConfidence, type: mbtiConfidence === "ambiguous" ? null : `${base}-${identity}` as MbtiType, candidate: `${base}-${identity}`, runnerUp: `${runnerLetters.slice(0,4).join("")}-${runnerLetters[4] === "Turbulent" ? "T" : "A"}`, confidence: mbtiConfidence },
    enneagram: { status: enneagramConfidence, core, top, runnerUp, confidence: enneagramConfidence },
    wing, wingStatus, scores: { mbti, enneagram },
  };
}

export function selectChallengeQuestions(answers: readonly AnswerRecord[]): readonly [AssessmentQuestion, AssessmentQuestion] {
  const result = scoreAssessment(answers);
  const closestDimension = (Object.entries(result.dimensions) as [keyof typeof pairs, AssessmentResult["dimensions"]["IE"]][]).sort((a,b) => a[1].margin-b[1].margin || a[0].localeCompare(b[0]))[0][0];
  const dimensionQuestion = DIMENSION_CHALLENGES.find((q) => q.challengeFor?.dimension === closestDimension)!;
  const coreIsClear = result.enneagram.confidence !== "ambiguous" && result.enneagram.top.score-result.enneagram.runnerUp.score >= 4;
  const enneagramQuestion = coreIsClear
    ? WING_CHALLENGES.find((q) => q.challengeFor?.wingCore === result.enneagram.top.value)!
    : CORE_CHALLENGES.find((q) => q.challengeFor?.core === result.enneagram.top.value)!;
  return [dimensionQuestion, enneagramQuestion];
}

export function isValidWing(core: EnneagramCore, wing: EnneagramCore | null): boolean {
  return wing === null || wing === (core === 1 ? 9 : core-1) || wing === (core === 9 ? 1 : core+1);
}
