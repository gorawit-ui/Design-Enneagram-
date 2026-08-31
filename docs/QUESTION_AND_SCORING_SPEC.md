# Question Bank and Scoring Specification

## Current state

โครงการ greenfield นี้ยังไม่มี question bank หรือ scoring implementation เอกสารนี้จึงเป็น normative contract ตั้งแต่ต้น โดยกำหนดชัดว่า Wing tie ต้องไม่ default ไปด้านซ้าย และ implementation ในอนาคตต้องมี regression test ยืนยันพฤติกรรมดังกล่าว

## Proposed design

### Fixed blueprint: 24 slots

| Slots | Count | Purpose |
|---|---:|---|
| 1–8 | 8 | MBTI Foundation: I/E, S/N, T/F, J/P แกนละ 2 |
| 9–18 | 10 | Enneagram Foundation: Gut/Heart/Head และแรงขับ 1–9; อย่างน้อยหนึ่งข้ออาจวัด contrast ที่ผ่าน review |
| 19–24 | 6 | MBTI Adaptive 2 + Core Challenge 2 + Wing Challenge 2; ลำดับภายในปรับได้ตาม dependency |

ทุกคนมี 24 คำตอบ แต่ challenge IDs ต่างกันได้ ห้าม AI แต่ง item runtime

### Question schema

แต่ละ item ควรมี `id`, `version`, `locale`, `status: approved`, `phase`, `purpose`, `prompt`, `responseScaleId`, `scoringWeights`, `targets`, `contrastPair`, `center`, `difficulty/discriminationTag`, `readingLevel`, `estimatedSeconds`, `exclusionTags`, `reviewEvidence`, `contentHash` และ optional `reverseKeyed` ห้าม metadata เผย type อย่างเด่นชัดต่อ client UI

ตัวอย่างเชิงสัญญา (ไม่ใช่ production item):

```json
{
  "id": "mbti-ie-challenge-001",
  "version": 1,
  "status": "approved",
  "phase": "adaptive",
  "purpose": "mbti_axis_challenge",
  "targets": ["IE"],
  "responseScaleId": "agreement_5",
  "scoringWeights": {"I": 1, "E": -1},
  "estimatedSeconds": 18
}
```

Item-writing rules: หนึ่งสถานการณ์/หนึ่งแนวคิด, ภาษาไม่ชี้นำ/ไม่ตัดสิน, หลีกเลี่ยงงานเฉพาะตำแหน่ง เพศ เชื้อชาติ สุขภาพ และศัพท์ type, สมดุล keyed direction/order, อ่านบนมือถือสั้น, มี “ช่วงเวลา/บริบททั่วไป” ที่สอดคล้อง และผ่าน translation/back-translation

### MBTI scoring

- เก็บ 4 signed axis scores แยกกัน: `IE`, `SN`, `TF`, `JP`; response ที่ center เป็น 0 ตาม scale contract
- `signedScore(axis) = Σ(responseValue × keyedWeight)`; normalize ด้วย maximum possible evidence ที่ตอบจริง
- letter มาจาก sign เท่านั้นเมื่อ `abs(normalizedScore)` และ evidence coverage ผ่าน threshold; tie/ต่ำกว่า threshold เป็น `X` ใน structured representation พร้อม alternatives (UI อาจแสดง `E/I ยังไม่ชัด`)
- axis margin = normalized absolute distance จาก midpoint; axis confidence มาจาก calibrated function ของ margin, consistency และ coverage
- overall confidence ห้ามเป็นค่าเฉลี่ยที่กลบแกนอ่อน; baseline ที่เสนอคือ minimum ของ 4 calibrated axis confidences หรือสูตรที่ validation อนุมัติ
- MBTI challenge สองข้อเล็ง axis ที่ margin ต่ำสุด; tie ใช้ stable priority + coverage/exposure ไม่ใช้สุ่มแบบทำซ้ำไม่ได้

### Enneagram core scoring

- เก็บ vector `typeScore[1..9]` แยกจาก MBTI; weights สะท้อน motivation ไม่ใช่พฤติกรรมผิวเผิน
- normalize ต่อ type ตาม available/max evidence เพื่อไม่ให้ type ที่มี item มากกว่าได้เปรียบ
- rank top three อย่าง stable; `topTwoMargin = normalizedTop1 - normalizedTop2`
- core challenge สองข้อ contrast top 2–3 candidates โดย metadata ที่ approved; หลังคำตอบ recompute ทั้ง vector
- Core ชัดเมื่อ evidence coverage, top-two margin และ consistency ผ่าน calibrated thresholds; ไม่ผ่านคืน `ambiguous` + top alternatives โดยไม่บังคับ core

### Wing rules (normative)

ฟังก์ชัน adjacency แบบวงกลม:

```text
adjacent(1) = [9, 2]
adjacent(n) = [n-1, n+1] for n=2..8
adjacent(9) = [8, 1]
```

- ประเมิน wing ได้เมื่อมี provisional/final core; challenge สองข้อเปรียบเทียบเฉพาะ adjacent pair
- wing evidence แยกจาก core evidence; ห้ามเลือก stress/growth line หรือ tritype
- ถ้า left score > right score และผ่าน threshold → left; right > left → right
- ถ้าเท่ากัน, margin ต่ำ, evidence ไม่พอ หรือ core ambiguous → `wing.status = ambiguous`, `wing.value = null`, `alternatives = adjacent(core)`; **ห้าม default left**
- ผลเช่น `7w6` valid เฉพาะ core 7 และ wing 6/8; validator ปฏิเสธค่าอื่น

### Confidence output

```json
{
  "mbti": {"label": "ENFP", "overallConfidence": 0.71, "axes": {"IE": {"confidence": 0.76}}},
  "enneagram": {"core": {"value": 7, "confidence": 0.68, "alternatives": [6]}, "wing": {"value": 6, "confidence": 0.55, "status": "tentative", "alternatives": [8]}}
}
```

ตัวเลขเป็นตัวอย่าง schema ไม่ใช่ threshold จริง Labels ที่เสนอ: `clear`, `tentative`, `ambiguous`; UI ใช้ “ค่อนข้างชัด / มีแนวโน้ม / ยังไม่ชัด” และไม่ใช้ “ยืนยัน 100%”

### Adaptive selection rules

- maintain sets `answered`, `selected`, `eligible`; filter duplicates ก่อน rank และ assert หลังเลือก
- quota ledger บังคับ MBTI/Core/Wing อย่างละ 2 เมื่อครบ 24
- MBTI target = least confident axis; core target = best approved contrast among top three; wing target = exact adjacent pair ของ current core
- deterministic tie-break: fit, information tag, exposure count, lexical ID
- AI ได้เพียงเลือกจาก eligible IDs; invalid/duplicate/timeout fallback deterministic

### Automated test matrix

| Area | Required cases |
|---|---|
| Wing adjacency | core 1→9/2, 2..8→neighbors, 9→8/1; reject non-neighbor |
| Wing tie | equal scores/margin below threshold returns null + ambiguous, never left default |
| MBTI axes | positive/negative/zero, reverse-key, normalization, weakest-axis tie, overall confidence |
| Adaptive | least-clear axis, top-2/3 contrast, wing pair, stable tie-break, no duplicate, quotas |
| Limit | exactly 24, cannot select/answer 25, edits preserve invariant |
| AI fallback | timeout, unavailable, malformed schema, invented/duplicate ID, exhausted call budget |
| Ambiguity | MBTI axis tie, Core tie/low evidence, Wing tie/core ambiguous, alternatives/copy |
| Versioning | replay same inputs gives same result; incompatible bank/session rejected/migrated |

Property-based tests ควรสุ่ม core 1–9 เพื่อพิสูจน์ wing adjacency และสุ่ม state เพื่อพิสูจน์ uniqueness/`count <= 24`; golden fixtures ใช้ตรวจ backward compatibility ของ scoring version

## Assumptions

- response scale และ weights จะถูก validate; ข้อความตัวอย่างข้างต้นไม่ใช่ item พร้อมใช้
- confidence ต้อง calibrate จาก pilot ไม่ใช่ตั้งตามความรู้สึก
- foundation coverage 10 ข้อสำหรับ 9 types ต้องพึ่ง multi-target items อย่างระมัดระวัง

## Risks

- เพียง 24 ข้ออาจให้ confidence ต่ำ โดยเฉพาะ 9-type core/wing; UX ต้องยอมรับ ambiguity
- multi-target items ทำให้ construct contamination และคะแนนสัมพันธ์เทียม
- adaptive reuse/exposure ทำให้คนแชร์คำถามและเกิด bias
- forced quotas อาจเลือก wing ก่อน core เสถียร

## Open questions

- response scale, missing-answer policy และ threshold/calibration dataset?
- น้ำหนัก foundation ต่อ challenge เท่ากันหรือไม่ และจะป้องกัน overfitting อย่างไร?
- ลำดับ 8 MBTI + 10 Enneagram ต้องคงที่หรือ interleave เพื่อลด priming?
- เมื่อ core ambiguous มากจน wing ไม่มีความหมาย จะใช้ 2 wing slots เป็น adjacent comparisons ของ provisional top1 แล้วรายงาน ambiguity หรือไม่?

## Acceptance criteria

- bank schema/version/approval และ exactly 8+10+2+2+2 coverage ถูก validate ใน CI
- MBTI/Enneagram score namespaces แยกขาด; replay deterministic
- wing validator บังคับ adjacency และ tie คืน null/ambiguous
- duplicate/limit/AI fallback/ambiguity tests ผ่าน รวม property tests
- threshold ทุกค่ามี owner, rationale และ pilot evidence ก่อน production

## Expert review required

- MBTI expert/psychometrician: item keys, construct purity, scoring direction, axis/overall confidence
- Enneagram expert: motivation coverage, contrast pairs, core-vs-wing evidence และ adjacency copy
- Thai linguist/DEI reviewer: translation equivalence, stereotypes, readability และ response bias
