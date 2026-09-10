export type EnneagramCore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type GenderPresentation = "female" | "male" | "neutral";
export type Identity = "A" | "T";
export type BaseMbtiType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";
export type MbtiType = `${BaseMbtiType}-${Identity}`;
export type PoseDirection = "left" | "right" | "forward";

type WingMap = {
  1: 9 | 2; 2: 1 | 3; 3: 2 | 4; 4: 3 | 5; 5: 4 | 6;
  6: 5 | 7; 7: 6 | 8; 8: 7 | 9; 9: 8 | 1;
};
export type WingFor<Core extends EnneagramCore> = WingMap[Core];
export type WingInput = EnneagramCore | null | undefined;

export type WingVisualProfile = {
  labelThai: string;
  shortDescriptionThai: string;
  visualAccent: string;
  propDetail: string;
  poseAdjustment: string;
};

export type EnneagramProfile<Core extends EnneagramCore = EnneagramCore> = {
  titleThai: string;
  shortDescriptionThai: string;
  coreColor: "#FEFDFA" | "#16362F" | "#3E6D58" | "#8BA79B" | "#333333";
  prop: string;
  poseDirection: PoseDirection;
  backgroundMotif: string;
  accessibilityDescriptionThai: string;
  leftWing: { type: WingFor<Core>; profile: WingVisualProfile };
  rightWing: { type: WingFor<Core>; profile: WingVisualProfile };
};

export type MbtiVisualProfile = {
  posture: string;
  expression: string;
  interactionStyle: string;
  visualMotif: string;
  accentDirection: string;
  accessibilityDescriptionThai: string;
};

export type IdentityModifier = {
  labelThai: string;
  lightBehavior: string;
  detailBehavior: string;
  accessibilityDescriptionThai: string;
};

export type CharacterDesignRecipe = {
  core: string;
  wing: string;
  mbtiVisualEnergy: string;
  identity: string;
  presentation: GenderPresentation;
  background: string;
  prop: string;
};

type SharedResolved<Core extends EnneagramCore> = {
  mbtiType: MbtiType;
  mbtiBaseType: BaseMbtiType;
  enneagramType: Core;
  genderPresentation: GenderPresentation;
  coreProfile: EnneagramProfile<Core>;
  mbtiVisualProfile: MbtiVisualProfile;
  identityModifier: IdentityModifier;
  assetPath: string;
  characterDesignRecipe: CharacterDesignRecipe;
};

export type ResolvedCharacterProfile<Core extends EnneagramCore = EnneagramCore> =
  | (SharedResolved<Core> & {
      wingStatus: "valid";
      wing: WingFor<Core>;
      wingProfile: WingVisualProfile;
      typeLabel: `${MbtiType} × ${Core}w${WingFor<Core>}`;
    })
  | (SharedResolved<Core> & {
      wingStatus: "ambiguous";
      wing: null;
      wingProfile: null;
      typeLabel: `${MbtiType} × ${Core}w?`;
    });

const wing = (
  labelThai: string,
  shortDescriptionThai: string,
  visualAccent: string,
  propDetail: string,
  poseAdjustment: string,
): WingVisualProfile => ({ labelThai, shortDescriptionThai, visualAccent, propDetail, poseAdjustment });

// Character System เป็น visual interpretation สำหรับงานออกแบบ ไม่ใช่การวินิจฉัยบุคลิกภาพ
// Enneagram และ MBTI เป็นกรอบสำรวจ ไม่ใช่ข้อเท็จจริงตายตัวของบุคคล
// Wing ต้องติดกับ Enneagram core เท่านั้น; เมื่อไม่ชัดเจนให้คืน ambiguous และห้ามเดา
// ห้ามใช้ mapping นี้เพื่อ stereotype บุคคลหรือผูกความสามารถ สี ท่าทาง และบุคลิกกับเพศ
export const ENNEAGRAM_PROFILES: { [Core in EnneagramCore]: EnneagramProfile<Core> } = {
  1: {
    titleThai: "ผู้พิทักษ์มาตรฐาน", shortDescriptionThai: "เปลี่ยนหลักการให้เป็นมาตรฐานที่ทีมไว้วางใจ", coreColor: "#16362F",
    prop: "สมุดมาตรฐานและตราคุณภาพ", poseDirection: "forward", backgroundMotif: "เส้นกริดเที่ยงตรง",
    accessibilityDescriptionThai: "ผู้พิทักษ์มาตรฐานยืนมั่นคงพร้อมสมุดตรวจงานและตราคุณภาพ",
    leftWing: { type: 9, profile: wing("ความสงบสมดุล", "เติมความนุ่มนวลและพื้นที่รับฟัง", "วงแหวนสมดุล", "แถบประนีประนอม", "ผ่อนหัวไหล่ลง") },
    rightWing: { type: 2, profile: wing("มาตรฐานที่ใส่ใจ", "เติมรายละเอียดที่คำนึงถึงผู้คน", "เส้นเชื่อมสัมพันธ์", "โน้ตดูแลทีม", "เอนเข้าหาทีมเล็กน้อย") },
  },
  2: {
    titleThai: "ผู้นำทางความสัมพันธ์", shortDescriptionThai: "มองเห็นความต้องการและสร้างสายสัมพันธ์ที่อบอุ่น", coreColor: "#3E6D58",
    prop: "แผนผังเครือข่ายและชุดต้อนรับ", poseDirection: "right", backgroundMotif: "วงโคจรเชื่อมถึงกัน",
    accessibilityDescriptionThai: "ผู้นำทางความสัมพันธ์เปิดแผนผังเครือข่ายด้วยท่าทีเป็นมิตร",
    leftWing: { type: 1, profile: wing("การดูแลที่มีหลัก", "เติมขอบเขตและความสม่ำเสมอ", "กริดดูแล", "รายการติดตาม", "ยืนตรงขึ้น") },
    rightWing: { type: 3, profile: wing("การดูแลที่ขับเคลื่อน", "เปลี่ยนความห่วงใยเป็นผลลัพธ์ร่วม", "ลูกศรเติบโต", "หมุดความสำเร็จทีม", "ก้าวไปด้านหน้า") },
  },
  3: {
    titleThai: "นักขับเคลื่อนเป้าหมาย", shortDescriptionThai: "จัดลำดับพลังและทรัพยากรเพื่อพาทีมถึงเป้าหมาย", coreColor: "#333333",
    prop: "กระดานเป้าหมายและหมุดบอกความคืบหน้า", poseDirection: "right", backgroundMotif: "เส้นทางสู่หมุดหมาย",
    accessibilityDescriptionThai: "นักขับเคลื่อนเป้าหมายชี้ไปยังกระดานหมุดหมายอย่างมั่นใจ",
    leftWing: { type: 2, profile: wing("ความสำเร็จร่วม", "เติมพลังสนับสนุนผู้คน", "วงกลมทีม", "การ์ดขอบคุณ", "เปิดลำตัวเข้าหาทีม") },
    rightWing: { type: 4, profile: wing("ลายเซ็นเฉพาะตัว", "เติมน้ำเสียงและวิธีเล่าที่มีเอกลักษณ์", "ริบบิ้นอิสระ", "ป้ายเรื่องราว", "เอียงศีรษะครุ่นคิด") },
  },
  4: {
    titleThai: "นักเล่าเรื่องตัวตน", shortDescriptionThai: "ถ่ายทอดความหมายผ่านมุมมองที่จริงใจและไม่ซ้ำใคร", coreColor: "#8BA79B",
    prop: "สมุดเรื่องราวและแผ่นสีอารมณ์", poseDirection: "left", backgroundMotif: "ริบบิ้นเรื่องราวซ้อนชั้น",
    accessibilityDescriptionThai: "นักเล่าเรื่องตัวตนถือสมุดและแผ่นสีหลายชั้นด้วยท่าทีครุ่นคิด",
    leftWing: { type: 3, profile: wing("เรื่องราวที่ส่งผล", "เติมพลังนำผลงานออกสู่ผู้คน", "ลำแสงเวที", "การ์ดนำเสนอ", "ยกสายตาขึ้น") },
    rightWing: { type: 5, profile: wing("ความหมายเชิงลึก", "เติมโครงสร้างและรายละเอียดทางความคิด", "ชั้นข้อมูล", "ดัชนีอ้างอิง", "ถอยมาสังเกตครึ่งก้าว") },
  },
  5: {
    titleThai: "นักทำแผนที่เชิงระบบ", shortDescriptionThai: "เชื่อมข้อมูลซับซ้อนให้เป็นแผนที่ที่เข้าใจและใช้งานได้", coreColor: "#16362F",
    prop: "แผนที่ระบบ / data tiles", poseDirection: "left", backgroundMotif: "โหนดข้อมูลและเส้นทางเชื่อมโยง",
    accessibilityDescriptionThai: "นักทำแผนที่เชิงระบบจัดแผนที่และแผ่นข้อมูล พร้อมหมุดแผนสำรอง",
    leftWing: { type: 4, profile: wing("มุมมองเฉพาะตัว", "เติมภาษาภาพและความหมายเฉพาะตัว", "ริบบิ้นความคิด", "แผ่นสีความหมาย", "เอียงเข้าหางานออกแบบ") },
    rightWing: { type: 6, profile: wing("การเตรียมพร้อมและประเมินความเสี่ยง", "เติม checklist ความเสี่ยงและแผนสำรอง", "วงแหวนเตรียมพร้อม", "หมุดความเสี่ยงและ checklist", "ยืนมั่นคงพร้อมตรวจเส้นทาง") },
  },
  6: {
    titleThai: "นักสอดแนมความเสี่ยง", shortDescriptionThai: "สำรวจความไม่แน่นอนและเตรียมทางเลือกให้ทีมมั่นใจ", coreColor: "#3E6D58",
    prop: "เข็มทิศความเสี่ยงและกระเป๋าแผนสำรอง", poseDirection: "forward", backgroundMotif: "เรดาร์และเส้นทางสำรอง",
    accessibilityDescriptionThai: "นักสอดแนมความเสี่ยงถือเข็มทิศและกระเป๋าแผนสำรองอย่างเตรียมพร้อม",
    leftWing: { type: 5, profile: wing("ฐานข้อมูลมั่นคง", "เติมการสังเกตและข้อมูลก่อนตัดสินใจ", "ชั้นข้อมูล", "แฟ้มหลักฐาน", "หยุดอ่านสัญญาณ") },
    rightWing: { type: 7, profile: wing("ทางเลือกยืดหยุ่น", "เติมเส้นทางใหม่เมื่อแผนเปลี่ยน", "ประกายทางแยก", "การ์ดทางเลือก", "พร้อมหมุนเปลี่ยนทิศ") },
  },
  7: {
    titleThai: "นักสำรวจความเป็นไปได้", shortDescriptionThai: "เปิดเส้นทางใหม่และเปลี่ยนไอเดียเป็นการทดลอง", coreColor: "#8BA79B",
    prop: "กล้องส่องทางและการ์ดไอเดีย", poseDirection: "right", backgroundMotif: "ประกายดาวและทางแยก",
    accessibilityDescriptionThai: "นักสำรวจความเป็นไปได้มองผ่านกล้องส่องทางท่ามกลางการ์ดไอเดีย",
    leftWing: { type: 6, profile: wing("สำรวจอย่างเตรียมพร้อม", "เติมจุดตรวจและทางกลับที่ปลอดภัย", "วงแหวนตรวจสอบ", "สายรัดอุปกรณ์", "หยุดเช็กเข็มทิศ") },
    rightWing: { type: 8, profile: wing("แรงบุกเบิก", "เติมความเด็ดขาดในการเปิดเส้นทาง", "เส้นพลัง", "ธงเปิดทาง", "ก้าวกว้างขึ้น") },
  },
  8: {
    titleThai: "ผู้พิทักษ์ขอบเขต", shortDescriptionThai: "สร้างพื้นที่ชัดเจน ปกป้องสิ่งสำคัญ และกล้าตัดสินใจ", coreColor: "#333333",
    prop: "โล่ขอบเขตและคทาตัดสินใจ", poseDirection: "forward", backgroundMotif: "แนวป้องกันและเส้นพลัง",
    accessibilityDescriptionThai: "ผู้พิทักษ์ขอบเขตยืนถือโล่ด้วยท่าทีอบอุ่นแต่หนักแน่น",
    leftWing: { type: 7, profile: wing("พลังเปิดทาง", "เติมความรวดเร็วและการมองเห็นโอกาส", "ประกายทางแยก", "แผนที่บุกเบิก", "โน้มไปด้านหน้า") },
    rightWing: { type: 9, profile: wing("พลังมั่นคง", "เติมความสงบหนักแน่นก่อนลงมือ", "วงแหวนสมดุล", "ฐานโล่กว้าง", "ลงน้ำหนักสมดุล") },
  },
  9: {
    titleThai: "ผู้ประสานเส้นทาง", shortDescriptionThai: "มองเห็นจุดร่วมและประสานหลายเส้นทางให้ไปด้วยกัน", coreColor: "#3E6D58",
    prop: "วงแหวนเส้นทางและเชือกประสาน", poseDirection: "left", backgroundMotif: "สายน้ำบรรจบและวงสมดุล",
    accessibilityDescriptionThai: "ผู้ประสานเส้นทางถือวงแหวนที่รวมเส้นทางหลายสายเข้าด้วยกัน",
    leftWing: { type: 8, profile: wing("แกนที่มั่นคง", "เติมพลังตั้งขอบเขตและคุ้มครองจุดร่วม", "แนวป้องกัน", "หมุดขอบเขต", "ยืนกว้างมั่นคง") },
    rightWing: { type: 1, profile: wing("ทิศทางชัดเจน", "เติมหลักการและรายละเอียดให้ทีมไปต่อ", "กริดนำทาง", "ไม้บรรทัดเส้นทาง", "ยืดแนวลำตัว") },
  },
};

const mbti = (
  posture: string, expression: string, interactionStyle: string,
  visualMotif: string, accentDirection: string, accessibilityDescriptionThai: string,
): MbtiVisualProfile => ({ posture, expression, interactionStyle, visualMotif, accentDirection, accessibilityDescriptionThai });

export const MBTI_VISUAL_PROFILES = {
  INTJ: mbti("สุขุมและตั้งแกนเป็นระบบ", "นิ่ง ชัด และมองภาพรวม", "เว้นพื้นที่คิดก่อนเชื่อมข้อมูล", "โครงข่ายเชิงกลยุทธ์", "ขึ้นขวาอย่างมีลำดับ", "พลังภาพสุขุม เป็นระบบ และมองความเชื่อมโยงระยะไกล"),
  INTP: mbti("ผ่อนคลายพร้อมทดลอง", "สงสัยใคร่รู้", "สำรวจตรรกะอย่างอิสระ", "โมดูลความคิดเปิด", "แตกแขนงรอบศูนย์กลาง", "พลังภาพครุ่นคิด ยืดหยุ่น และสำรวจโครงสร้างความคิด"),
  ENTJ: mbti("เปิดไหล่และนำทิศ", "มั่นใจตรงประเด็น", "จัดทรัพยากรสู่เป้าหมาย", "แกนบัญชาการ", "พุ่งขึ้นขวา", "พลังภาพชัดเจน มุ่งเป้าหมาย และพร้อมประสานการลงมือ"),
  ENTP: mbti("เอนหน้าอย่างกระตือรือร้น", "ตื่นตัวและขี้เล่น", "โยนไอเดียเพื่อทดสอบ", "ประกายทางเลือก", "ซิกแซ็กขึ้น", "พลังภาพคล่องตัว ช่างทดลอง และเปิดความเป็นไปได้หลายทาง"),
  INFJ: mbti("สงบนิ่งแต่เปิดรับ", "อบอุ่นและมองลึก", "เชื่อมความหมายกับผู้คน", "เส้นเรื่องระยะไกล", "โค้งเข้าหาศูนย์กลาง", "พลังภาพสงบ ลึกซึ้ง และเชื่อมภาพอนาคตกับผู้คน"),
  INFP: mbti("นุ่มนวลเป็นธรรมชาติ", "จริงใจและละเอียดอ่อน", "แบ่งปันผ่านคุณค่า", "กลีบความหมาย", "ไหลขึ้นซ้าย", "พลังภาพอ่อนโยน เป็นอิสระ และสะท้อนคุณค่าภายใน"),
  ENFJ: mbti("เปิดท่าทางต้อนรับ", "อบอุ่นและมั่นใจ", "ชวนทีมเห็นทิศทางร่วม", "วงสัมพันธ์นำทาง", "แผ่ออกจากศูนย์กลาง", "พลังภาพอบอุ่น ชัดเจน และนำพาผู้คนไปด้วยกัน"),
  ENFP: mbti("เคลื่อนไหวเปิดกว้าง", "สดใสและสนใจผู้คน", "เชื่อมไอเดียผ่านบทสนทนา", "ประกายสัมพันธ์", "กระจายขึ้นสองด้าน", "พลังภาพมีชีวิตชีวา เปิดรับ และเชื่อมผู้คนกับโอกาสใหม่"),
  ISTJ: mbti("ตั้งตรงและมั่นคง", "สงบละเอียด", "ทำตามลำดับที่เชื่อถือได้", "กริดหลักฐาน", "แนวตรงขึ้น", "พลังภาพมั่นคง เป็นขั้นตอน และใส่ใจข้อเท็จจริง"),
  ISFJ: mbti("ตั้งมั่นพร้อมดูแล", "อ่อนโยนและสังเกต", "สนับสนุนผ่านรายละเอียด", "ลายถักความทรงจำ", "โค้งประคอง", "พลังภาพอบอุ่น รอบคอบ และดูแลความต่อเนื่องของทีม"),
  ESTJ: mbti("ยืนเต็มพื้นที่", "ชัดเจนพร้อมลงมือ", "จัดระบบและกำหนดจังหวะ", "กริดปฏิบัติการ", "ตรงไปข้างหน้า", "พลังภาพมั่นคง ตรงประเด็น และขับเคลื่อนงานเป็นระบบ"),
  ESFJ: mbti("เปิดเข้าหากลุ่ม", "เป็นมิตรและใส่ใจ", "สร้างจังหวะร่วมที่ทุกคนตามได้", "วงชุมชน", "โอบเข้าศูนย์กลาง", "พลังภาพเป็นมิตร มีระเบียบ และดูแลบรรยากาศร่วม"),
  ISTP: mbti("สมดุลพร้อมขยับ", "นิ่งและสังเกตเร็ว", "แก้ปัญหาผ่านการลงมือ", "ชิ้นส่วนกลไก", "เฉียงลงสู่จุดทำงาน", "พลังภาพนิ่ง คล่องมือ และตอบสนองต่อสิ่งที่เกิดขึ้นจริง"),
  ISFP: mbti("ผ่อนคลายและรับรู้รอบตัว", "นุ่มนวลเป็นธรรมชาติ", "สื่อสารผ่านการลงมือที่จริงใจ", "พื้นผิวธรรมชาติ", "ไหลตามแนวนอน", "พลังภาพละเอียดอ่อน ยืดหยุ่น และรับรู้ความงามรอบตัว"),
  ESTP: mbti("โน้มพร้อมเคลื่อนไหว", "มั่นใจและตื่นตัว", "ทดลองกับสถานการณ์ตรงหน้า", "เส้นความเร็ว", "พุ่งเฉียงไปหน้า", "พลังภาพฉับไว มั่นใจ และเรียนรู้ผ่านการลงมือจริง"),
  ESFP: mbti("เปิดกว้างมีจังหวะ", "สดใสและเป็นกันเอง", "สร้างพลังร่วมผ่านประสบการณ์", "จังหวะวงกลม", "กระจายรอบตัว", "พลังภาพอบอุ่น สดใส และชวนผู้คนมีส่วนร่วมกับปัจจุบัน"),
} satisfies Record<BaseMbtiType, MbtiVisualProfile>;

export const IDENTITY_MODIFIERS: Record<Identity, IdentityModifier> = {
  A: {
    labelThai: "ความนิ่งและชัดเจน", lightBehavior: "แสงนิ่งสม่ำเสมอ", detailBehavior: "รูปทรงคมชัดและมีพื้นที่หายใจ",
    accessibilityDescriptionThai: "นำเสนอความมั่นใจสงบด้วยแสงที่นิ่งและชัด โดยไม่ได้หมายถึงดีกว่าแบบ T",
  },
  T: {
    labelThai: "ความละเอียดอ่อนและตอบสนอง", lightBehavior: "แสงตอบสนองเป็นชั้นละเอียด", detailBehavior: "รายละเอียดเล็กและจังหวะสะท้อนคิด",
    accessibilityDescriptionThai: "นำเสนอความไวต่อรายละเอียดด้วยแสงตอบสนอง โดยไม่ได้หมายถึงด้อยกว่าแบบ A",
  },
};

const validWings: Record<EnneagramCore, readonly EnneagramCore[]> = {
  1: [9, 2], 2: [1, 3], 3: [2, 4], 4: [3, 5], 5: [4, 6],
  6: [5, 7], 7: [6, 8], 8: [7, 9], 9: [8, 1],
};

// Core 5 visual-coherence prototypes support presentation variants; they are not personality diagnoses.
const CORE_FIVE_ASSETS: Record<GenderPresentation, string> = {
  female: "/character-assets/enneagram-5/female.png",
  male: "/character-assets/enneagram-5/male.png",
  neutral: "/character-assets/enneagram-5/neutral.png",
};

export function getCharacterProfile<Core extends EnneagramCore>(
  mbtiType: MbtiType,
  enneagramType: Core,
  wingInput: WingInput,
  genderPresentation: GenderPresentation,
): ResolvedCharacterProfile<Core> {
  const [mbtiBaseType, identity] = mbtiType.split("-") as [BaseMbtiType, Identity];
  const coreProfile = ENNEAGRAM_PROFILES[enneagramType];
  const mbtiVisualProfile = MBTI_VISUAL_PROFILES[mbtiBaseType];
  const identityModifier = IDENTITY_MODIFIERS[identity];
  const isValidWing = wingInput !== null && wingInput !== undefined && validWings[enneagramType].includes(wingInput);
  const selectedWing = isValidWing ? wingInput as WingFor<Core> : null;
  const selectedWingProfile = selectedWing === coreProfile.leftWing.type
    ? coreProfile.leftWing.profile
    : selectedWing === coreProfile.rightWing.type
      ? coreProfile.rightWing.profile
      : null;
  const wingLabel = selectedWing && selectedWingProfile ? `${enneagramType}w${selectedWing}: ${selectedWingProfile.labelThai}` : "ไม่ชัดเจน — ไม่เดา Wing";
  const recipe: CharacterDesignRecipe = {
    core: `${enneagramType} · ${coreProfile.titleThai}`,
    wing: wingLabel,
    mbtiVisualEnergy: `${mbtiBaseType} · ${mbtiVisualProfile.posture} · ${mbtiVisualProfile.expression}`,
    identity: `${identity} · ${identityModifier.labelThai}`,
    presentation: genderPresentation,
    background: coreProfile.backgroundMotif,
    prop: selectedWingProfile ? `${coreProfile.prop} + ${selectedWingProfile.propDetail}` : coreProfile.prop,
  };
  const shared: SharedResolved<Core> = {
    mbtiType, mbtiBaseType, enneagramType, genderPresentation, coreProfile, mbtiVisualProfile, identityModifier,
    // Presentation is visual only and must never affect assessment scoring or personality mappings.
    assetPath: enneagramType === 5 ? CORE_FIVE_ASSETS[genderPresentation] : "",
    characterDesignRecipe: recipe,
  };

  if (!selectedWing || !selectedWingProfile) {
    return { ...shared, wingStatus: "ambiguous", wing: null, wingProfile: null, typeLabel: `${mbtiType} × ${enneagramType}w?` };
  }

  return {
    ...shared, wingStatus: "valid", wing: selectedWing, wingProfile: selectedWingProfile,
    typeLabel: `${mbtiType} × ${enneagramType}w${selectedWing}`,
  } as ResolvedCharacterProfile<Core>;
}
