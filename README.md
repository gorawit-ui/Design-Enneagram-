# Guild Within

Deterministic vertical slice สำหรับเว็บกิจกรรมสำรวจ MBTI × Enneagram พัฒนาด้วย Next.js และ TypeScript โดยยังไม่มีการเชื่อมต่อ AI จริง

## Run locally

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000` เพื่อทดลองเส้นทาง Intro → 18 Foundation Questions → 6 Adaptive Questions → Result

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## Scope of this phase

- คำถามรวม 24 ข้อและหยุดเสมอเมื่อครบ
- deterministic adaptive selector: MBTI challenge 2, Core challenge 2 และ Wing challenge 2
- scoring แยก MBTI, Enneagram Core และ adjacent Wing
- Wing tie แสดงผลไม่ชัดเจนและไม่เลือกด้านซ้ายโดยอัตโนมัติ
- autosave ในอุปกรณ์, ย้อนกลับแก้คำตอบ และ immediate deterministic result
- ไม่มี AI call, database, authentication หรือ facilitator dashboard ในระยะนี้

เนื้อหาแบบประเมินเป็น draft สำหรับ implementation และต้องผ่านผู้เชี่ยวชาญ/การ calibration ก่อนใช้จริง ผลลัพธ์ไม่ใช่การวินิจฉัยทางจิตวิทยาหรือแบบประเมิน MBTI อย่างเป็นทางการ
