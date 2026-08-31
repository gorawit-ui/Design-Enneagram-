# Technology Stack Decision: Greenfield Web

## Current state

`gorawit-ui/Design-Enneagram-` เป็นโครงการ web-first greenfield ที่แยกจากโครงการอื่นโดยสมบูรณ์ ปัจจุบันอยู่ใน Blueprint phase และยังไม่มี production application หรือ legacy stack ที่ต้อง migrate เอกสารนี้เสนอ stack สำหรับ review; การเริ่ม implementation ยังต้องได้รับอนุมัติจากทีม

## Proposed design

### Recommendation

**เสนอ Next.js + TypeScript เป็น production stack** สำหรับประสบการณ์ mobile web, semantic HTML/accessibility, Vercel deployment, server-side AI API, resumable session และ facilitator dashboard โดยไม่มี Flutter migration หรือ compatibility obligation

Stack boundary ที่เสนอ:

- **Next.js + TypeScript** สำหรับ responsive assessment UI และ server endpoints
- **Shared domain modules** สำหรับ pure/versioned scoring และ deterministic adaptive selection
- **Runtime schema validation** สำหรับ question bank, session state, AI response allowlist และ result contract
- **Server-only AI adapter** เพื่อป้องกัน secrets และบังคับ `MAX_AI_CALLS_PER_SESSION = 3`
- **Durable session store** ที่มี encryption, consent scope, retention และ idempotent checkpoints
- **Versioned approved question bank** พร้อม content review workflow; ไม่มี runtime question generation
- **Automated quality gates**: unit/property/golden tests, component tests, Playwright browser tests และ accessibility checks

### Why this fits the product

| Requirement | Proposed fit |
|---|---|
| Mobile-first 24-question flow | web-native responsive controls, semantic forms และ route/state control |
| 7–9 minute target / 10-minute hard limit | preload/cache approved questions, fast client transitions และ performance budgets |
| Deterministic fallback | pure TypeScript selector/scorer ใช้งานได้โดยไม่พึ่ง AI และ server verify ผลได้ |
| Immediate deterministic result | score/result contract ไม่รอ narrative request หรือ stream |
| AI-assisted selection | server endpoint รับเฉพาะ structured state และคืน approved IDs ที่ถูก validate |
| Vercel deployment | integrated application/API delivery โดยต้องตรวจ data region และ runtime limits ก่อน launch |
| Session resume | browser draft + encrypted server checkpoint ภายใต้ privacy/retention policy |
| Facilitator dashboard | semantic web tables, RBAC และ consent-aware aggregates |
| Accessibility | semantic HTML, keyboard/focus, screen-reader และ automated/manual WCAG testing |
| Testing | shared fixtures ตั้งแต่ scoring ถึง browser journey และ AI failure cases |

### Architecture and delivery gates

1. ทีม product, assessment, privacy, accessibility และ engineering sign off Blueprint
2. ล็อก JSON/domain contracts และสร้าง golden fixtures ก่อน UI implementation
3. ทำ thin vertical slice `Intro → Foundation → Adaptive → Immediate Result` ด้วย deterministic mode ก่อน
4. เพิ่ม AI-assisted selector หลัง deterministic correctness/fallback tests ผ่าน
5. เพิ่ม narrative และ facilitator aggregate เป็น optional, privacy-reviewed capabilities
6. ตรวจ 320px mobile UX, WCAG 2.2 AA, p95 latency, resume, 24-question hard stop และ AI outage ก่อน pilot

### Non-goals for this phase

- ไม่ implement หรือ scaffold production application
- ไม่เลือก database, AI provider หรือ authentication vendor ก่อน privacy/platform review
- ไม่สร้าง AI-generated runtime questions
- ไม่ให้ AI เปลี่ยน score หรือทำให้ immediate result ต้องรอ
- ไม่เปิด individual results/raw answers ให้ facilitator โดยไม่มี explicit consent

### Operational considerations

- pin Node/package versions, enforce strict TypeScript และ reproducible lockfile เมื่อเริ่ม implementation
- secrets อยู่ server-only; validate authorization/consent อีกครั้งทุก facilitator query
- client storage ต้องลดข้อมูลอ่อนไหว, มี expiry/delete path และไม่ใช้ analytics replay บนหน้าคำตอบ
- กำหนด performance budgets สำหรับ initial JavaScript, LCP/INP และ next-question latency
- version bank/algorithm/session พร้อม audit-safe telemetry ที่ไม่บันทึก raw answers โดย default
- AI timeout, 429, invalid schema/ID หรือ budget exhaustion ต้อง fallback deterministic ทันที

## Assumptions

- เป้าหมายหลักคือ mobile/desktop web ไม่ใช่ native mobile application
- ทีมยอมรับ TypeScript/React ecosystem และสามารถทำ server-side deployment ได้
- Vercel เป็น deployment candidate แต่ต้องผ่าน security, data residency, limits และ cost review
- implementation เริ่มหลัง Blueprint และ assessment-content approval เท่านั้น

## Risks

- greenfield scope creep หากสร้าง dashboard, narrative และ assessment engine พร้อมกัน
- Next.js/Vercel coupling, serverless runtime/cost และ data-residency constraints
- client/server shared logic อาจถูกเข้าใจผิดว่า client เป็น trust boundary; server ต้อง validate เสมอ
- dependency churn, bundle growth และ hydration อาจกระทบมือถือรุ่นเก่า
- local/session storage อาจเก็บ sensitive personality data เกิน retention policy

## Open questions

- roadmap, MVP date, technical owner และ capacity ของทีม?
- expected concurrency, supported browsers/devices และ offline/resume requirement?
- authentication/SSO, database, hosting region และ retention period?
- AI provider/model, selector/narrative call-budget allocation และ timeout/cost ceiling?
- facilitator dashboard MVP, minimum aggregate group size และ export policy?
- monorepo/package boundary และ deployment environments ที่ทีมต้องการ?

## Acceptance criteria

- ทีมอนุมัติ Next.js + TypeScript proposal ก่อนเริ่ม implementation
- architecture รักษา 18 foundation + 6 adaptive, hard stop 24, 7–9 minute target และ 10-minute hard limit
- deterministic flow จบ session และแสดง immediate result ได้เมื่อ AI ล่ม
- AI รับเฉพาะ structured state, เลือกจาก approved allowlist, ไม่แก้คะแนน และไม่เกิน 3 calls/session
- privacy-by-default, consent-aware facilitator access และ WCAG 2.2 AA เป็น release gates
- automated tests ครอบคลุม scoring, Wing rules, adaptive uniqueness/limit, ambiguity, resume และ AI fallback

## Expert review required

- Next.js/platform engineers: application boundaries, Vercel runtime, performance และ deployment security
- security/DPO: AI payload, consent, storage, retention, RBAC และ data residency
- accessibility specialist: semantic flow, mobile controls, screen reader, keyboard, zoom และ reduced motion
- psychometric/assessment engineers: shared scoring contracts, calibration fixtures และ adaptive correctness
