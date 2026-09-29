import { axisClarity, type AssessmentResult, type Confidence } from "./scoring";

/**
 * The MBTI half of the result, one axis at a time.
 *
 * A type is named only when every axis is clear enough (`axisClarity`), and until this module the
 * page treated "not named" as "nothing to say": it printed two whole candidate types, hid the core
 * title, and showed the neutral character, even when four of the five axes were solid and only one
 * was a coin flip. What it says now is what the Myers-Briggs practice itself does with a slight
 * preference: print every letter with how clear it is, and where an axis really is a coin flip,
 * print both letters rather than pick one. Only the things built on the whole four-letter type --
 * the character and the MBTI x Enneagram reading -- still wait for every axis.
 *
 * The Thai labels here are PLACEHOLDERS until HR (Mook) settles the wording: how a "coin flip"
 * axis is said to a person without reading as "the test broke" or "something is wrong with me".
 * That is question 3 on the consult sheet sent to HR in September 2026.
 */

export type AxisKey = "IE" | "SN" | "TF" | "JP" | "AT";

type AxisDefinition = { key: AxisKey; left: string; right: string; leftThai: string; rightThai: string };

/** Letters as printed. A/T's right pole is stored as "Turbulent" by the scorer and printed "T". */
export const MBTI_AXES: readonly AxisDefinition[] = [
  { key: "IE", left: "I", right: "E", leftThai: "เก็บพลังคนเดียว", rightThai: "เก็บพลังจากคน" },
  { key: "SN", left: "S", right: "N", leftThai: "รูปธรรม", rightThai: "ภาพรวม" },
  { key: "TF", left: "T", right: "F", leftThai: "ใช้เกณฑ์", rightThai: "ดูคน" },
  { key: "JP", left: "J", right: "P", leftThai: "วางแผน", rightThai: "ยืดหยุ่น" },
  { key: "AT", left: "A", right: "T", leftThai: "มั่นใจ", rightThai: "ทบทวนตัวเอง" },
];

/** PLACEHOLDER wording, pending HR. */
export const CLARITY_THAI: Record<Confidence, string> = { clear: "ชัด", close: "พอชัด", ambiguous: "ก้ำกึ่ง" };

export type AxisReading = {
  key: AxisKey;
  clarity: Confidence;
  /** The letter to print: one pole, or both as "T/F" when the axis is a coin flip. */
  shown: string;
  /** What that means, in the same shape. */
  shownThai: string;
};

export function readAxes(result: AssessmentResult): AxisReading[] {
  return MBTI_AXES.map((axis) => {
    const dimension = result.dimensions[axis.key];
    const clarity = axisClarity(dimension);
    // Same tie-break as the scorer (`>=`, the left pole), so a named type and these letters agree.
    const leftLeads = dimension.left >= dimension.right;
    if (clarity === "ambiguous") {
      return { key: axis.key, clarity, shown: `${axis.left}/${axis.right}`, shownThai: `${axis.leftThai} / ${axis.rightThai}` };
    }
    return { key: axis.key, clarity, shown: leftLeads ? axis.left : axis.right, shownThai: leftLeads ? axis.leftThai : axis.rightThai };
  });
}

/**
 * The type as one string: "INTJ-A" when named, "IN(T/F)J-A" when an axis is a coin flip.
 *
 * Replaces "INTP-A / INTJ-A", which named two whole types and could only ever flip one axis -- with
 * two unclear axes it printed a pair that left one of them looking settled.
 */
export function mbtiCode(result: AssessmentResult): string {
  if (result.mbti.type) return result.mbti.type;
  const letter = (reading: AxisReading) => (reading.clarity === "ambiguous" ? `(${reading.shown})` : reading.shown);
  const axes = readAxes(result);
  return `${axes.slice(0, 4).map(letter).join("")}-${letter(axes[4])}`;
}

export const unclearAxes = (result: AssessmentResult) => readAxes(result).filter((axis) => axis.clarity === "ambiguous");
