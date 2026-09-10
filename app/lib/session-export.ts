import { ITEM_BANK_VERSION, MAX_QUESTIONS } from "./assessment-data";
import type { AnswerRecord, AssessmentResult } from "./scoring";

/**
 * Exporting a finished session so it can leave the browser.
 *
 * The reason this exists is a calibration run, and the reason it is a code rather than a screenshot
 * is that **a picture of a result loses the answers**. The answers are the only part that can show
 * our scoring to be wrong; the verdict is what we are trying to check, so exporting only the
 * verdict checks nothing. See docs/REFERENCE_TOOL_B_ANALYSIS.md §5.
 *
 * The code is small enough to paste from a phone because it does not need to carry the questions.
 * `selectNextQuestion` is a pure function of the answers so far, so the sequence of chosen option
 * indexes replays the whole session -- which questions were asked, in what order, and what was
 * picked. Twenty-four digits, plus the bank fingerprint that says which items they index into, plus
 * the derived result so a replay that disagrees is visible rather than silent.
 *
 * Nothing here is sent anywhere. The app has no backend; the person copies the code and decides who
 * to give it to, which is also why the name and team are in it -- they typed those, they can see
 * them in the code, and a calibration set needs to know whose session is whose.
 */

export const SESSION_CODE_PREFIX = "TDFB1";

export type SessionExport = {
  code: string;
  json: string;
  filename: string;
};

function confidenceLetter(confidence: string): string {
  return confidence === "clear" ? "C" : confidence === "close" ? "N" : "A";
}

/**
 * The one-line code. Fields are `key=value` separated by `|` so a field can be added later without
 * breaking a reader, and the answers are a digit string because every option index is 0-8.
 */
export function encodeSessionCode(
  answers: readonly AnswerRecord[],
  result: AssessmentResult,
  profile: { nickname: string; team: string },
): string {
  const digits = answers.map((answer) => String(answer.optionIndex)).join("");
  const type = result.enneagram.core === null
    ? "x"
    : `${result.enneagram.core}${result.wingStatus === "valid" ? `w${result.wing}` : ""}`;
  const fields = [
    SESSION_CODE_PREFIX,
    `b=${ITEM_BANK_VERSION}`,
    `n=${answers.length}`,
    `a=${digits}`,
    `e=${type}`,
    `m=${result.mbti.type ?? "x"}`,
    `c=${confidenceLetter(result.enneagram.confidence)}${confidenceLetter(result.mbti.confidence)}`,
    `t=${result.tension ? `${result.tension.inwardCore}/${result.tension.outwardCore}` : "-"}`,
    `w=${profile.nickname}`,
    `g=${profile.team}`,
  ];
  return fields.join("|");
}

/**
 * The full export. The code is what a person pastes into a chat; the JSON is the same session with
 * every question id spelled out, for whoever is actually doing the analysis and would rather not
 * replay a digit string to find out what was asked.
 */
export function buildSessionExport(
  answers: readonly AnswerRecord[],
  result: AssessmentResult,
  profile: { nickname: string; team: string; genderPresentation?: string },
): SessionExport {
  const code = encodeSessionCode(answers, result, profile);
  const payload = {
    format: SESSION_CODE_PREFIX,
    itemBankVersion: ITEM_BANK_VERSION,
    exportedAt: new Date().toISOString(),
    expectedQuestions: MAX_QUESTIONS,
    profile: {
      nickname: profile.nickname,
      team: profile.team,
      ...(profile.genderPresentation ? { genderPresentation: profile.genderPresentation } : {}),
    },
    answers: answers.map((answer) => ({ questionId: answer.questionId, optionIndex: answer.optionIndex })),
    result: {
      mbti: { type: result.mbti.type, candidate: result.mbti.candidate, confidence: result.mbti.confidence },
      enneagram: { core: result.enneagram.core, confidence: result.enneagram.confidence },
      wing: result.wing,
      wingStatus: result.wingStatus,
      tension: result.tension,
      dimensions: result.dimensions,
      scores: result.scores,
    },
    code,
  };
  const safeName = (profile.nickname || "session").replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 40);
  return {
    code,
    json: JSON.stringify(payload, null, 2),
    filename: `tdfb-personality-${safeName}-${ITEM_BANK_VERSION}.json`,
  };
}
