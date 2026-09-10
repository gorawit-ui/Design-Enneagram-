import type { EnneagramCore, MbtiType } from "./character-system";
import type { MbtiPole } from "./assessment-data";

/**
 * Where the MBTI result and the Enneagram core agree, and where they pull against each other.
 *
 * The result page already carried both lenses and put them in one sentence -- "MBTI ช่วยอธิบายวิธีคิด
 * … ขณะเดียวกันแรงขับแบบ N เน้นว่า …". That is juxtaposition, not crossing: it never says the two
 * agree here and disagree there, which is the part a reader recognises themselves in and the part
 * the reference tool does that we did not.
 *
 * ---
 *
 * **These are stated correspondences, not established findings, and the UI says so.**
 *
 * Nothing here is derived from our own data, because we have none: the January calibration is the
 * first time this instrument meets a person whose type is known independently. They are the
 * correspondences the popular Enneagram-and-MBTI literature repeats, written as observations a
 * reader can accept or reject about themselves -- "มักจะ", never "คุณคือ".
 *
 * That framing is not politeness. `docs/REFERENCE_TOOL_B_ANALYSIS.md` §3 records the one thing in
 * the reference tool we decided not to copy: it used a second framework to explain away answers
 * that disagreed with its verdict, which makes the verdict unfalsifiable and therefore impossible
 * to calibrate. So this module is presentation only. **It never touches scoring.** The core is
 * computed from the items by the arithmetic in scoring.ts before anything here runs, and a
 * correspondence that turns out to be wrong costs us a paragraph rather than a result.
 *
 * The calibration run is what decides which of these survive.
 */

export type PoleReading = { pole: MbtiPole; lineThai: string };
export type CoreCrossReading = {
  /** Poles whose habits push in the same direction as the core's drive. */
  amplifies: readonly PoleReading[];
  /** Poles that pull against it — the interesting half. */
  pulls: readonly PoleReading[];
};

const CROSS_READINGS: Record<EnneagramCore, CoreCrossReading> = {
  1: {
    amplifies: [
      { pole: "J", lineThai: "การวางแผนล่วงหน้าทำให้มาตรฐานของคุณมีที่ลงจริง ไม่ได้ค้างอยู่แค่ในหัว" },
      { pole: "T", lineThai: "การตัดสินจากเหตุผลทำให้คุณยืนอยู่ในหลักได้แม้ตอนที่คนไม่พอใจ" },
    ],
    pulls: [
      { pole: "P", lineThai: "การเปิดทางเลือกไว้ขัดกับความอยากปิดเรื่องให้เรียบร้อย — คุณอาจรู้สึกค้างกับสิ่งที่ยังไม่จบ" },
      { pole: "F", lineThai: "ความใส่ใจความรู้สึกคนทำให้พูดเรื่องมาตรฐานยากขึ้น จึงมักเก็บไว้แล้วไปแก้เอง" },
    ],
  },
  2: {
    amplifies: [
      { pole: "F", lineThai: "การอ่านความรู้สึกคนทำให้คุณเห็นสิ่งที่เขาต้องการก่อนเขาจะบอก" },
      { pole: "E", lineThai: "การได้อยู่กับคนเติมพลังให้คุณ แทนที่จะกินพลังอย่างที่หลายคนเป็น" },
    ],
    pulls: [
      { pole: "T", lineThai: "การตัดสินจากเหตุผลขัดกับการอยากช่วย — บางครั้งคุณรู้ว่าไม่ควรรับ แต่ก็รับ" },
      { pole: "I", lineThai: "ความต้องการเวลาส่วนตัวขัดกับความรู้สึกว่าต้องอยู่ให้คนอื่นพึ่งได้" },
    ],
  },
  3: {
    amplifies: [
      { pole: "E", lineThai: "การได้แชร์และได้คนเห็นทำให้ผลงานรู้สึกว่าเสร็จจริง" },
      { pole: "J", lineThai: "การปิดงานให้จบเป็นเรื่อง ๆ ทำให้คุณเดินได้เร็วกว่าคนอื่น" },
    ],
    pulls: [
      { pole: "I", lineThai: "การชอบอยู่กับตัวเองขัดกับความอยากให้คนเห็น — คุณอาจทำงานหนักแล้วไม่บอกใคร" },
      { pole: "P", lineThai: "การเปิดทางเลือกไว้ทำให้เป้าขยับ ซึ่งกัดกับความอยากไปถึงให้ได้" },
    ],
  },
  4: {
    amplifies: [
      { pole: "F", lineThai: "การให้น้ำหนักกับความรู้สึกคือทางที่คุณเข้าถึงสิ่งที่จริงสำหรับตัวเอง" },
      { pole: "N", lineThai: "การมองความเป็นไปได้ทำให้คุณเห็นชั้นที่คนอื่นเดินผ่าน" },
    ],
    pulls: [
      { pole: "T", lineThai: "การตัดสินจากเหตุผลขัดกับความรู้สึกที่บอกอีกอย่าง — คุณอาจอธิบายตัวเองให้คนอื่นฟังยาก" },
      { pole: "S", lineThai: "การอยู่กับสิ่งที่จับต้องได้ดึงให้ลงมือ แต่โลกข้างในเรียกให้กลับไปอยู่กับมันก่อน" },
    ],
  },
  5: {
    amplifies: [
      { pole: "I", lineThai: "การชาร์จพลังจากการอยู่คนเดียวทำให้พื้นที่ที่ลักษณ์ 5 ต้องการเป็นเรื่องธรรมชาติ" },
      { pole: "T", lineThai: "การตัดจากเหตุผลเข้ากับการแยกความคิดออกจากความรู้สึกที่คุณทำอยู่แล้ว" },
    ],
    pulls: [
      { pole: "E", lineThai: "การอยู่กับคนเติมพลังให้คุณ แต่ก็กินพลังที่ลักษณ์ 5 หวงไว้ — สองอย่างนี้ดึงกันตลอด" },
      { pole: "F", lineThai: "ความรู้สึกที่แรงจริงขัดกับนิสัยเก็บไว้วิเคราะห์ทีหลัง จึงมักรู้ตัวช้ากว่าที่เกิดขึ้นจริง" },
    ],
  },
  6: {
    amplifies: [
      { pole: "S", lineThai: "การดูจากสิ่งที่เกิดขึ้นจริงทำให้การประเมินความเสี่ยงของคุณแม่น ไม่ใช่แค่กังวลลอย ๆ" },
      { pole: "J", lineThai: "การมีแผนและลำดับให้ยึดคือสิ่งที่ทำให้ลักษณ์ 6 วางใจได้" },
    ],
    pulls: [
      { pole: "N", lineThai: "การมองความเป็นไปได้ไกล ๆ เติมเชื้อให้กับ scenario ที่ยังไม่เกิด" },
      { pole: "P", lineThai: "การเปิดทางเลือกไว้ขัดกับความอยากรู้ว่าอะไรแน่นอน — คุณอาจตัดสินใจแล้วกลับมาตรวจซ้ำ" },
    ],
  },
  7: {
    amplifies: [
      { pole: "N", lineThai: "การเห็นความเป็นไปได้คือเชื้อเพลิงของลักษณ์ 7 โดยตรง" },
      { pole: "P", lineThai: "การไม่รีบปิดทางเลือกทำให้คุณหายใจออก" },
    ],
    pulls: [
      { pole: "S", lineThai: "การอยู่กับรายละเอียดตรงหน้าดึงให้อยู่กับที่ ซึ่งเป็นสิ่งที่ลักษณ์ 7 หลบ" },
      { pole: "J", lineThai: "การอยากปิดให้จบขัดกับการอยากเปิดไว้ — คุณอาจรู้สึกอึดอัดกับแผนของตัวเอง" },
    ],
  },
  8: {
    amplifies: [
      { pole: "T", lineThai: "การตัดจากเหตุผลทำให้คุณตัดสินใจได้เร็วและรับผลเองโดยไม่ลังเล" },
      { pole: "E", lineThai: "การออกไปหาคนและสถานการณ์ตรง ๆ เข้ากับการลงมือของลักษณ์ 8" },
    ],
    pulls: [
      { pole: "F", lineThai: "ความใส่ใจความรู้สึกคนขัดกับการพูดตรง — คุณอาจกลืนไว้แล้วออกมาแรงกว่าเดิมทีหลัง" },
      { pole: "I", lineThai: "การต้องการเวลาส่วนตัวขัดกับภาพคนที่ต้องอยู่ข้างหน้าเสมอ" },
    ],
  },
  9: {
    amplifies: [
      { pole: "F", lineThai: "การให้น้ำหนักกับความรู้สึกคนคือวิธีที่คุณรักษาความกลมกลืนไว้ได้จริง" },
      { pole: "P", lineThai: "การไม่รีบปิดเรื่องทำให้คุณอยู่กับความไม่ลงตัวได้โดยไม่ระเบิด" },
    ],
    pulls: [
      { pole: "T", lineThai: "การตัดจากเหตุผลบอกให้พูดออกไป แต่ลักษณ์ 9 บอกว่าเดี๋ยวจะขัดแย้ง" },
      { pole: "J", lineThai: "การอยากให้เรื่องจบขัดกับการยอมให้มันค้าง — คุณอาจตัดสินใจแล้วรู้สึกไม่สบายใจกับมัน" },
    ],
  },
};

const POLE_LABELS: Partial<Record<MbtiPole, string>> = {
  I: "I · เก็บพลังจากข้างใน", E: "E · เก็บพลังจากข้างนอก",
  S: "S · อยู่กับสิ่งที่จับต้องได้", N: "N · มองความเป็นไปได้",
  T: "T · ตัดจากเหตุผล", F: "F · ตัดจากความรู้สึก",
  J: "J · ชอบปิดให้จบ", P: "P · ชอบเปิดไว้ก่อน",
};

/**
 * The readings that apply to this person: only the poles their MBTI type actually has.
 *
 * Returns null when the MBTI type is ambiguous, because a cross-reading against a type we did not
 * resolve would be a claim built on a coin flip.
 */
export function crossReading(core: EnneagramCore, mbtiType: MbtiType | null): {
  amplifies: readonly (PoleReading & { label: string })[];
  pulls: readonly (PoleReading & { label: string })[];
} | null {
  if (mbtiType === null) return null;
  const letters = new Set(mbtiType.slice(0, 4).split("") as MbtiPole[]);
  const held = (readings: readonly PoleReading[]) => readings
    .filter((reading) => letters.has(reading.pole))
    .map((reading) => ({ ...reading, label: POLE_LABELS[reading.pole] ?? reading.pole }));
  const reading = CROSS_READINGS[core];
  const amplifies = held(reading.amplifies);
  const pulls = held(reading.pulls);
  if (!amplifies.length && !pulls.length) return null;
  return { amplifies, pulls };
}

export { CROSS_READINGS };

/**
 * One short line per source, for the tension map: what that voice is asking for, in its own words.
 *
 * Separate from the readings above because they do different jobs. A reading explains a
 * relationship in a sentence; a voice is what you would hear if that part of you spoke first. The
 * reference tool's version of this is the single most striking thing on its result page -- six
 * lines, each a different part of the person wanting something different -- and it works because
 * every line is short enough to hear as a voice rather than read as a description.
 */
export const CORE_VOICES: Record<EnneagramCore, string> = {
  1: "“ทำให้มันถูกก่อน แล้วค่อยว่ากัน”",
  2: "“แล้วคนอื่นล่ะ เขาไหวไหม”",
  3: "“เดินต่อ อย่าเพิ่งหยุด”",
  4: "“อย่าทำแบบที่ใครก็ทำได้”",
  5: "“ขอเข้าใจมันก่อน”",
  6: "“ถ้ามันพลาดขึ้นมาล่ะ”",
  7: "“ยังมีทางอื่นอีกนะ”",
  8: "“เรื่องนี้เราตัดสินเอง”",
  9: "“อย่าเพิ่งเลย เดี๋ยวขัดแย้ง”",
};

export const POLE_VOICES: Partial<Record<MbtiPole, string>> = {
  I: "“ขอเวลาอยู่กับตัวเองก่อน”",
  E: "“ออกไปคุยกับคนเลยดีกว่า”",
  S: "“เอาที่เห็นตรงหน้าก่อน”",
  N: "“มันน่าจะมีอะไรมากกว่านี้”",
  T: "“เหตุผลมันบอกอย่างนี้”",
  F: "“แต่มันรู้สึกไม่ใช่”",
  J: "“ปิดให้จบเถอะ”",
  P: "“ยังไม่ต้องรีบตัดสิน”",
};

/** The wing's line — what it adds on top of the core, not a type of its own. */
export const WING_VOICES: Record<EnneagramCore, string> = {
  1: "“แต่ต้องได้มาตรฐานด้วยนะ”",
  2: "“แต่อย่าลืมคนที่เกี่ยวข้อง”",
  3: "“แต่ต้องเห็นผลด้วย”",
  4: "“แต่ต้องเป็นแบบเราด้วย”",
  5: "“แต่ขอข้อมูลอีกหน่อย”",
  6: "“แต่เผื่อทางไว้ด้วย”",
  7: "“แต่อย่าปิดทางเลือกหมด”",
  8: "“แต่อย่าให้ใครมากำหนด”",
  9: "“แต่อย่าให้เสียบรรยากาศ”",
};
