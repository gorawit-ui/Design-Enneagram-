# Assessment Architecture

## Current state

โครงการนี้เป็น greenfield web-first และยังไม่มี production architecture, source application หรือ data schema เอกสารนี้กำหนด target contract สำหรับ review เท่านั้น โดยเสนอให้ implement ด้วย Next.js + TypeScript หลังได้รับอนุมัติ

## Proposed design

### Components และ trust boundaries

- **Assessment UI**: render approved items, input, navigation, local resume cache
- **Session Orchestrator**: state machine และ invariant 18+6=24
- **Question Bank**: immutable/versioned approved items + metadata; ไม่มี runtime generation
- **Scoring Engine**: pure/versioned functions; authority ของ scores, margins, candidates, confidence
- **Adaptive Selector**: deterministic ranking; optional AI adapter เลือกจาก allowlist
- **Result Composer**: immediate structured result; optional Narrative Service แยกต่างหาก
- **Session Store**: encrypted state, optimistic concurrency/idempotency
- **Facilitator Aggregate**: consent-aware derived dataset ไม่อ่าน raw answer โดย default

### State machine

`INTRO → CONSENTED → FOUNDATION(0..18) → PLAN_A → ADAPTIVE(19..21) → PLAN_B → ADAPTIVE(22..24) → SCORED → RESULT`

Invariant:

- `answeredUnique <= 24`; transition ไป `RESULT` เฉพาะ `answeredUnique == 24`
- slots 1–18 มาจาก fixed ordered foundation set; 19–24 มาจาก eligible challenge pool
- selected ID ต้องไม่อยู่ใน answered/selected IDs และต้องตรง phase/purpose
- plan A จอง 3 slots; plan B ประเมินใหม่และจอง 3 slotsสุดท้าย
- edit foundation/adaptive ก่อนหน้า increment `revision`; recompute score และ rebuild adaptive suffix ที่ยังไม่ตอบ หากคำตอบที่แก้ทำให้ item ที่ตอบแล้วไม่เหมาะสม ให้เก็บ audit event และใช้คำตอบเดิมโดยไม่เพิ่มจำนวน หรือเริ่ม adaptive suffix ใหม่ตาม UX policy ที่ทีมอนุมัติ—ห้ามเกิน 24

### Structured state contract (illustrative)

```json
{
  "schemaVersion": 1,
  "bankVersion": "2026-xx",
  "algorithmVersion": "1.0.0",
  "sessionId": "opaque-id",
  "slot": 18,
  "mbti": {
    "axes": {"IE": {"signedScore": -2, "margin": 0.2, "confidence": 0.54}},
    "weakestAxis": "IE"
  },
  "enneagram": {
    "topThree": [{"type": 7, "score": 4.2}],
    "topTwoMargin": 0.3,
    "coreConfidence": 0.48
  },
  "answeredQuestionIds": ["..."],
  "eligibleQuestionIds": ["..."],
  "remainingSlots": 6,
  "aiCallsUsed": 0
}
```

ไม่ส่ง response text, PII หรือ conversation history หาก selector ต้องการเพียง score summary; อาจส่ง metadata ของ eligible items (ID, target, discrimination tag) แต่ไม่เปิดให้ AI สร้าง ID/text ใหม่

### Deterministic selector

1. validate state/bank/version
2. คำนวณ uncertainty priority: MBTI axis margin ต่ำสุด; Enneagram top candidate margin ต่ำ; wing eligibility หลัง core provisional
3. filter: phase, target, locale, approved, not answered/selected, exposure constraints
4. rank ด้วย tuple ที่ stable เช่น `purpose fit → expected information gain → under-exposure → questionId`
5. สำหรับ slots 19–21 จัด coverage ตาม quota ที่ยังขาด; slots 22–24 ใช้คะแนนล่าสุด แต่ final composition ต้องครบ MBTI challenge 2, core challenge 2, wing challenge 2
6. หาก pool ไม่พอ ใช้ reviewed fallback IDs ตาม purpose; หากยังไม่พอ fail closed พร้อม recoverable error ไม่สร้างคำถาม

### AI-assisted selector

- เรียกได้เฉพาะหลังข้อ 18, หลังข้อ 21 และ optional narrative รวมไม่เกิน `MAX_AI_CALLS_PER_SESSION = 3` (ควรแยก budget selector/narrative ให้ชัด)
- model รับ structured state + eligible allowlist และคืน schema `{selectedQuestionIds, rationaleTags}`
- server ตรวจ schema, membership, uniqueness, quota, privacy และ limit; AI ไม่มี field สำหรับ score mutation
- timeout/429/5xx/invalid ID/schema/quota → deterministic selector ทันที พร้อม telemetry ที่ไม่เก็บคำตอบดิบ
- pin model/prompt version, low randomness, audit selection outcome และมี circuit breaker

### Confidence and ambiguity pipeline

Scoring Engine คืน raw score + normalized margin + evidence coverage; Confidence Calibrator map เป็น 0–1/label จาก validation dataset แยก MBTI overall/axis, Core, Wing ไม่ใช้ model self-confidence หากต่ำกว่า reviewed threshold ให้ structured result มี `status: ambiguous`, `alternatives` และข้อความ “ยังไม่ชัด”

### Performance/resilience

- preload เฉพาะ safe next/fallback items; bank เป็น signed/versioned static payload
- local durable draft + server checkpoint หลังแต่ละคำตอบ, idempotency key `(sessionId, revision, slot)`
- immediate result ไม่ขึ้นกับ AI; service worker/offline strategy เฉพาะที่ privacy review อนุมัติ
- metrics: selection latency, fallback rate/reason, duplicate prevented, completion, duration, ambiguity, model cost; ห้าม label/type เป็น employee analytics โดยไร้ consent

### Security/abuse controls

server-side eligibility validation, authenticated facilitator RBAC, CSRF/rate limit, secrets server-only, CSP, encryption, retention jobs, audit logs และ prompt-injection resistance ด้วย enum/allowlist; question-bank admin ต้องมี approval workflow

## Assumptions

- question metadata มี discrimination/target/purpose ที่ผู้เชี่ยวชาญอนุมัติ
- scoring functions ทำซ้ำได้จาก bank + algorithm version
- network อาจล่มกลาง session จึงต้องมี deterministic capability ฝั่งที่เชื่อถือได้

## Risks

- quota 2/2/2 กับ replanning สองจุดอาจขัดกันถ้า core ยังไม่นิ่งก่อน wing
- client-only scoring เปิดทาง tampering; server-only ทำให้ offline/resume ซับซ้อน
- AI call budget ไม่ชัดว่ารวม narrative หรือเฉพาะ selection
- edit-answer semantics อาจสร้าง selection leakage หรือประสบการณ์สับสน

## Open questions

- wing questions สองข้อควรถามหลัง core challenge ทั้งคู่หรือกระจาย slots 19–24 อย่างไร?
- scoring/selection ทำ client, server หรือ shared verified module?
- AI provider, data residency, timeout, cost ceiling และ narrative call นับใน 3 calls หรือไม่?
- policy เมื่อแก้คำตอบข้อเก่าหลัง adaptive item ถูกตอบแล้ว?

## Acceptance criteria

- machine-readable state transition และ invariants บังคับ 18 foundation + 6 adaptive + hard stop 24
- deterministic selection stable, unique และครบ purpose quota
- AI output ถูก allowlist/schema validate และทุก failure fallback จบ session ได้
- score fields เปลี่ยนได้เฉพาะ Scoring Engine; immediate result ไม่รอ narrative
- session/bank/algorithm version, idempotency, privacy และ observability ถูกทดสอบ

## Expert review required

- psychometric review ของ uncertainty/information-gain proxy, thresholds และ adaptive fairness
- Enneagram review ว่าจังหวะ provisional core → wing ไม่สร้าง wing ที่ผิด adjacency
- security/privacy architecture review ของ client state, AI payload, telemetry และ facilitator aggregates
