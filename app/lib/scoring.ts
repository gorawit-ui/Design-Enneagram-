import { CORE_CHALLENGES, DIMENSION_CHALLENGES, FOUNDATION_QUESTIONS, MAX_QUESTIONS, WING_CHALLENGES, type AssessmentQuestion } from "./assessment-data";
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
  /**
   * Set when the inward-looking items and the outward-looking ones lead to different cores, and
   * both lead their own runner-up clearly enough to be worth saying so.
   *
   * This is not a lower-confidence result. `confidence: "ambiguous"` already means "not enough
   * signal"; this means the opposite -- two signals, each reasonably clear, pointing different
   * ways. Usually that says the outward core is a strategy the person built to work with the world
   * and the inward one is what it sits on top of, which is a more useful thing to be told than an
   * average of the two.
   */
  tension: {
    inwardCore: EnneagramCore;
    outwardCore: EnneagramCore;
    inwardMargin: number;
    outwardMargin: number;
  } | null;
  scores: { mbti: Record<string, number>; enneagram: Record<EnneagramCore, number> };
};

/**
 * A lens's answer must be "clear" on the scorer's own terms before it is allowed to disagree with
 * the other lens: the same margin and evidence thresholds `enneagramConfidence` uses for "clear".
 *
 * Reused rather than invented, and the numbers are not arbitrary. At margin 2 -- the "not
 * ambiguous" boundary -- the tests found a false positive: the outward lens has six items and core
 * 4 has a primary option on only one of them, so a consistent core-4 respondent donates their
 * other outward answers, the donations settle on one core, and that core leads the outward lens by
 * 2. The page would then tell a perfectly consistent person that their inside and outside
 * disagree, off a signal our own item coverage manufactured. Telling someone two clear things
 * about them disagree is a strong claim, so it takes the scorer's strong threshold.
 */
const TENSION_MARGIN = 4;
/** Items in a lens that must have named the leading core -- again the "clear" threshold. */
const TENSION_EVIDENCE = 3;

/**
 * The leading core within one lens: how far it leads, and how many items named it. Returns null
 * when that lens produced no signal at all, which happens on a partial session.
 */
function leadingCore(
  answers: readonly AnswerRecord[],
  lens: "inward" | "outward",
): { core: EnneagramCore; margin: number; evidence: number } | null {
  const tally = Object.fromEntries(cores.map((core) => [core, 0])) as Record<EnneagramCore, number>;
  const itemsNaming = Object.fromEntries(cores.map((core) => [core, 0])) as Record<EnneagramCore, number>;
  let scored = 0;
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (question?.lens !== lens) continue;
    const option = question.options[answer.optionIndex];
    if (!option) continue;
    for (const [core, value] of Object.entries(option.weights.enneagram ?? {})) {
      const key = Number(core) as EnneagramCore;
      tally[key] += value ?? 0;
      itemsNaming[key] += 1;
      scored += 1;
    }
  }
  if (scored === 0) return null;
  const ranked = cores.map((core) => ({ core, score: tally[core] })).sort((a, b) => b.score - a.score || a.core - b.core);
  return { core: ranked[0].core, margin: ranked[0].score - ranked[1].score, evidence: itemsNaming[ranked[0].core] };
}

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
  // Tension between the two lenses. Computed from the foundation items only -- see the `lens`
  // comment in assessment-data.ts for why the adaptive challenges are excluded.
  const inward = leadingCore(answers, "inward");
  const outward = leadingCore(answers, "outward");
  const tension = inward && outward
    && inward.core !== outward.core
    && inward.margin >= TENSION_MARGIN && outward.margin >= TENSION_MARGIN
    && inward.evidence >= TENSION_EVIDENCE && outward.evidence >= TENSION_EVIDENCE
    ? { inwardCore: inward.core, outwardCore: outward.core, inwardMargin: inward.margin, outwardMargin: outward.margin }
    : null;

  return {
    dimensions,
    mbti: { status: mbtiConfidence, type: mbtiConfidence === "ambiguous" ? null : `${base}-${identity}` as MbtiType, candidate: `${base}-${identity}`, runnerUp: `${runnerLetters.slice(0,4).join("")}-${runnerLetters[4] === "Turbulent" ? "T" : "A"}`, confidence: mbtiConfidence },
    enneagram: { status: enneagramConfidence, core, top, runnerUp, confidence: enneagramConfidence },
    wing, wingStatus, tension, scores: { mbti, enneagram },
  };
}

// --- adaptive selection ------------------------------------------------------------------------
//
// One question at a time, recomputed from everything answered so far. This is not a refactor for
// tidiness: the previous version chose all six adaptive questions in one call at question 18 and
// page.tsx stored the result, so pressing the back button and changing a foundation answer left the
// session carrying the block picked for the old answers. Reproduced before it was changed -- a
// respondent whose leading core moved from 9 to 1 kept `c-core-9`, `c-core-2` and `c-wing-9`, so
// the wing question asked about a core that was no longer theirs, and the core it actually landed
// on got no adaptive evidence at all.
//
// `docs/PRODUCT_BLUEPRINT.md` already required this: "เปลี่ยนคำตอบย้อนหลังแล้วต้อง replay
// selection/scoring อย่าง deterministic หรือ invalidate เฉพาะ adaptive suffix อย่างโปร่งใส".
// Deriving each question from the answers before it makes replay the only behaviour there is.
//
// It also makes the block genuinely adaptive rather than six picks off one snapshot: the answer to
// the fifth question is visible when the sixth is chosen.

const ADAPTIVE_POOL = [...DIMENSION_CHALLENGES, ...CORE_CHALLENGES, ...WING_CHALLENGES];
const byId = (id: string) => ADAPTIVE_POOL.find((question) => question.id === id);
const adjacent = (core: EnneagramCore) =>
  [(core === 1 ? 9 : core-1) as EnneagramCore, (core === 9 ? 1 : core+1) as EnneagramCore];

/**
 * The question that best separates whichever candidates are still tied, or null if nothing is.
 *
 * A `c-core-N` item adds weight to N alone, so asking the runner-up's item is a genuine fork: an
 * answer that endorses it can take the lead, one that does not leaves the leader further ahead.
 * Either outcome ends the session with a wider margin than it had.
 *
 * The runner-up is asked even when it is adjacent to the leader, which is the one place this
 * departs from rule 3 below. That rule avoids neighbours because the wing question already weights
 * both of them, so a neighbour can take the lead on evidence counted twice. Here the wing question
 * has already been asked and the alternative is a result with no core at all, which is worse than
 * a core decided partly on a neighbour's second push. The cost is real and is measured rather than
 * assumed: `npm run items:tiebreak` reports the ambiguity rates, and `npm run items:reachability`
 * proves every core and wing pair is still reachable.
 */
function tieBreakQuestion(
  result: AssessmentResult,
  unasked: (id: string) => AssessmentQuestion | null,
): AssessmentQuestion | null {
  // The core branch that used to be here is deliberately absent, and this is the record of why.
  //
  // It fired when no core was named and asked the runner-up's core challenge. Measured, it was a
  // real gain: core ambiguity across 3000 simulated sessions fell 47.6% -> 42.7% and complete
  // results rose 35.5% -> 38.8%. It also broke a property the project had already committed to --
  // that straight-lining must not produce a confident core. A respondent who picks option 2 for
  // all 24 questions finished with "ลักษณ์ 2, close", because the tie-break item was answered by
  // position rather than by meaning and its DONATION (the weight an option gives to a core other
  // than the one it asks about) pushed a leader over the line.
  //
  // An evidence threshold was the obvious rescue and does not work: measured at the moment the
  // reserved slot is chosen, straight-liners carry 3-5 items of evidence for each candidate, which
  // is exactly the range varied sessions carry (2-5). Nothing separates them, so any threshold
  // that saved the property would have been fitted to the test rather than derived from the data.
  //
  // Naming a core off one arbitrary donation is worse than naming no core: an HR tool that hands a
  // confident type to someone who clicked the same button 24 times is wrong in a way that matters
  // more than the ambiguity rate. So the core branch stays out until there is an item that
  // discriminates without donating -- see docs/HR_ITEMS_OWED.md for the wording work that would
  // make one possible.

  // 2. Core settled, wing not. The wing is read off the two cores adjacent to the leader, so the
  //    way to separate them is to put weight on one of them and see whether it is taken.
  if (result.enneagram.core !== null && result.wingStatus === "ambiguous") {
    // The wing question first, when it has not been asked. It is the direct instrument, and
    // reaching for a neighbour's core challenge ahead of it starved the wing question out of a
    // session entirely -- the free slots went to an MBTI axis and two cores, and this rule took
    // the last one. Caught by the simulated-session budget test, not by the fixtures.
    const wing = unasked(`c-wing-${result.enneagram.core}`);
    if (wing) return wing;
    const neighbours = adjacent(result.enneagram.core)
      .map((value) => ({ value, score: result.scores.enneagram[value] }))
      .sort((a, b) => b.score - a.score || a.value - b.value);
    for (const neighbour of neighbours) {
      const question = unasked(`c-core-${neighbour.value}`);
      if (question) return question;
    }
  }

  return null;
}

/**
 * The question at position `answers.length`, or null once the session is complete.
 *
 * Pure and total: the same answers always produce the same question, and it never returns one that
 * has already been asked.
 */
export function selectNextQuestion(answers: readonly AnswerRecord[]): AssessmentQuestion | null {
  if (answers.length >= MAX_QUESTIONS) return null;
  if (answers.length < FOUNDATION_QUESTIONS.length) return FOUNDATION_QUESTIONS[answers.length];

  const asked = new Set(answers.map((answer) => answer.questionId));
  const unasked = (id: string) => (asked.has(id) ? null : byId(id) ?? null);

  // Slots 1-2, unconditionally. A/T has no foundation coverage since the count moved to 24, and
  // scoreAssessment calls an axis ambiguous below two answers, so one A/T item would leave every
  // respondent with a null MBTI type.
  const atSlot = unasked("c-at") ?? unasked("c-at2");
  if (atSlot) return atSlot;

  const result = scoreAssessment(answers);

  // The last slot is reserved for whatever is still undecided.
  //
  // The count is fixed at 24 (docs/QUESTION_COUNT_DECISION.md), so the final question is a budget
  // that gets spent whether or not anything still needs deciding -- and measured on the version
  // before this rule (`npm run items:tiebreak`), 15.3% of sessions spent it on an MBTI axis while
  // 47.6% finished with no core named at all. A respondent who leaves without a ลักษณ์ got nothing;
  // one whose J/P margin is 3 instead of 4 got a letter either way.
  //
  // So: if the core is not clear, or the core is clear but the wing is not, the last question goes
  // to breaking that tie. Everything else keeps its existing order.
  if (answers.length === MAX_QUESTIONS - 1) {
    const tieBreak = tieBreakQuestion(result, unasked);
    if (tieBreak) return tieBreak;
  }

  const narrowestAxis = (Object.entries(result.dimensions) as [keyof typeof pairs, AssessmentResult["dimensions"]["IE"]][])
    .filter(([name]) => name !== "AT")
    .filter(([name]) => !asked.has(`c-${name.toLowerCase()}`))
    .sort((a, b) => a[1].margin - b[1].margin || a[0].localeCompare(b[0]))[0];
  const mbtiSpent = [...asked].filter((id) => /^c-(ie|sn|tf|jp)$/.test(id)).length;

  // The four remaining slots are allocated to a BUDGET, not to a priority queue, and the budget is
  // the thing that stops one side starving the other. A plain "always ask about the narrowest gap"
  // rule looked right and was not: measured on it, a respondent whose four MBTI axes all landed
  // inside a point of each other -- which is common, since each axis has only two foundation items
  // -- spent every remaining slot on c-ie, c-sn, c-tf and c-jp and reached the result with NO
  // adaptive Enneagram evidence at all. That is the opposite of why the count moved to 24.
  //
  // So: one slot to MBTI and three to Enneagram, as the spec allocates, with the adaptivity inside
  // each side -- which axis, which cores, which wing -- and each choice recomputed from the answers
  // before it. MBTI takes a second slot only when the Enneagram side has nothing left to ask.

  // 1. One MBTI axis, and only if it is not already settled. An unresolved axis is the costliest
  //    gap because the result still shows a letter for it -- the character resolver falls back to
  //    `mbti.candidate` when the type is null -- so a coin-flip reaches the screen looking decided.
  if (mbtiSpent === 0 && narrowestAxis && narrowestAxis[1].margin < 4) {
    return byId(`c-${narrowestAxis[0].toLowerCase()}`)!;
  }

  // Two core challenges and one wing challenge is the Enneagram budget, and the cap belongs on the
  // total rather than on any one rule. Capping only the rival rule was not enough: when an adaptive
  // answer moved the lead, the leader rule fired again for the new leader, and that third core
  // challenge took the wing's slot -- 14% of simulated respondents finished with three core
  // challenges and no wing question at all.
  const coreChallengesSpent = [...asked].filter((id) => /^c-core-/.test(id)).length;

  // 2. The leading core, so the leader has adaptive evidence of its own rather than only the
  //    foundation block's.
  if (coreChallengesSpent < 2) {
    const leader = unasked(`c-core-${result.enneagram.top.value}`);
    if (leader) return leader;
  }

  // 3. Its strongest rival, preferring one that is NOT adjacent. The wing question below already
  //    weights both neighbours, so asking a neighbour's core challenge as well pushes the same core
  //    twice and can hand it the lead on duplicated evidence. A non-adjacent rival asks something
  //    the wing question cannot.
  //
  if (coreChallengesSpent < 2 && result.enneagram.confidence !== "clear") {
    const neighbours = adjacent(result.enneagram.top.value);
    const rivals = cores
      .map((value) => ({ value, score: result.scores.enneagram[value] }))
      .filter((candidate) => candidate.value !== result.enneagram.top.value)
      .filter((candidate) => !asked.has(`c-core-${candidate.value}`))
      .sort((a, b) => b.score - a.score || a.value - b.value);
    const preferred = rivals.find((candidate) => !neighbours.includes(candidate.value)) ?? rivals[0];
    if (preferred) return byId(`c-core-${preferred.value}`)!;
  }

  // 4. The wing, for whichever core is leading *now*. scoreAssessment reads the wing off the two
  //    cores adjacent to the leader, and this question is what puts weight on them.
  const wing = unasked(`c-wing-${result.enneagram.top.value}`);
  if (wing) return wing;

  // 5. Only now may MBTI take a second slot, and only for an axis that is still unsettled.
  if (narrowestAxis && narrowestAxis[1].margin < 4) return byId(`c-${narrowestAxis[0].toLowerCase()}`)!;

  // Everything the answers asked for is covered, so spend what is left confirming rather than
  // leaving the session short. Deterministic order, and never a repeat.
  const confirmations = [
    `c-core-${result.enneagram.runnerUp.value}`,
    ...(narrowestAxis ? [`c-${narrowestAxis[0].toLowerCase()}`] : []),
    ...ADAPTIVE_POOL.map((question) => question.id),
  ];
  for (const id of confirmations) {
    const question = unasked(id);
    if (question) return question;
  }
  return null;
}

/**
 * The questions this answer list determines: one per answer, plus the next one still to come.
 *
 * It cannot return more than that, and quietly returning `MAX_QUESTIONS` of them would be a lie --
 * every question past the answers is selected from answers that do not exist yet, so it would
 * repeat whatever the first unasked adaptive question happens to be. A full session in gives a full
 * session out; a prefix in gives that prefix plus one.
 */
export function sessionQuestions(answers: readonly AnswerRecord[]): readonly AssessmentQuestion[] {
  const questions: AssessmentQuestion[] = [];
  for (let index = 0; index <= answers.length && index < MAX_QUESTIONS; index += 1) {
    const question = selectNextQuestion(answers.slice(0, index));
    if (!question) break;
    questions.push(question);
  }
  return questions;
}

export function isValidWing(core: EnneagramCore, wing: EnneagramCore | null): boolean {
  return wing === null || wing === (core === 1 ? 9 : core-1) || wing === (core === 9 ? 1 : core+1);
}
