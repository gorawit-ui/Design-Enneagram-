import type { EnneagramCore } from "./character-system";

export type MbtiPole = "I" | "E" | "S" | "N" | "T" | "F" | "J" | "P" | "A" | "Turbulent";
export type ScoreWeights = { mbti?: Partial<Record<MbtiPole, number>>; enneagram?: Partial<Record<EnneagramCore, number>> };
/**
 * `hint` is a second line under the option, and it exists because a single Thai phrase averaging
 * 21 characters makes the reader guess what it means. A short label plus one line saying what
 * picking it would imply is measurably easier to answer, and it is what a reference tool reviewed
 * in docs/REFERENCE_TIM_ENNEAGRAM_TOOL.md does that we did not. Optional: the MBTI items are
 * two-pole and read clearly without one.
 */
export type AssessmentOption = { text: string; hint?: string; weights: ScoreWeights };
export type AssessmentQuestion = {
  id: string;
  kind: "foundation" | "challenge";
  context?: string;
  prompt: string;
  /**
   * Which direction an Enneagram item looks from. Only the ten foundation items carry it, and only
   * they are used to detect tension -- the adaptive challenges are selected BY the leading core, so
   * including them would amplify whatever already leads and could never disagree with it.
   *
   * "inward" asks what the respondent fears, wants, or says to themselves. "outward" asks what
   * they do, and what they want to be seen as. The two can disagree, and when they do the
   * disagreement is the finding rather than noise to average away: a type that answers inward as
   * one core and outward as another is usually showing a strategy they built to work with the
   * world, sitting on top of a different core. A reference tool named exactly this on the
   * Products Owner's own session (docs/REFERENCE_TIM_ENNEAGRAM_TOOL.md) and it was the one thing
   * this scorer had no way to express: it had `ambiguous`, meaning not enough signal, and nothing
   * for two signals that point different ways.
   */
  lens?: "inward" | "outward";
  /**
   * At least four. Four everywhere except the core-fear item, which carries one option per
   * Enneagram core: a fear question whose options cover only some of the nine forces the rest of
   * the respondents to answer about somebody else's fear, which is how cores 4 and 7 became
   * unreachable. See scripts/probe-type-reachability.mjs.
   */
  options: readonly AssessmentOption[];
  challengeFor?: { dimension?: "IE" | "SN" | "TF" | "JP" | "AT" | "AT2"; core?: EnneagramCore; wingCore?: EnneagramCore };
};

// --- keyed direction balance -------------------------------------------------------------------
// Every item is authored with its first pole first, which on its own means option position maps to
// the same pole throughout: straight-lining the first option would yield a maximally I-S-T-J-A
// profile, and arrive as a confident result rather than the low-confidence one that non-answering
// should produce. The mapping is also learnable after three or four items.
//
// These ids have their option order reversed at export. The set is DERIVED, not chosen -- run
// `npm run keying` (scripts/find-keying.mjs) to re-derive it after any change to the items. It
// searches every one-per-axis MBTI combination against every roughly-half subset of the Enneagram
// block and scores each on whether straight-lining still yields a confident answer. This set
// scores zero: answering the same option position through a whole 24-answer session returns
// "ambiguous" on both MBTI and Enneagram, where with nothing reversed it returns ISTJ-A at "clear"
// for option 1 and ENFP-T at "clear" for option 4.
//
// Hand-picking does not work here. The MBTI side balances by reversing one item per axis, but each
// Enneagram item carries four different cores plus secondary weights, so a set that flattens one
// position tilts another. Reversal is also mechanical rather than hand-authored, so an option's
// text and its weights cannot drift apart.
const REVERSED_ITEMS: ReadonlySet<string> = new Set([
  "f-ie-1", "f-sn-1", "f-tf-1", "f-jp-1",
  "f-e-1", "f-e-2", "f-e-3", "f-e-4",
  "c-sn", "c-jp", "c-at",
  "c-core-2", "c-core-4", "c-core-6", "c-core-8",
  "c-wing-1", "c-wing-3", "c-wing-5", "c-wing-7", "c-wing-9",
]);

function applyKeying(question: AssessmentQuestion): AssessmentQuestion {
  if (!REVERSED_ITEMS.has(question.id)) return question;
  return { ...question, options: [...question.options].reverse() };
}

/** True when this item's options are presented in reverse of their authored pole order. */
export function isReverseKeyed(id: string): boolean {
  return REVERSED_ITEMS.has(id);
}

const mbtiQuestion = (id: string, context: string, prompt: string, left: MbtiPole, right: MbtiPole, choices: readonly [string, string, string, string]): AssessmentQuestion => ({
  id, kind: "foundation", context, prompt,
  options: [
    { text: choices[0], weights: { mbti: { [left]: 2 } } },
    { text: choices[1], weights: { mbti: { [left]: 1 } } },
    { text: choices[2], weights: { mbti: { [right]: 1 } } },
    { text: choices[3], weights: { mbti: { [right]: 2 } } },
  ],
});

const AUTHORED_FOUNDATION: readonly AssessmentQuestion[] = [
  mbtiQuestion("f-ie-1", "เวลาคิด", "เมื่อเริ่มคิดเรื่องงาน คุณมักทำอะไรเป็นอย่างแรก?", "I", "E", ["คิดเงียบ ๆ จนเห็นคำตอบ", "เริ่มคิดเอง แล้วค่อยคุยตรวจ", "เริ่มคุย แล้วกลับมาคิดทบทวน", "คุยต่อยอดจนเห็นคำตอบ"]),
  mbtiQuestion("f-ie-2", "พลังใจ", "หลังประชุมกับคนหลายคนต่อเนื่อง คุณมักอยากทำอะไรต่อ?", "I", "E", ["พักตามลำพัง", "พักคนเดียว แล้วค่อยกลับไปหาคน", "อยู่กับคนสนิท แล้วค่อยแยกไปพัก", "ใช้เวลากับคนอื่นต่อ"]),
  mbtiQuestion("f-sn-1", "รับข้อมูล", "เมื่อเริ่มงานที่ไม่คุ้นเคย คุณอยากรู้อะไรก่อน?", "S", "N", ["เริ่มจากรายละเอียดจริง", "ดูรายละเอียด แล้วค่อยมองภาพรวม", "มองภาพรวม แล้วค่อยดูรายละเอียด", "เริ่มจากภาพรวมข้างหน้า"]),
  mbtiQuestion("f-sn-2", "มองปัญหา", "เมื่อทำความเข้าใจงานใหม่ ข้อมูลแบบใดช่วยคุณได้มากกว่า?", "S", "N", ["ใช้ตัวอย่างจริง", "ดูตัวอย่าง แล้วค่อยเชื่อมแนวคิด", "เชื่อมแนวคิด แล้วค่อยหาตัวอย่าง", "ใช้ความเชื่อมโยงของแนวคิด"]),
  mbtiQuestion("f-tf-1", "ตัดสินใจ", "เมื่อต้องเลือกระหว่างสองทางที่ดีพอกัน คุณมักยึดอะไรเป็นหลัก?", "T", "F", ["ใช้เกณฑ์เดียวกันตัดสิน", "ดูเกณฑ์ แล้วค่อยพิจารณาคน", "ดูคน แล้วค่อยตรวจเกณฑ์", "ยึดความต้องการของผู้เกี่ยวข้อง"]),
  mbtiQuestion("f-tf-2", "ความขัดแย้ง", "เมื่อคุยเรื่องงานแล้วเห็นต่าง คุณมักให้ความสำคัญกับอะไรเป็นอย่างแรก?", "T", "F", ["ทำให้เหตุผลชัดเจน", "ชี้แจงเหตุผล แล้วค่อยปรับความเข้าใจ", "รับฟังก่อน แล้วค่อยตรวจเหตุผล", "ทำให้แต่ละฝ่ายเข้าใจกัน"]),
  mbtiQuestion("f-jp-1", "จัดการเวลา", "เมื่องานยังไม่เสร็จแต่มีเส้นตายชัดเจน อะไรช่วยให้คุณเดินหน้าต่อ?", "J", "P", ["เดินหน้าตามแผน", "ใช้แผน แล้วปรับเมื่อจำเป็น", "เปิดทางปรับ แล้วค่อยวางแผน", "ปรับวิธีตามข้อมูลใหม่"]),
  mbtiQuestion("f-jp-2", "วิธีเดินหน้า", "เมื่อข้อมูลสำหรับงานยังมาไม่ครบ คุณมักเลือกแบบใด?", "J", "P", ["เดินตามทิศทางเดิม", "ยึดทางเดิม แล้วทบทวนภายหลัง", "รอข้อมูล แล้วค่อยกำหนดทาง", "เปิดทางให้เปลี่ยนทิศทาง"]),
  {
    id: "f-e-1", kind: "foundation", lens: "inward", context: "แรงขับภายใน", prompt: "เมื่อทำงานชิ้นหนึ่งเสร็จ อะไรทำให้คุณรู้สึกพอใจจากข้างในมากที่สุด?", options: [
      { text: "งานตรงตามหลักที่ยึดถือ", hint: "ทำถูกตามหลักแล้วก็พอใจ แม้จะไม่มีใครเห็น", weights: { enneagram: { 1: 2, 6: 1 } } },
      { text: "งานนั้นช่วยคนอื่นได้", hint: "รู้ว่ามีคนได้ประโยชน์จริง คือสิ่งที่ทำให้อิ่มใจ", weights: { enneagram: { 2: 2, 6: 1 } } },
      { text: "งานนั้นไปถึงเป้าหมาย", hint: "ผลที่วัดได้คือสิ่งที่ทำให้รู้สึกว่างานจบจริง", weights: { enneagram: { 3: 2, 8: 1 } } },
      { text: "งานนั้นสะท้อนความเป็นตัวเอง", hint: "อยากให้คนดูออกว่านี่เป็นงานของเรา ไม่ใช่ของใครก็ได้", weights: { enneagram: { 4: 2, 9: 1, 7: 1 } } },
    ],
  },
  {
    id: "f-e-2", kind: "foundation", lens: "outward", context: "ความมั่นคง", prompt: "เมื่อเจอความไม่แน่นอนทั่วไป อะไรช่วยให้คุณตั้งหลักได้มากที่สุด?", options: [
      { text: "มีข้อมูลให้ตรวจสอบ", hint: "ถ้ายังตรวจสอบได้ ก็ยังตั้งหลักได้", weights: { enneagram: { 5: 2, 4: 1 } } },
      { text: "มีคนหรือแผนให้อ้างอิง", hint: "อยากรู้ว่ามีอะไรรองรับอยู่ก่อนจะขยับ", weights: { enneagram: { 6: 2, 1: 1 } } },
      { text: "ยังเลือกเส้นทางอื่นได้", hint: "แค่รู้ว่ายังมีทางออกอื่น ก็เบาลงแล้ว", weights: { enneagram: { 7: 2, 5: 1 } } },
      { text: "กำหนดการตัดสินใจของตัวเองได้", hint: "ขอเป็นคนตัดสินใจเอง แล้วรับผลเอง", weights: { enneagram: { 8: 2, 3: 1 } } },
    ],
  },
  {
    // The core-fear item, and the only one with nine options.
    //
    // What it replaced asked "ในงานประจำวัน เรื่องใดรบกวนใจคุณได้มากที่สุด?" with four options carrying
    // cores 1-4. Two things were wrong with that. It measured daily irritation, where Enneagram
    // type is a fear structure -- the thing a person organises their life to avoid, not the thing
    // that annoys them on a Tuesday. And it was silent on cores 5 to 9, so five of nine
    // respondents had to answer about somebody else's worry, which is a large part of how cores 4
    // and 7 became unreachable at all (scripts/probe-type-reachability.mjs).
    //
    // Nine options is worse for the eye and better for the measurement, and this is the one item
    // where that trade is clearly worth making: it is the single most diagnostic question in the
    // block, so it is the last place to force a donation.
    //
    // Written rather than translated. The reference tool's own core-5 option reads as impostor
    // syndrome ("กลัวไม่มีความรู้ / ไม่เพียงพอ"), which a 5 does not recognise -- a 5's fear is being
    // drained and invaded until they cannot cope, which lands on that tool's core-8 option and
    // hands it evidence against 5. Here 5 is depletion and 8 is loss of authorship, and they do
    // not overlap.
    id: "f-e-3", kind: "foundation", lens: "inward", context: "สิ่งที่กลัวจริง ๆ",
    prompt: "ถ้ามองลึกลงไป อะไรคือสิ่งที่คุณไม่อยากให้เกิดขึ้นกับตัวเองที่สุด?", options: [
      { text: "ปล่อยให้บางอย่างผิดไปแล้วไม่ได้แก้", hint: "ไม่กลัวงานหนัก แต่กลัวปล่อยผ่านสิ่งที่รู้ว่าไม่ถูก", weights: { enneagram: { 1: 2 } } },
      { text: "ไม่มีใครต้องการเราจริง ๆ", hint: "กลัวว่าคนที่เราดูแลมาจะไม่ได้ต้องการเราตั้งแต่แรก", weights: { enneagram: { 2: 2 } } },
      { text: "สุดท้ายไม่มีอะไรให้แสดงว่าเราทำได้", hint: "กลัวว่าที่ทุ่มไปทั้งหมดสุดท้ายไม่นับเป็นอะไรเลย", weights: { enneagram: { 3: 2 } } },
      { text: "ไม่เหลืออะไรที่เป็นตัวเราจริง ๆ", hint: "กลัวกลืนไปกับคนอื่นจนไม่รู้ว่าตัวเองคือใคร", weights: { enneagram: { 4: 2 } } },
      { text: "หมดพลังจนรับมืออะไรไม่ไหว", hint: "กลัวถูกดึงเวลาและพลังไปจนไม่เหลือพื้นที่ของตัวเอง", weights: { enneagram: { 5: 2 } } },
      { text: "ถึงเวลาจริงแล้วไม่มีอะไรให้ยึด", hint: "กลัวว่าตอนเรื่องพลิก จะไม่มีคนหรือแผนที่ไว้ใจได้", weights: { enneagram: { 6: 2 } } },
      { text: "ติดอยู่กับที่ ออกไปไหนไม่ได้", hint: "กลัวถูกปิดทางเลือกจนชีวิตเหลือทางเดียว", weights: { enneagram: { 7: 2 } } },
      { text: "มีคนมากำหนดชีวิตเราแทน", hint: "กลัวเสียสิทธิ์ตัดสินใจเรื่องของตัวเองให้คนอื่น", weights: { enneagram: { 8: 2 } } },
      { text: "ความสัมพันธ์รอบตัวแตกร้าว", hint: "กลัวต้องอยู่ท่ามกลางความขัดแย้งที่ไม่มีวันจบ", weights: { enneagram: { 9: 2 } } },
    ],
  },
  {
    id: "f-e-4", kind: "foundation", lens: "outward", context: "สิ่งที่ต้องการ", prompt: "เมื่อสถานการณ์ไม่แน่นอน คุณต้องการสิ่งใดก่อนเพื่อให้พร้อมรับมือ?", options: [
      { text: "ข้อมูลสำหรับทำความเข้าใจ", hint: "ยังไม่ขยับจนกว่าจะเห็นภาพว่าเกิดอะไรขึ้น", weights: { enneagram: { 5: 2 } } },
      { text: "แผนที่ใช้อ้างอิงได้", hint: "อยากมีอะไรให้กลับมาดูได้เมื่อเรื่องเปลี่ยน", weights: { enneagram: { 6: 2 } } },
      { text: "ทางเลือกที่ยังเปิดอยู่", hint: "ไม่อยากถูกล็อกไว้กับทางเดียวเร็วเกินไป", weights: { enneagram: { 7: 2 } } },
      { text: "สิทธิ์กำหนดทางของตัวเอง", hint: "ขอเป็นคนเลือกว่าจะเดินทางไหน ไม่ใช่ถูกจัดให้", weights: { enneagram: { 8: 2, 4: 1 } } },
    ],
  },
  {
    id: "f-e-5", kind: "foundation", lens: "outward", context: "เวลาตึงเครียด", prompt: "เมื่อเจอแรงกดดันในงาน ปฏิกิริยาแรกของคุณมักเป็นแบบใด?", options: [
      { text: "จัดสิ่งต่าง ๆ ให้เป็นระเบียบ", hint: "เริ่มจากทำให้ตรงหน้าเป็นระเบียบก่อน", weights: { enneagram: { 1: 2, 3: 1 } } },
      { text: "เข้าไปดูแลคนที่เกี่ยวข้อง", hint: "ห่วงว่าคนรอบตัวจะรับไหวหรือเปล่าก่อนห่วงงาน", weights: { enneagram: { 2: 2, 9: 1 } } },
      { text: "เร่งทำให้เห็นผลลัพธ์", hint: "ขยับเร็วขึ้นแล้วทำให้เห็นผลเป็นทางออก", weights: { enneagram: { 3: 2, 8: 1 } } },
      { text: "ถอยมารวบรวมข้อมูล", hint: "ถอยออกมาหนึ่งก้าวเพื่อดูให้ครบก่อนตอบ", weights: { enneagram: { 5: 2, 6: 1 } } },
    ],
  },
  {
    // The inner-voice item, and the second of the two with nine options.
    //
    // What it replaced asked "เมื่อกังวลเรื่องงาน อะไรช่วยให้คุณผ่อนลงได้ก่อน?" and was the worst item in
    // the bank on two counts. Its four options carried cores 4, 6, 7 and 9 only, so five of nine
    // respondents had to donate their answer -- and that donation is the measured cause of 3w2
    // returning no wing at all: a core-3 respondent had nothing to pick, the answer landed on core
    // 4, and the free +2 to 4 cancelled the wing signal for 2 exactly. And it was the second of
    // two items asking about behaviour under pressure, which by the stress-arrow reasoning in
    // docs/REFERENCE_TIM_ENNEAGRAM_TOOL.md measures where a type goes when stressed rather than
    // what the type is. One such item is informative; two out of ten is a tilt.
    //
    // What replaces it is a different kind of measurement rather than a better-worded version of
    // the same one. Every other item in this block is situational -- "เมื่อ X … คุณ Y?" -- which asks
    // a respondent to predict their own behaviour. This one asks them to recognise their own
    // voice. In the reference tool that modality is what fixed the wing where six situational
    // questions had left it a coin flip, and it is the one thing that tool does which nothing here
    // did at all.
    id: "f-e-6", kind: "foundation", lens: "inward", context: "เสียงข้างในตัวเอง",
    prompt: "ประโยคไหนคล้ายเสียงที่คุณพูดกับตัวเองมากที่สุด?", options: [
      { text: "“ถ้าฉันไม่ทำให้ถูก แล้วใครจะทำ”", hint: "รู้สึกว่าตัวเองเป็นคนที่ต้องรับผิดชอบให้มันถูกต้อง", weights: { enneagram: { 1: 2 } } },
      { text: "“ฉันมักรู้ว่าใครต้องการอะไร ก่อนที่เขาจะบอก”", hint: "ความสัมพันธ์คือที่ที่เรารู้สึกว่าตัวเองมีค่า", weights: { enneagram: { 2: 2 } } },
      { text: "“ถ้าฉันหยุด ทุกอย่างก็หยุดไปด้วย”", hint: "การเดินหน้าให้เห็นผลคือสิ่งที่ยืนยันว่าเรามีค่า", weights: { enneagram: { 3: 2 } } },
      { text: "“ฉันไม่เหมือนใคร และฉันก็ไม่อยากเหมือน”", hint: "ความเป็นตัวเองสำคัญกว่าการเข้ากับที่อื่นได้พอดี", weights: { enneagram: { 4: 2 } } },
      { text: "“ให้ฉันเข้าใจมันก่อน แล้วฉันจะเข้าไป”", hint: "ความเข้าใจคือพื้นที่ที่เรารู้สึกปลอดภัย", weights: { enneagram: { 5: 2 } } },
      { text: "“ถ้าเตรียมไว้ก่อน ก็ไม่มีอะไรทำให้ตั้งตัวไม่ทัน”", hint: "การเห็นความเสี่ยงล่วงหน้าทำให้เราวางใจได้", weights: { enneagram: { 6: 2 } } },
      { text: "“ยังมีทางอื่นอีกเยอะ ไม่ต้องรีบปิดทางไหน”", hint: "การมีทางเลือกคือสิ่งที่ทำให้เราหายใจออก", weights: { enneagram: { 7: 2 } } },
      { text: "“ฉันจะไม่ปล่อยให้ใครมาตัดสินแทนฉัน”", hint: "การถือหางเสือของตัวเองเป็นเรื่องที่ต่อรองไม่ได้", weights: { enneagram: { 8: 2 } } },
      { text: "“ไม่มีอะไรคุ้มกับการทะเลาะกัน”", hint: "ความสงบที่อยู่ร่วมกันได้สำคัญกว่าการเอาชนะ", weights: { enneagram: { 9: 2 } } },
    ],
  },
  {
    id: "f-e-7", kind: "foundation", lens: "outward", context: "สิ่งที่มีความหมาย", prompt: "คำชื่นชมเรื่องใดมีความหมายกับคุณเป็นการส่วนตัวมากที่สุด?", options: [
      { text: "เป็นคนมีหลักการ", hint: "อยากถูกเชื่อว่าเราจะไม่ลดมาตรฐานลง", weights: { enneagram: { 1: 2, 6: 1 } } },
      { text: "เป็นคนใส่ใจผู้อื่น", hint: "อยากถูกจำได้ว่าเราเห็นคนอื่นจริง ๆ", weights: { enneagram: { 2: 2, 9: 1 } } },
      { text: "เป็นคนสร้างผลงานได้", hint: "อยากถูกนับว่าเป็นคนที่ทำให้เกิดขึ้นได้", weights: { enneagram: { 3: 2, 8: 1 } } },
      { text: "เป็นคนมีมุมมองเฉพาะตัว", hint: "อยากถูกมองว่าคิดในแบบที่ไม่มีใครคิด", weights: { enneagram: { 4: 2, 5: 1 } } },
    ],
  },
  {
    id: "f-e-8", kind: "foundation", lens: "inward", context: "สิ่งที่ต้องการ", prompt: "หากมีเวลาว่างจากภาระหนึ่งวัน คุณอยากได้สิ่งใดมากที่สุด?", options: [
      { text: "อยู่กับความสนใจของตัวเอง", hint: "อยากได้เวลาที่ไม่มีใครมาเรียก", weights: { enneagram: { 5: 2 } } },
      { text: "รู้ว่าสิ่งต่าง ๆ มีแผนรองรับ", hint: "พักได้จริงเมื่อรู้ว่าไม่มีอะไรค้างอยู่", weights: { enneagram: { 6: 2 } } },
      { text: "มีอิสระไปลองสิ่งใหม่", hint: "อยากใช้วันว่างไปกับอะไรที่ยังไม่เคยทำ", weights: { enneagram: { 7: 2 } } },
      { text: "ได้พักโดยไม่ต้องตามใจใคร", hint: "อยากได้วันที่ไม่ต้องปรับตัวเข้าหาใคร", weights: { enneagram: { 9: 2, 8: 1 } } },
    ],
  },
  {
    id: "f-e-9", kind: "foundation", lens: "outward", context: "เมื่อเห็นต่าง", prompt: "เมื่อทีมเห็นไม่ตรงกันในเรื่องงาน คุณอยากให้เรื่องนั้นจบลงแบบไหน?", options: [
      { text: "จบโดยไม่ต้องฝืนยอมตาม", hint: "ยอมให้เรื่องค้างไว้ ดีกว่ายอมในสิ่งที่ไม่เห็นด้วย", weights: { enneagram: { 8: 2 } } },
      { text: "จบโดยทุกฝ่ายยังทำงานร่วมกันได้", hint: "ความสัมพันธ์ที่ยังไปต่อได้ สำคัญกว่าใครถูก", weights: { enneagram: { 9: 2, 7: 1 } } },
      { text: "จบด้วยข้อสรุปที่ตรวจสอบย้อนได้", hint: "อยากให้มีข้อสรุปที่กลับมาอ้างอิงได้ทีหลัง", weights: { enneagram: { 1: 2 } } },
      { text: "จบเมื่อเข้าใจเหตุผลของทุกฝ่ายแล้ว", hint: "ยังไม่อยากปิดเรื่องถ้ายังไม่เข้าใจว่าทำไม", weights: { enneagram: { 5: 2 } } },
    ],
  },
  {
    id: "f-e-10", kind: "foundation", lens: "outward", context: "เมื่องานถูกแทรก", prompt: "เมื่อมีงานแทรกเข้ามากลางสัปดาห์ อะไรที่คุณอยากรักษาไว้มากที่สุด?", options: [
      { text: "การจัดลำดับงานของตัวเอง", hint: "ขอเป็นคนบอกว่าอะไรมาก่อน", weights: { enneagram: { 8: 2 } } },
      { text: "จังหวะการทำงานที่ไม่ถูกเร่ง", hint: "ถูกเร่งแล้วงานเสีย มากกว่าถูกเพิ่มงาน", weights: { enneagram: { 9: 2 } } },
      { text: "สิ่งที่รับปากคนอื่นไว้", hint: "รับปากไปแล้วก็ต้องได้ ไม่อยากให้ใครรอเปล่า", weights: { enneagram: { 2: 2 } } },
      { text: "ผลลัพธ์ที่ตั้งเป้าไว้", hint: "งานแทรกได้ แต่เป้าต้องไม่ขยับ", weights: { enneagram: { 3: 2 } } },
    ],
  },
] as const;
export const FOUNDATION_QUESTIONS: readonly AssessmentQuestion[] = AUTHORED_FOUNDATION.map(applyKeying);

const dimensionChallenge = (dimension: "IE" | "SN" | "TF" | "JP" | "AT" | "AT2", prompt: string, left: MbtiPole, right: MbtiPole, choices: readonly [string, string, string, string]): AssessmentQuestion => ({
  ...mbtiQuestion(`c-${dimension.toLowerCase()}`, "คำถามแยกแนวโน้ม", prompt, left, right, choices), kind: "challenge", challengeFor: { dimension },
});

const AUTHORED_DIMENSION_CHALLENGES: readonly AssessmentQuestion[] = [
  dimensionChallenge("IE", "เมื่อต้องแก้ปัญหางานภายในหนึ่งชั่วโมง คุณมักเริ่มจากอะไร?", "I", "E", ["คิดเองจนเห็นทางออก", "คิดเอง แล้วค่อยขอความเห็น", "ขอความเห็น แล้วกลับมาคิดเอง", "คุยกับคนอื่นจนเห็นทางออก"]),
  dimensionChallenge("SN", "เมื่อข้อมูลยังไม่พอ คุณมักเชื่อสิ่งใดก่อน?", "S", "N", ["ประสบการณ์ที่ตรวจสอบได้", "ตรวจหลักฐาน แล้วค่อยมองรูปแบบ", "มองรูปแบบ แล้วค่อยหาหลักฐาน", "รูปแบบที่เชื่อมโยงกัน"]),
  dimensionChallenge("TF", "เมื่อต้องตัดสินใจเรื่องงานที่กระทบหลายฝ่าย คุณมักยึดอะไรเป็นหลัก?", "T", "F", ["ใช้เกณฑ์ที่กำหนดไว้", "ตรวจเกณฑ์ แล้วค่อยดูผลต่อคน", "ดูผลต่อคน แล้วค่อยตรวจเกณฑ์", "ยึดความต้องการของผู้เกี่ยวข้อง"]),
  dimensionChallenge("JP", "ก่อนเริ่มงานที่มีเวลาจำกัด อะไรช่วยให้คุณพร้อมลงมือ?", "J", "P", ["รู้ขั้นตอนก่อนลงมือ", "วางขั้นตอน แล้วเปิดทางให้ปรับ", "เริ่มจากวิธีที่ปรับได้ แล้วค่อยวางแผน", "ลงมือโดยเปิดทางให้ปรับ"]),
  dimensionChallenge("AT", "หลังได้รับข้อเสนอแนะตามปกติ คุณมักทำอะไรกับตัวเองก่อน?", "A", "Turbulent", ["รับสาระแล้วเดินหน้าต่อ", "ทำต่อ แล้วค่อยกลับมาตรวจ", "ตรวจจุดปรับ แล้วค่อยเดินหน้าต่อ", "ทบทวนจนเห็นวิธีทำให้ดีขึ้น"]),
  // A second A/T item, and not an optional one. Once the A/T pair left the foundation block, A/T had
  // a single source -- and scoreAssessment calls an axis ambiguous below two answers, so one item
  // would have made mbti.type null for every respondent who ever finished. Both A/T items therefore
  // hold reserved adaptive slots. `c-at` is reverse-keyed and this one is not, so position bias
  // cancels on this axis the way it does on the other four.
  dimensionChallenge("AT2", "เมื่อส่งงานไปแล้วยังไม่มีใครตอบกลับ ระหว่างรอคุณมักทำอะไร?", "A", "Turbulent", ["ถือว่าเรียบร้อยจนกว่าจะมีคนบอก", "คิดว่าเรียบร้อย แต่เตรียมคำตอบเผื่อไว้", "นึกถึงจุดที่อาจถูกถาม แล้วปล่อยไว้", "กลับไปตรวจงานนั้นอีกรอบ"]),
] as const;
export const DIMENSION_CHALLENGES: readonly AssessmentQuestion[] = AUTHORED_DIMENSION_CHALLENGES.map(applyKeying);

const coreChallenge = (core: EnneagramCore, prompt: string, options: AssessmentQuestion["options"]): AssessmentQuestion => ({ id: `c-core-${core}`, kind: "challenge", context: "คำถามแยกแรงขับ", prompt, options, challengeFor: { core } });
const e = (text: string, scores: Partial<Record<EnneagramCore, number>>): AssessmentOption => ({ text, weights: { enneagram: scores } });
const AUTHORED_CORE_CHALLENGES: readonly AssessmentQuestion[] = [
  coreChallenge(1, "เมื่อพบว่างานไม่ตรงกับข้อตกลง เหตุผลหลักที่ทำให้คุณอยากแก้คืออะไร?", [e("รักษามาตรฐาน",{1:3}),e("เพิ่มความแน่นอน",{6:3}),e("พางานไปถึงเป้าหมาย",{3:3}),e("คลี่คลายความตึงเครียด",{9:3})]),
  coreChallenge(2, "เวลาช่วยเพื่อนร่วมงาน อะไรสำคัญกับคุณจากข้างในมากที่สุด?", [e("รู้สึกเชื่อมโยงกัน",{2:3}),e("ทำตามหลักที่ยึดถือ",{1:3}),e("ไปถึงเป้าหมายร่วมกัน",{3:3}),e("รักษาบรรยากาศที่สงบ",{9:3})]),
  coreChallenge(3, "เมื่อทำเป้าหมายหนึ่งสำเร็จ อะไรมีความหมายกับคุณมากที่สุด?", [e("เห็นว่าตัวเองทำได้",{3:3}),e("เห็นว่าคนสำคัญได้ประโยชน์",{2:3}),e("มีอิสระกำหนดทางต่อไป",{8:3}),e("ได้แสดงความเป็นตัวเอง",{4:3})]),
  coreChallenge(4, "เมื่อแสดงความเห็นที่ต่างจากคนอื่น คุณอยากรักษาอะไรไว้มากที่สุด?", [e("ความรู้สึกที่ตรงกับตัวเอง",{4:3}),e("เวลาสำหรับคิดด้วยตัวเอง",{5:3}),e("ผลที่งานจะสร้างได้",{3:3}),e("สิทธิ์ที่จะไม่คล้อยตาม",{9:3})]),
  coreChallenge(5, "เมื่อเรียนรู้เรื่องงานใหม่ การเข้าใจให้ลึกให้อะไรกับคุณมากที่สุด?", [e("พร้อมพึ่งพาตัวเอง",{5:3}),e("มั่นใจต่อความเสี่ยง",{6:3}),e("เห็นความหมายของเรื่องนั้น",{4:3}),e("พบสิ่งใหม่ให้สำรวจ",{7:3})]),
  coreChallenge(6, "ก่อนเจองานที่มีความไม่แน่นอน การเตรียมพร้อมตอบความต้องการใดของคุณมากที่สุด?", [e("มีแผนสำรองให้อ้างอิง",{6:3}),e("ทำตามมาตรฐานที่กำหนด",{1:3}),e("มีข้อมูลพร้อมใช้งาน",{5:3}),e("ช่วยคนอื่นได้เมื่อจำเป็น",{2:3})]),
  coreChallenge(7, "เมื่อมีทางเลือกใหม่ สิ่งใดทำให้คุณสนใจทางเลือกนั้นมากที่สุด?", [e("มีอิสระมากขึ้น",{7:3}),e("ได้เข้าใจมากขึ้น",{5:3}),e("ได้กำหนดทางด้วยตัวเอง",{8:3}),e("ได้สร้างผลลัพธ์ใหม่",{3:3})]),
  coreChallenge(8, "เมื่อต้องกำหนดขอบเขตกับคนอื่น เหตุผลใดสำคัญกับคุณมากที่สุด?", [e("รักษาสิทธิ์ตัดสินใจเอง",{8:3}),e("รักษาหลักที่ยึดถือ",{1:3}),e("รักษาทิศทางสู่เป้าหมาย",{3:3}),e("รักษาคนที่ต้องดูแล",{2:3})]),
  coreChallenge(9, "เมื่อการคุยเริ่มตึงเครียด คุณอยากให้เกิดอะไรขึ้นมากที่สุด?", [e("แต่ละฝ่ายยังเป็นตัวเองได้",{9:3}),e("กลับมาคุยตามหลักที่ชัดเจน",{1:3}),e("ความสัมพันธ์ยังเชื่อมโยงกัน",{2:3}),e("สถานการณ์กลับมาคาดการณ์ได้",{6:3})]),
];
export const CORE_CHALLENGES: readonly AssessmentQuestion[] = AUTHORED_CORE_CHALLENGES.map(applyKeying);

const WING_CHALLENGE_CONTENT: Record<EnneagramCore, { prompt: string; choices: readonly [string, string, string, string] }> = {
  1: { prompt: "เมื่ออยากรักษาความสงบและดูแลคนอื่นพร้อมกัน คุณมักทำอย่างไร?", choices: ["คลี่คลายบรรยากาศให้สงบ", "ทำให้สงบ แล้วค่อยดูแลคน", "ดูแลคน แล้วค่อยลดความตึงเครียด", "ทำให้คนรู้สึกได้รับการดูแล"] },
  2: { prompt: "เมื่อต้องรักษามาตรฐานและพางานถึงเป้าหมาย คุณมักทำอย่างไร?", choices: ["ทำให้งานตรงตามมาตรฐาน", "ตรวจมาตรฐาน แล้วค่อยเร่งผลงาน", "พางานถึงเป้า แล้วค่อยเก็บมาตรฐาน", "พางานไปถึงเป้าหมาย"] },
  3: { prompt: "เมื่อต้องดูแลคนอื่นและรักษาความเป็นตัวเอง คุณมักทำอย่างไร?", choices: ["ทำให้คนรู้สึกได้รับการดูแล", "ดูแลคน แล้วค่อยบอกความรู้สึก", "บอกความรู้สึก แล้วค่อยดูแลคน", "แสดงความรู้สึกที่ตรงกับตัวเอง"] },
  4: { prompt: "เมื่อต้องพางานถึงเป้าหมายและทำความเข้าใจข้อมูล คุณมักทำอย่างไร?", choices: ["พางานไปถึงเป้าหมาย", "เดินหน้า แล้วค่อยเก็บข้อมูล", "เก็บข้อมูล แล้วค่อยเดินหน้า", "ทำความเข้าใจข้อมูลให้ครบ"] },
  5: { prompt: "เมื่อต้องรักษาความเป็นตัวเองและเตรียมรับความเสี่ยง คุณมักทำอย่างไร?", choices: ["รักษาความรู้สึกของตัวเอง", "บอกความรู้สึก แล้วค่อยดูความเสี่ยง", "ดูความเสี่ยง แล้วค่อยบอกความรู้สึก", "เตรียมรับสิ่งที่อาจเกิดขึ้น"] },
  6: { prompt: "เมื่อต้องเข้าใจข้อมูลและเปิดรับทางเลือกใหม่ คุณมักทำอย่างไร?", choices: ["ทำความเข้าใจข้อมูลให้ครบ", "เก็บข้อมูล แล้วค่อยสำรวจทางเลือก", "สำรวจทางเลือก แล้วค่อยเก็บข้อมูล", "เปิดทางให้ได้ลองสิ่งใหม่"] },
  7: { prompt: "เมื่อต้องเตรียมรับความเสี่ยงและตัดสินใจเอง คุณมักทำอย่างไร?", choices: ["เตรียมรับสิ่งที่อาจเกิดขึ้น", "ตรวจความเสี่ยง แล้วค่อยตัดสินใจ", "ตัดสินใจ แล้วค่อยตรวจความเสี่ยง", "กำหนดทางเดินด้วยตัวเอง"] },
  8: { prompt: "เมื่อต้องเปิดรับทางเลือกและรักษาความสงบ คุณมักทำอย่างไร?", choices: ["เปิดทางให้ได้ลองสิ่งใหม่", "หาทางเลือก แล้วค่อยลดความตึงเครียด", "ทำให้สงบ แล้วค่อยหาทางเลือก", "คลี่คลายบรรยากาศให้สงบ"] },
  9: { prompt: "เมื่อต้องตัดสินใจเองและรักษามาตรฐาน คุณมักทำอย่างไร?", choices: ["กำหนดทางเดินด้วยตัวเอง", "ตัดสินใจ แล้วค่อยตรวจมาตรฐาน", "ตรวจมาตรฐาน แล้วค่อยตัดสินใจ", "ทำให้งานตรงตามมาตรฐาน"] },
};

export const WING_CHALLENGES: readonly AssessmentQuestion[] = ([1,2,3,4,5,6,7,8,9] as EnneagramCore[]).map((core): AssessmentQuestion => {
  const left = (core === 1 ? 9 : core - 1) as EnneagramCore;
  const right = (core === 9 ? 1 : core + 1) as EnneagramCore;
  const content = WING_CHALLENGE_CONTENT[core];
  return { id: `c-wing-${core}`, kind: "challenge", context: "คำถามแยกรายละเอียด", prompt: content.prompt, challengeFor: { wingCore: core }, options: [e(content.choices[0],{[left]:3}),e(content.choices[1],{[left]:2}),e(content.choices[2],{[right]:2}),e(content.choices[3],{[right]:3})] };
}).map(applyKeying);

// 18 fixed foundation items (8 MBTI across four axes, 10 Enneagram) plus a six-item adaptive
// block: the A/T challenge unconditionally, then five selected from the respondent's own answers.
export const MAX_QUESTIONS = 24;
export const ADAPTIVE_QUESTIONS = 6;
