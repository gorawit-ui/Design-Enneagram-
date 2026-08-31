import type { EnneagramType, MbtiAxis, Question } from "./types.ts";

export const foundationQuestions: Question[] = [
  { id: "f-ie-1", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อเริ่มวันทำงานร่วมกับทีม", prompt: "ฉันได้พลังจากการแลกเปลี่ยนความคิดออกมาดัง ๆ กับคนรอบตัว", mbti: { IE: 1 }, targets: ["IE"] },
  { id: "f-ie-2", phase: "foundation", purpose: "mbti_foundation", context: "หลังประชุมที่มีผู้เข้าร่วมหลายคน", prompt: "ฉันอยากมีช่วงเงียบ ๆ เพื่อเรียบเรียงความคิดของตัวเอง", mbti: { IE: -1 }, targets: ["IE"] },
  { id: "f-sn-1", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อได้รับโจทย์ใหม่", prompt: "ฉันเริ่มจากข้อเท็จจริงและตัวอย่างที่จับต้องได้ก่อน", mbti: { SN: -1 }, targets: ["SN"] },
  { id: "f-sn-2", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อสำรวจโอกาสใหม่", prompt: "ฉันมองเห็นรูปแบบและความเป็นไปได้ที่ยังไม่ได้ลองได้อย่างเป็นธรรมชาติ", mbti: { SN: 1 }, targets: ["SN"] },
  { id: "f-tf-1", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อต้องตัดสินใจเรื่องยาก", prompt: "ฉันให้น้ำหนักกับหลักเหตุผลที่ใช้ได้อย่างสม่ำเสมอกับทุกคน", mbti: { TF: -1 }, targets: ["TF"] },
  { id: "f-tf-2", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อต้องตัดสินใจเรื่องยาก", prompt: "ฉันใส่ใจว่าทางเลือกนั้นส่งผลต่อความต้องการของแต่ละคนอย่างไร", mbti: { TF: 1 }, targets: ["TF"] },
  { id: "f-jp-1", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อวางแผนงานหนึ่งสัปดาห์", prompt: "ฉันสบายใจเมื่อมีข้อสรุปและลำดับงานที่ชัดเจน", mbti: { JP: -1 }, targets: ["JP"] },
  { id: "f-jp-2", phase: "foundation", purpose: "mbti_foundation", context: "เมื่อสถานการณ์ยังเปลี่ยนได้", prompt: "ฉันชอบเปิดทางเลือกไว้เพื่อปรับตามข้อมูลใหม่", mbti: { JP: 1 }, targets: ["JP"] },
  { id: "f-e-1", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อเห็นสิ่งที่ควรดีขึ้น", prompt: "ฉันรู้สึกผลักดันให้ทำสิ่งนั้นให้ถูกต้องและได้มาตรฐาน", enneagram: { 1: 1, 6: .2 } },
  { id: "f-e-2", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อคนรอบตัวต้องการความช่วยเหลือ", prompt: "ฉันมักสังเกตได้เร็วว่าควรเติมอะไรให้เขารู้สึกได้รับการดูแล", enneagram: { 2: 1, 9: .15 } },
  { id: "f-e-3", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อทีมมีเป้าหมายสำคัญ", prompt: "ฉันปรับวิธีทำงานเพื่อพาทีมไปถึงผลลัพธ์ได้อย่างมีประสิทธิภาพ", enneagram: { 3: 1, 7: .15 } },
  { id: "f-e-4", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อสร้างสิ่งที่มีความหมาย", prompt: "ฉันอยากให้งานสะท้อนความจริงใจและเอกลักษณ์ ไม่ใช่แค่ทำให้เสร็จ", enneagram: { 4: 1, 1: .15 } },
  { id: "f-e-5", phase: "foundation", purpose: "enneagram_foundation", context: "ก่อนลงมือกับเรื่องซับซ้อน", prompt: "ฉันต้องการเวลาเก็บข้อมูลและทำความเข้าใจด้วยตัวเองให้เพียงพอ", enneagram: { 5: 1, 6: .2 } },
  { id: "f-e-6", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อวางแผนเรื่องที่มีความเสี่ยง", prompt: "ฉันมองหาจุดที่อาจผิดพลาดและเตรียมทางรับมือไว้ล่วงหน้า", enneagram: { 6: 1, 1: .15 } },
  { id: "f-e-7", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อเจอข้อจำกัด", prompt: "ฉันมองหาทางเลือกใหม่ที่ทำให้ยังเดินหน้าต่อได้อย่างมีพลัง", enneagram: { 7: 1, 3: .15 } },
  { id: "f-e-8", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อสิ่งสำคัญกำลังถูกคุกคาม", prompt: "ฉันพร้อมยืนหยัดและพูดตรงเพื่อปกป้องสิ่งนั้น", enneagram: { 8: 1, 1: .15 } },
  { id: "f-e-9", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อทีมเห็นต่างกัน", prompt: "ฉันมองเห็นมุมของแต่ละฝ่ายและช่วยให้ทุกคนกลับมาเชื่อมกัน", enneagram: { 9: 1, 2: .15 } },
  { id: "f-e-balance", phase: "foundation", purpose: "enneagram_foundation", context: "เมื่อต้องรับมือความไม่แน่นอน", prompt: "ฉันกลับไปยึดสิ่งที่ไว้วางใจได้ ก่อนเลือกก้าวถัดไป", enneagram: { 6: .55, 9: .25, 1: .2 } },
];

const axisPrompts: Record<MbtiAxis, [string, string]> = {
  IE: ["ในพื้นที่ใหม่ ฉันคิดได้ชัดขึ้นเมื่อได้เริ่มคุยกับใครสักคน", "ในพื้นที่ใหม่ ฉันคิดได้ชัดขึ้นเมื่อได้สังเกตและประมวลผลเงียบ ๆ"],
  SN: ["ฉันเชื่อข้อมูลที่เห็นรายละเอียดจริงก่อนภาพคาดการณ์", "ฉันสนุกกับการเชื่อมสัญญาณเล็ก ๆ เป็นภาพอนาคต"],
  TF: ["เมื่อทีมติดขัด ฉันเริ่มจากเกณฑ์ที่เป็นเหตุเป็นผล", "เมื่อทีมติดขัด ฉันเริ่มจากสิ่งที่ช่วยให้ผู้คนเดินต่อร่วมกัน"],
  JP: ["ฉันชอบปิดประเด็นสำคัญให้ชัดก่อนเดินต่อ", "ฉันชอบรักษาความยืดหยุ่นจนเห็นข้อมูลมากพอ"],
};

export const mbtiChallenges: Question[] = (Object.keys(axisPrompts) as MbtiAxis[]).flatMap((axis) => [1, -1].map((direction, index) => ({
  id: `a-${axis.toLowerCase()}-${index + 1}`, phase: "adaptive" as const, purpose: "mbti_challenge" as const,
  context: "คำถามเจาะแกนที่ยังใกล้เคียงกัน", prompt: axisPrompts[axis][index], mbti: { [axis]: direction }, targets: [axis],
})));

export const coreChallenges: Question[] = ([1,2,3,4,5,6,7,8,9] as EnneagramType[]).map((type) => ({
  id: `a-core-${type}`, phase: "adaptive", purpose: "core_challenge", context: "เมื่อแรงกดดันเพิ่มขึ้น",
  prompt: ["ฉันพยายามรักษาความถูกต้องของสิ่งที่ทำ","ฉันพยายามรักษาความสัมพันธ์และการมีคุณค่าต่อผู้อื่น","ฉันพยายามรักษาความสามารถและการเดินหน้าไปสู่ผลลัพธ์","ฉันพยายามรักษาความเป็นตัวเองและความหมายที่แท้จริง","ฉันพยายามรักษาพื้นที่ พลัง และความเข้าใจของตัวเอง","ฉันพยายามรักษาความมั่นคงด้วยการเตรียมพร้อมและคนที่ไว้ใจได้","ฉันพยายามรักษาอิสระและมองหาความเป็นไปได้ถัดไป","ฉันพยายามรักษาอำนาจในการกำหนดทิศทางและปกป้องสิ่งสำคัญ","ฉันพยายามรักษาความสงบและความเชื่อมโยงของทุกฝ่าย"][type - 1],
  enneagram: { [type]: 1 }, targets: [type],
}));

export function adjacentWings(core: EnneagramType): [EnneagramType, EnneagramType] {
  return [core === 1 ? 9 : (core - 1) as EnneagramType, core === 9 ? 1 : (core + 1) as EnneagramType];
}

export const wingChallenges: Question[] = ([1,2,3,4,5,6,7,8,9] as EnneagramType[]).flatMap((core) => {
  const [left, right] = adjacentWings(core);
  return [
    { id: `a-wing-${core}-left`, phase: "adaptive" as const, purpose: "wing_challenge" as const, context: `เมื่อพลังหลักแบบลักษณ์ ${core} ต้องเลือกน้ำหนัก`, prompt: `ฉันเอนเข้าหาคุณภาพของลักษณ์ ${left} มากกว่า เพื่อช่วยให้เดินหน้าต่อ`, wing: { [left]: 1, [right]: -1 }, targets: [core, left, right] },
    { id: `a-wing-${core}-right`, phase: "adaptive" as const, purpose: "wing_challenge" as const, context: `เมื่อพลังหลักแบบลักษณ์ ${core} ต้องเลือกน้ำหนัก`, prompt: `ฉันเอนเข้าหาคุณภาพของลักษณ์ ${right} มากกว่า เพื่อช่วยให้เดินหน้าต่อ`, wing: { [right]: 1, [left]: -1 }, targets: [core, left, right] },
  ];
});

export const allQuestions = [...foundationQuestions, ...mbtiChallenges, ...coreChallenges, ...wingChallenges];
