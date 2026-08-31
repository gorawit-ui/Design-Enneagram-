# Product Blueprint: Hybrid MBTI × Enneagram Activity

## สถานะเอกสาร

- ระยะ: discovery / specification เท่านั้น (ยังไม่ implement)
- ค่าคงที่ผลิตภัณฑ์: `TOTAL_QUESTIONS = 24`, `FOUNDATION_QUESTIONS = 18`, `ADAPTIVE_QUESTIONS = 6`, `MAX_AI_CALLS_PER_SESSION = 3`, `WEB_TARGET_MINUTES = 8`, `WEB_HARD_LIMIT_MINUTES = 10`
- ขอบเขต: เว็บกิจกรรมในองค์กร ไม่ใช่การวินิจฉัยหรือแบบประเมิน MBTI อย่างเป็นทางการ

## Current state

`gorawit-ui/Design-Enneagram-` เป็น repository ใหม่สำหรับผลิตภัณฑ์ web-first โดยตั้งใจเริ่มต้นจากโครงว่าง ระยะนี้มีเอกสาร Blueprint เป็นฐานสำหรับ review ก่อนทีมอนุมัติ implementation และยังไม่มี production application, question bank หรือ scoring engine

## Proposed design

### Product promise และหลักการ

ผู้ใช้ตอบ 24 ข้อใน 7–9 นาที ได้ผลสองระบบที่คำนวณแยกกัน เช่น `ENFP × Enneagram 7w6` พร้อมระดับความมั่นใจและตัวเลือกใกล้เคียง Cross-framework narrative เป็นเพียงคำอธิบายประกอบ ไม่ผสมคะแนนและไม่เปลี่ยนผล

หลักการ: equal-length journey, ambiguity is valid, privacy by default, result-first/AI-later, neutral language และไม่มี type hierarchy

### User journey

1. **Intro/consent** — วัตถุประสงค์ ข้อจำกัด เวลา นโยบายข้อมูล และ consent แยกสำหรับการแชร์
2. **Foundation 1–18** — หนึ่งข้อต่อหน้าจอ, autosave, back/edit, progress แบบ “ช่วงที่ 1 จาก 3” พร้อมตัวเลข 24
3. **Adaptive 19–24** — คัดจาก approved bank; re-plan หลังข้อ 18 และหลังข้อ 21; ห้ามซ้ำ
4. **Immediate result** — local/server scoring แสดง MBTI, Core, Wing/“ยังไม่ชัด”, confidence และ alternatives ทันที
5. **Narrative enhancement** — optional AI stream ภายหลัง; label ว่า AI-generated; failure ไม่บังผล
6. **Reflection** — ปุ่ม “คำอธิบายนี้ใกล้เคียงตัวฉัน” เก็บ feedback แยกจาก score และไม่ recalibrate ลับ ๆ

### Result information hierarchy

1. disclaimer และชื่อผลลัพธ์สอง framework ที่แยกด้วย `×`
2. confidence: MBTI overall + 4 axes, Enneagram Core, Wing
3. concise strengths / watch-outs / collaboration prompts โดยใช้ภาษาความเป็นไปได้
4. nearest alternatives และเหตุผลเมื่อไม่ชัด
5. optional cross-framework narrative และ user manual prompt

### Functional boundaries

- Scoring Engine เป็น authority เดียว; AI เลือกได้เฉพาะ ID จาก approved eligible set
- ทุก session จบที่คำตอบที่ 24 เสมอ; ไม่มี question 25
- เปลี่ยนคำตอบย้อนหลังแล้วต้อง replay selection/scoring อย่าง deterministic หรือ invalidate เฉพาะ adaptive suffix อย่างโปร่งใส
- autosave หลังทุกคำตอบ, resume ได้, schema-versioned session และมีปุ่มลบข้อมูล
- facilitator เห็นเฉพาะ aggregate ที่ผ่าน threshold; raw answers และ individual result ต้องมี explicit, revocable consent

### Success measures

- completion ≥ 90%; median duration 7–9 นาที; p95 ≤ 10 นาที
- duplicate-question rate = 0; sessions เกิน 24 ข้อ = 0
- immediate-result render p95 < 1 วินาทีหลัง submit (ไม่รวม AI)
- AI outage completion เทียบ deterministic baseline = 100%
- รายงาน consent/privacy incident และ ambiguous-result rate เพื่อปรับ bank โดยผู้เชี่ยวชาญ ไม่ใช่บังคับลด ambiguity

### Privacy/data model (conceptual)

แยก `AssessmentSession` (pseudonymous ID, answers, algorithm/bank version, timestamps), `ResultSnapshot` (immutable calculated output), `Narrative` และ `SharingConsent` (scope, granted/revoked time) กำหนด retention ก่อน launch, encrypt transit/at rest, least privilege, audit access และ aggregate suppression สำหรับกลุ่มเล็ก

## Assumptions

- ผู้เข้าร่วมมีมือถือและเครือข่าย แต่ deterministic assets ถูก cache ได้
- คลังคำถามและข้อความผลลัพธ์ผ่าน psychometric/content review และรองรับภาษาไทยตามกลุ่มเป้าหมาย
- องค์กรยอมรับว่า output เป็น self-reflection ไม่ใช่ HR selection/performance signal
- การแชร์กับ facilitator เป็น opt-in จริงและไม่กระทบการเข้าร่วม

## Risks

- การเริ่ม greenfield อาจทำให้ scope ขยายหากไม่ล็อก MVP, domain contracts และ approval gates
- forced-choice/self-report bias, translation bias และ adaptive exposure อาจลด validity
- ผู้ใช้ตีความ confidence เป็นความแน่นอนทางคลินิก หรือ employer นำผลไปใช้ผิดวัตถุประสงค์
- autosave/analytics อาจเก็บข้อมูลอ่อนไหวเกินจำเป็น; group re-identification ในทีมเล็ก
- AI narrative hallucination/stereotype และ latency; ต้องมี templates, safety review และ kill switch

## Open questions

- ทีมอนุมัติ MVP scope, delivery milestones และ technical owner เมื่อใด?
- กลุ่มภาษา อายุ ภูมิภาค accessibility baseline และจำนวนผู้เข้าร่วมพร้อมกัน?
- จะใช้ response scale แบบใด และมี “ไม่แน่ใจ” หรือไม่?
- ใครเป็น data controller, retention กี่วัน, hosting region และ consent wording ใครอนุมัติ?
- minimum group size สำหรับ aggregate dashboard และ export policy?
- ต้องการ result persistence/account หรือ anonymous link-only session?

## Acceptance criteria

- journey มี 24 ข้อเท่ากันทุกคน และ hard stop ที่ 24
- scoring แยก MBTI/Enneagram; AI ไม่เขียนคะแนนและระบบจบได้เมื่อ AI ล่ม
- result ทันที แสดง confidence/ambiguity และไม่ใช้ “ยืนยัน 100%”
- back/edit, autosave, resume, no duplicate และ private-by-default ถูกระบุพร้อม test strategy
- product copy มี non-diagnostic disclaimer และห้ามใช้เพื่อคัดเลือก/ประเมินผลงาน
- ทีม product, assessment, privacy, accessibility และ engineering อนุมัติ Blueprint ก่อนเริ่ม implementation

## Expert review required

- นักจิตมิติ/ผู้เชี่ยวชาญ MBTI: construct coverage, axis independence, item balance, confidence calibration
- ผู้เชี่ยวชาญ Enneagram: motivation wording, 9-type coverage, adjacent-wing semantics และห้ามสับสนกับ lines/tritype
- DPO/Legal/HR ethics: consent, retention, aggregate anonymity และ prohibited uses
- Accessibility/Thai content reviewer: plain language, cultural bias, screen-reader และ cognitive load
