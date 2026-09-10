import type { EnneagramCore } from "./character-system";

/**
 * The depth layer of an Enneagram result: what the type is afraid of and wants, how it looks at
 * three levels of strain, and where it moves under stress and in growth.
 *
 * Separate from character-system.ts on purpose. That module answers "what does this person's
 * character look like" -- prop, pose, colour, wing accents. This one answers "what is going on
 * inside them", and the two change for different reasons: a redesign moves a prop, a review of the
 * psychology moves a fear.
 *
 * Why it exists at all: a reference tool reviewed in docs/REFERENCE_TIM_ENNEAGRAM_TOOL.md gives a
 * respondent their fear, their desire, three health levels and two arrows, and our result page had
 * none of that -- it described one state and implied it was the person. The arrows in particular
 * are not decoration. They are what lets a result explain a contradictory answer instead of
 * averaging it away: a 5 under strain answers like a 7, and without the arrow that reads as
 * evidence for 7 rather than as a 5 under strain.
 */

/**
 * The two cycles the arrows run on. This is structure in the Enneagram model rather than a choice
 * anyone here made, so both arrows are derived from it instead of being typed out twice and left
 * to drift: stress moves forward along a cycle, growth moves back.
 */
const CYCLES: readonly (readonly EnneagramCore[])[] = [
  [1, 4, 2, 8, 5, 7],
  [3, 9, 6],
];

function arrowsFrom(cycles: readonly (readonly EnneagramCore[])[]) {
  const stress = new Map<EnneagramCore, EnneagramCore>();
  const growth = new Map<EnneagramCore, EnneagramCore>();
  for (const cycle of cycles) {
    cycle.forEach((core, index) => {
      stress.set(core, cycle[(index + 1) % cycle.length]);
      growth.set(core, cycle[(index - 1 + cycle.length) % cycle.length]);
    });
  }
  return { stress, growth };
}

const ARROWS = arrowsFrom(CYCLES);

/** Where this core moves when strain accumulates. */
export function stressArrow(core: EnneagramCore): EnneagramCore {
  const target = ARROWS.stress.get(core);
  if (target === undefined) throw new Error(`no stress arrow for core ${core}`);
  return target;
}

/** Where this core moves when it is doing well -- the direction of growth, not a better type. */
export function growthArrow(core: EnneagramCore): EnneagramCore {
  const target = ARROWS.growth.get(core);
  if (target === undefined) throw new Error(`no growth arrow for core ${core}`);
  return target;
}

export type EnneagramDepth = {
  /** The thing this type organises their life to avoid. Matches the wording used in f-e-3. */
  coreFearThai: string;
  /** The other side of the same coin: what they are reaching for. */
  coreDesireThai: string;
  /** How the type protects itself. Named plainly, never as a diagnosis. */
  defenceThai: string;
  /**
   * The same person at three levels of strain. Written as states rather than as identities --
   * "เมื่อสะสมความเครียดนานเกินไป" is something that happens to someone, and this set cannot describe
   * anybody as broken.
   */
  levels: { healthyThai: string; averageThai: string; strainedThai: string };
  /** What the stress arrow looks like from outside, and what it is useful for. */
  underStrainThai: string;
  /** What moving along the growth arrow actually asks of this type. */
  towardGrowthThai: string;
};

export const ENNEAGRAM_DEPTH: Record<EnneagramCore, EnneagramDepth> = {
  1: {
    coreFearThai: "ปล่อยให้บางอย่างผิดไปแล้วไม่ได้แก้",
    coreDesireThai: "รู้ว่าสิ่งที่ตัวเองดูแลอยู่นั้นถูกต้องจริง",
    defenceThai: "แปลงความไม่พอใจให้กลายเป็นมาตรฐานที่จับต้องได้ แทนที่จะพูดออกมาตรง ๆ",
    levels: {
      healthyThai: "รู้ว่าอะไรควรได้มาตรฐานเต็มและอะไรพอแล้ว จึงยกระดับงานของทีมได้โดยไม่ทำให้ใครรู้สึกถูกตรวจ",
      averageThai: "เห็นสิ่งที่ยังไม่เรียบร้อยก่อนคนอื่น และมักลงมือแก้เองเพราะอธิบายให้คนอื่นทำตามได้ยากกว่า",
      strainedThai: "มาตรฐานเริ่มขยับไปหาความสมบูรณ์แบบ ความหงุดหงิดถูกเก็บไว้ข้างในจนกลายเป็นน้ำเสียงที่คนรอบตัวรับรู้ได้แต่ไม่มีใครพูดถึง",
    },
    underStrainThai: "ถอยเข้าไปอยู่กับความรู้สึกว่าไม่มีใครเห็นความพยายาม และเริ่มรู้สึกว่าตัวเองแบกอยู่คนเดียว",
    towardGrowthThai: "ยอมให้บางอย่างดีพอโดยไม่ต้องสมบูรณ์ แล้วใช้พลังที่เหลือไปกับสิ่งที่สนุกจริง ๆ",
  },
  2: {
    coreFearThai: "ไม่มีใครต้องการเราจริง ๆ",
    coreDesireThai: "เป็นคนที่คนอื่นดีใจที่มีอยู่",
    defenceThai: "อ่านความต้องการของคนอื่นได้เร็วกว่าความต้องการของตัวเอง จนลืมไปว่าตัวเองต้องการอะไร",
    levels: {
      healthyThai: "ช่วยเพราะเลือกจะช่วย บอกได้ว่าตัวเองต้องการอะไร และไม่ต้องรอให้ใครเดาใจ",
      averageThai: "เห็นว่าใครกำลังลำบากก่อนคนอื่น และมักรับมาก่อนแล้วค่อยคิดว่าไหวหรือไม่",
      strainedThai: "ให้ไปมากจนเริ่มเก็บบัญชีในใจว่าใครไม่เคยตอบกลับ ความเหนื่อยออกมาเป็นการเตือนความจำเรื่องที่เคยช่วยไว้",
    },
    underStrainThai: "เปลี่ยนจากอ่อนโยนเป็นตรงและแข็งขึ้นอย่างที่คนรอบตัวไม่คาดคิด เพราะทนกับการถูกมองข้ามไม่ได้อีก",
    towardGrowthThai: "ให้เวลาตัวเองก่อนให้คนอื่น และยอมรู้ว่าตัวเองรู้สึกอะไรอยู่โดยไม่ต้องรีบแปลงเป็นการช่วยเหลือ",
  },
  3: {
    coreFearThai: "สุดท้ายไม่มีอะไรให้แสดงว่าเราทำได้",
    coreDesireThai: "รู้ว่าสิ่งที่ทำไปมีน้ำหนักจริง ไม่ใช่แค่ดูดี",
    defenceThai: "เปลี่ยนตัวเองให้เป็นเวอร์ชันที่สถานการณ์นั้นต้องการ เร็วจนแยกไม่ออกว่าอันไหนคือตัวจริง",
    levels: {
      healthyThai: "ใช้แรงขับพาทีมไปถึงเป้าโดยยังบอกได้ว่าตัวเองเหนื่อย และวัดความสำเร็จด้วยของจริงมากกว่าภาพ",
      averageThai: "อ่านได้เร็วว่าอะไรนับเป็นผลงานในที่นั้น แล้วมุ่งไปทางนั้น พักได้ยากเมื่อยังไม่มีอะไรเสร็จ",
      strainedThai: "ตารางแน่นขึ้นเรื่อย ๆ เพราะการหยุดทำให้รู้สึกว่างเปล่า และเริ่มไม่แน่ใจว่าอยากได้สิ่งนี้เองหรือแค่ควรได้",
    },
    underStrainThai: "หยุดนิ่งและปล่อยเรื่องค้างไว้ ทั้งที่ปกติเป็นคนขับเคลื่อน เพราะแรงหมดก่อนที่จะยอมพัก",
    towardGrowthThai: "ให้คนที่ไว้ใจเห็นตอนที่ยังไม่พร้อม แล้วรู้ว่าความสัมพันธ์ยังอยู่ได้โดยไม่ต้องมีผลงานค้ำ",
  },
  4: {
    coreFearThai: "ไม่เหลืออะไรที่เป็นตัวเราจริง ๆ",
    coreDesireThai: "มีที่ทางที่เป็นของตัวเองจริง ไม่ใช่ที่ยืมมา",
    defenceThai: "เปรียบเทียบตัวเองกับคนอื่นตลอด แล้วยึดสิ่งที่ต่างเอาไว้เป็นหลักว่าตัวเองมีอยู่",
    levels: {
      healthyThai: "เปลี่ยนความรู้สึกที่ลึกให้เป็นงานที่คนอื่นใช้ได้ และอยู่กับคนอื่นได้โดยไม่รู้สึกว่าต้องกลืนตัวเอง",
      averageThai: "รู้สึกไวกับบรรยากาศและกับสิ่งที่ขาดไป มีโลกข้างในที่รวยกว่าที่แสดงออกให้ใครเห็น",
      strainedThai: "ถอยเข้าไปในความรู้สึกว่าไม่มีใครเข้าถึงได้จริง และเริ่มเชื่อว่าความต่างของตัวเองคือเหตุผลที่ไม่มีที่ทาง",
    },
    underStrainThai: "หันออกไปดูแลคนอื่นและเข้าหาคนมากผิดปกติ เพราะการอยู่กับตัวเองเริ่มหนักเกินไป",
    towardGrowthThai: "ลงมือทำสิ่งที่ตั้งใจไว้ให้เสร็จโดยไม่ต้องรออารมณ์มาก่อน แล้วจะพบว่าตัวตนอยู่ในสิ่งที่ทำ ไม่ใช่ในสิ่งที่รู้สึก",
  },
  5: {
    coreFearThai: "หมดพลังจนรับมืออะไรไม่ไหว",
    coreDesireThai: "มีความเข้าใจและพื้นที่มากพอที่จะยืนด้วยตัวเองได้",
    defenceThai: "แยกความคิดออกจากความรู้สึก แล้วเก็บประสบการณ์ไว้วิเคราะห์ทีหลังแทนที่จะรู้สึกกับมันตอนนั้น",
    levels: {
      healthyThai: "นำความรู้ที่ลึกออกมาแบ่งให้คนอื่นใช้ได้โดยไม่รู้สึกหมดพลัง ความโดดเดี่ยวกลายเป็นการเลือก ไม่ใช่การหนี",
      averageThai: "สังเกตและวิเคราะห์มากกว่าจะเข้าร่วม รักษาระยะที่รู้สึกปลอดภัย และต้องการเวลาฟื้นตัวหลังอยู่กับคนเยอะ",
      strainedThai: "กักความรู้และพลังไว้จนไม่ได้ลงมือ รู้สึกว่ายังไม่พร้อมอยู่เกือบตลอด และคนรอบตัวเริ่มรู้สึกว่าถูกปิดกั้น",
    },
    underStrainThai: "กระจัดกระจาย เริ่มหลายอย่างพร้อมกันแต่ไม่จบอะไร เพราะการอยู่กับเรื่องเดียวหนักเกินกว่าจะทน",
    towardGrowthThai: "ลงมือก่อนที่จะรู้สึกว่าพร้อม แล้วให้ตัวเองมีที่ยืนด้วยการทำ ไม่ใช่ด้วยการรู้เพิ่มอีกหนึ่งชั้น",
  },
  6: {
    coreFearThai: "ถึงเวลาจริงแล้วไม่มีอะไรให้ยึด",
    coreDesireThai: "รู้ว่ามีคนและมีแผนที่พึ่งได้จริงเมื่อเรื่องพลิก",
    defenceThai: "ซ้อมสถานการณ์ที่แย่ที่สุดไว้ล่วงหน้า เพื่อไม่ให้มีอะไรมาถึงโดยไม่ทันตั้งตัว",
    levels: {
      healthyThai: "ใช้สายตาที่เห็นความเสี่ยงเพื่อทำให้ทีมกล้าเดินหน้า และตัดสินใจได้โดยไม่ต้องรอความมั่นใจร้อยเปอร์เซ็นต์",
      averageThai: "ถามคำถามที่คนอื่นยังไม่ถาม เตรียมแผนสำรองไว้เสมอ และอยากได้สัญญาณยืนยันก่อนจะลงมือ",
      strainedThai: "ตรวจซ้ำจนไม่ได้เริ่ม สลับระหว่างเชื่อคนอื่นเกินไปกับไม่เชื่อใครเลย และเหนื่อยจากการเฝ้าระวังที่ไม่ได้หยุด",
    },
    underStrainThai: "เร่งทำและไล่ผลลัพธ์ให้เห็น เพื่อให้ความกังวลมีที่ไป แม้จะยังไม่แน่ใจว่าใช่ทางหรือไม่",
    towardGrowthThai: "ยอมให้บางเรื่องผ่านไปโดยไม่ต้องเตรียมทุกทาง แล้วจะพบว่าความสงบไม่ได้มาจากการควบคุมทุกความเสี่ยง",
  },
  7: {
    coreFearThai: "ติดอยู่กับที่ ออกไปไหนไม่ได้",
    coreDesireThai: "มีชีวิตที่ยังเปิดอยู่ และได้ลงมือกับสิ่งที่อยากทำจริง",
    defenceThai: "หันไปหาสิ่งถัดไปทันทีที่สิ่งตรงหน้าเริ่มหนัก เร็วจนไม่ทันรู้ว่ากำลังเลี่ยงอะไร",
    levels: {
      healthyThai: "เลือกทางเดียวแล้วอยู่กับมันจนได้ผล โดยยังพาความเบาและความสนุกไปให้ทีมด้วย",
      averageThai: "เห็นความเป็นไปได้เร็วและเปิดทางใหม่ให้คนอื่น เริ่มได้ดีมาก แต่ช่วงกลางที่ต้องอดทนคือส่วนที่ยาก",
      strainedThai: "รับเข้ามาหลายอย่างพร้อมกันจนไม่เสร็จอะไร และเริ่มใช้ความยุ่งเป็นที่หลบจากเรื่องที่ยังไม่อยากรู้สึกกับมัน",
    },
    underStrainThai: "เข้มขึ้นและจับผิดตัวเองกับคนอื่นมากกว่าปกติ เพราะความผิดหวังต้องมีที่ลง",
    towardGrowthThai: "อยู่กับเรื่องเดียวให้ลึกจนจบ แล้วจะพบว่าความอิ่มมาจากการไปให้ถึง ไม่ใช่จากการมีทางเลือกเหลือ",
  },
  8: {
    coreFearThai: "มีคนมากำหนดชีวิตเราแทน",
    coreDesireThai: "ถือหางเสือของตัวเองไว้ และปกป้องสิ่งที่ควรได้รับการปกป้อง",
    defenceThai: "แสดงความหนักแน่นออกไปก่อน เพื่อไม่ให้ใครเห็นด้านที่กระทบได้",
    levels: {
      healthyThai: "ใช้พลังไปกับการเปิดพื้นที่ให้คนอื่นยืนได้ และให้คนที่ไว้ใจเห็นด้านที่ไม่แข็งได้จริง",
      averageThai: "ตัดสินใจเร็วและรับผลเอง พูดตรงเพราะคิดว่าตรงคือให้เกียรติ และรับไม่ค่อยได้กับการถูกจัดการ",
      strainedThai: "ควบคุมมากขึ้นเพราะไม่มั่นใจว่าใครจะรับไว้ได้ น้ำเสียงหนักขึ้นจนคนรอบตัวเริ่มไม่บอกเรื่องจริง",
    },
    underStrainThai: "ถอยออกไปเงียบและตัดการติดต่อ ไปคิดคนเดียวแทนที่จะปะทะ ซึ่งคนรอบตัวมักอ่านผิดว่าไม่สนใจ",
    towardGrowthThai: "ใช้พลังไปดูแลคนที่ต้องการมันจริง แล้วจะพบว่าการเปิดใจไม่ได้ทำให้เสียอำนาจอย่างที่กลัว",
  },
  9: {
    coreFearThai: "ความสัมพันธ์รอบตัวแตกร้าว",
    coreDesireThai: "อยู่ในที่ที่ทุกฝ่ายยังไปด้วยกันได้ และตัวเองก็ยังอยู่ในนั้น",
    defenceThai: "ลดน้ำหนักของสิ่งที่ตัวเองต้องการลง จนหาไม่เจอว่าจริง ๆ อยากอะไร",
    levels: {
      healthyThai: "บอกจุดยืนของตัวเองได้โดยยังรักษาความกลมกลืนไว้ และเป็นคนที่ทำให้หลายฝ่ายคุยกันได้จริง",
      averageThai: "เห็นจุดร่วมได้เร็วและยอมได้ง่ายเพื่อให้เรื่องเดินต่อ เลื่อนเรื่องของตัวเองไว้ท้ายเสมอ",
      strainedThai: "หลีกความขัดแย้งจนเรื่องคาไปหมด ตัวเองก็ไม่รู้ว่าอยากอะไร และความไม่พอใจออกมาเป็นการไม่ขยับ",
    },
    underStrainThai: "เริ่มกังวลและตรวจซ้ำมากกว่าปกติ มองหาสัญญาณว่าอะไรจะพลาด เพราะความสงบข้างในหายไป",
    towardGrowthThai: "พูดสิ่งที่ตัวเองต้องการออกมาก่อนที่จะถูกถาม แล้วจะพบว่าการมีจุดยืนไม่ได้ทำให้ความสัมพันธ์พัง",
  },
};
