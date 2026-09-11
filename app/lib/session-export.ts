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
 * NO NAME AND NO TEAM ARE IN HERE, and that is a deliberate reversal. The first version carried
 * both, on the reasoning that a calibration set has to know whose session is whose. The Products
 * Owner's actual requirement is narrower: take the result data forward, not the people. So the
 * export carries a session id derived from the answers instead — enough to tell two sessions apart,
 * count them, and spot a duplicate, and not enough to say who took either one.
 *
 * The person's name still appears where it belongs: on their own screen and in their own PDF. What
 * leaves as DATA does not carry it. Gender presentation is out for the same reason — it changes
 * which picture is drawn and nothing about the score, so it is a personal detail with no analytical
 * value, which is the worst ratio a field can have.
 *
 * The profile is not a parameter of these functions at all any more. That is the point: a field
 * that cannot be passed in cannot be added back by accident.
 *
 * Nothing here is sent anywhere. The app has no backend; the person copies the code and decides who
 * to give it to.
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
 * A label for a session that is not a label for a person.
 *
 * Derived from the answers rather than randomised, so it is stable across re-renders and a second
 * copy of the same code is recognisably the same session rather than a new respondent. Two people
 * who answered all 24 items identically would share an id, which is not a flaw: for a calibration
 * set they ARE the same data point, and that is worth seeing.
 *
 * It is one-way in the only sense that matters here — the answers produce the id, the id does not
 * produce a name, because no name was ever in the input.
 */
function sessionId(digits: string): string {
  let hash = 0x811c9dc5;
  const source = `${ITEM_BANK_VERSION}:${digits}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(6, "0").slice(-6);
}

/**
 * The one-line code. Fields are `key=value` separated by `|` so a field can be added later without
 * breaking a reader, and the answers are a digit string because every option index is 0-8.
 */
export function encodeSessionCode(
  answers: readonly AnswerRecord[],
  result: AssessmentResult,
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
    `s=${sessionId(digits)}`,
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
): SessionExport {
  const code = encodeSessionCode(answers, result);
  const id = sessionId(answers.map((answer) => String(answer.optionIndex)).join(""));
  const payload = {
    format: SESSION_CODE_PREFIX,
    itemBankVersion: ITEM_BANK_VERSION,
    exportedAt: new Date().toISOString(),
    expectedQuestions: MAX_QUESTIONS,
    sessionId: id,
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
  return {
    code,
    json: JSON.stringify(payload, null, 2),
    // The filename is part of the export: one named after a person re-attaches the name the
    // contents just dropped, the moment the file is forwarded.
    filename: `tdfb-personality-${id}-${ITEM_BANK_VERSION}.json`,
  };
}
