# Character Art Direction: Modern Workplace Adventure Guild

## Current state

โครงการ greenfield นี้ยังไม่มี production character assets หรือ design tokens เอกสารนี้คือ art-direction contract สำหรับ review; reference ใช้กำหนด mood, shape language และ color direction เท่านั้น ไม่ถือเป็น final production asset จนกว่าจะได้รับอนุมัติ

## Proposed design

### Creative north star

“Modern Workplace Adventure Guild” คือทีมร่วมภารกิจเชิงอุปมา บุคลิกโดยรวมต้อง calm, precise, caring, premium, collaborative, naturally playful และมี Japanese-inspired restraint ทุก type มีคุณค่าเท่าเทียม และห้ามเลียนแบบ silhouette หรือ character grammar ของ 16Personalities

ภาพเป็น low-poly geometric vector / faceted polygon, angular flat-vector และ layered paper-cut 2.5D depth ใช้รูปทรงอ่านง่ายบนมือถือ รายละเอียดไม่เกินจนกลายเป็น fantasy costume

### Semantic component system

| Layer | Encodes | Guardrail |
|---|---|---|
| Core silhouette/archetype | Enneagram core motivation 1–9 | ไม่เท่ากับอาชีพ/ลำดับชั้น; ไม่ใช้ stereotype |
| Secondary prop/detail | adjacent wing เท่านั้น | ซ่อน/neutral เมื่อ wing ยังไม่ชัด; ไม่ใช้ weapon |
| Pose/shape rhythm/energy | MBTI axes | เป็น spectrum/combinable ไม่ใช่ 16 fixed caricatures |
| Human attributes | skin, hair, body, age presentation, assistive features | curated independently from score; ห้ามผูกเพศ เชื้อชาติ อาชีพ rank หรือ perceived competence กับ type |
| Environment | shared mission/context | collaborative ไม่แข่งขันแย่งอันดับ |

Core archetype prompts ต้องอธิบาย “แรงขับ” อย่างเป็นกลาง เช่น improve, connect, achieve, understand, prepare, explore, protect, harmonize โดยผู้เชี่ยวชาญตรวจ ไม่ระบุ job title Wing props เป็น metaphor เบา ๆ เช่น connector, map layer, lens, rhythm marker; หลีกเลี่ยงดาบ เกราะ ตรา rank และเครื่องมืออาชีพตรง ๆ

### MBTI visual grammar (ไม่ตายตัว)

- I/E: inward compact focus ↔ outward open gesture โดยไม่เท่ากับ shy/loud
- S/N: grounded concrete grouping ↔ expansive pattern connections โดยไม่เท่ากับ practical/smart
- T/F: crisp structural rhythm ↔ relational flowing rhythm โดยไม่สื่อ cold/emotional
- J/P: composed directional arrangement ↔ flexible branching arrangement โดยไม่สื่อ rigid/chaotic

ใช้เป็น parameter ต่อเนื่องและผสมกัน; accessibility mode ต้องอธิบายด้วย alt text ที่ไม่เดาผลจากสี/ท่าทาง

### Brand palette และ character color rule

Palette ที่ได้รับอนุมัติได้รับแรงบันดาลใจจากเว็บไซต์ MATCHAZUKI ปัจจุบัน:

- Warm Ivory `#FEFDFA` — canvas และพื้นที่หายใจ
- Deep Matcha Green `#16362F` — primary anchor และ depth
- Muted Sage `#8BA79B` — calm supporting plane
- Mid Green `#3E6D58` — secondary structure
- Charcoal `#333333` — text และ outline

ใช้ shared TDFB/MATCHAZUKI-inspired palette ประมาณ **85–90% ของแต่ละตัวละคร** เพื่อให้ทั้ง guild เป็นระบบเดียวกัน ใช้ accent colors ปริมาณเล็กเฉพาะ props หรือรายละเอียดเสื้อชั้นในเพื่อช่วยแยกตัวละคร ห้ามกำหนดหนึ่ง type = หนึ่งสีถาวร และห้ามใช้สีเป็นช่องทางเดียวในการสื่อสถานะ; interactive text/control ต้องผ่าน WCAG 2.2 AA พร้อม reduced-motion/high-contrast states

### TDFB insignia rule

- ตัวละครทุกตัวต้องมี TDFB insignia patch ขนาดเล็กหนึ่งจุดที่อกซ้ายด้านบนหรือแขนเสื้อด้านบน
- placement, scale และ visual importance ต้องสม่ำเสมอในทุกตัวละคร และไม่ทำให้ type ใดดูมี rank สูงกว่า
- production ต้องวาง official TDFB logo เป็น SVG หรือ PNG layer แยกจาก character illustration
- ห้ามพึ่ง AI-generated artwork เพื่อทำซ้ำ final logo อย่างแม่นยำ
- ห้ามบิด หมุน mirror recolor หรือ reconstruct official logo
- character illustration และ logo layer ต้องเป็น separate assets ตลอด production pipeline

### Asset/component anatomy

`CharacterCard(coreVariant, wingDetail|null, mbtiPoseParameters, humanVariant, expression, environment, size)` ประกอบด้วย background depth, core silhouette, face/body, wing detail, shared prop, shadow/highlight, text-safe zone และ logo anchor ส่งออก character SVG ที่ semantic/optimized พร้อม fallback PNG โดยเก็บ official TDFB logo เป็น asset layer แยกต่างหาก; layer naming/versioning ชัดเจน

Variants: result hero, reveal card, team constellation, compact avatar และ monochrome print. Ambiguous core ใช้ “candidate constellation” 2–3 ใบโดยไม่เลือก hero ใหญ่กว่า; ambiguous wing ใช้ neutral detail/สองตัวเลือกขนาดเท่ากัน

### Inclusive generation/curation matrix

กำหนด distribution ของ skin tone, hair texture, body shape, age presentation, gender expression และ visible/non-visible disability cues แยกจาก personality seed ตรวจ intersectional combinations โดยมนุษย์ ห้าม inference identity จากผล และให้ user เลือก avatar variant ได้โดยไม่กระทบ score

### Production workflow

1. moodboard จาก licensed/owned references (reference only)
2. black-and-white silhouette studies และ stereotype review
3. 9 core systems × adjacent wing details × pose parameter stress test
4. accessibility/DEI/expert review
5. vector master, separate official-logo layer, responsive crops, alt text, licensing/provenance manifest
6. pilot comprehension โดยไม่บอก type เพื่อตรวจ unintended job/gender/rank encoding

## Assumptions

- visual system ต้องรองรับอย่างน้อย 9 cores, 18 valid core-wing pairs และ MBTI parameter combinations
- mockup ใด ๆ ที่ส่งภายหลังเป็น mood/shape/color reference เท่านั้นจนอนุมัติเป็นลายลักษณ์อักษร
- ทีมมี illustrator/vector pipeline และงบ accessibility review

## Risks

- combinatorial explosion และ inconsistent art quality
- archetype/props แอบสร้าง hierarchy, occupation, culture หรือ gender stereotype
- low-poly facets ลด readability บนจอเล็ก; palette contrast ไม่พอ
- AI-generated concept มี IP/provenance หรือ bias risk

## Open questions

- official TDFB logo asset, clear-space/size guideline, fonts/licensing และ dark mode มีหรือไม่?
- user เลือก human appearance เองหรือระบบสุ่มแบบ privacy-safe?
- ต้องรองรับ animation, print badge, projector และภาษาใดบ้าง?
- ใครอนุมัติ reference provenance และ final asset?

## Acceptance criteria

- design system แยก core/wing/MBTI/human attributes ตามตารางและรองรับ ambiguous state
- ไม่มี non-adjacent wing detail, weapon/heavy armor, real-job/identity/competence encoding หรือ type hierarchy
- ทุกตัวใช้ shared palette 85–90%, accent เฉพาะรายละเอียดเล็ก และใช้ official TDFB insignia เป็น separate unmodified asset ในตำแหน่งที่กำหนดสม่ำเสมอ
- WCAG 2.2 AA contrast, keyboard/focus, reduced motion, useful alt text และ 320px readability ผ่าน review
- ทุก asset มี source/license/provenance/status และไม่มี prompt mockup ถูกคัดลอกเป็น production
- DEI + personality expert sign-off ก่อน publish

## Expert review required

- Enneagram/MBTI experts: visual metaphor ไม่บิด construct
- DEI/cultural reviewers: identity stereotypes และ global/Thai context
- accessibility specialist: contrast, non-color encoding, alt text, zoom/reflow/reduced motion
- IP/legal: reference, generated-art provenance และ licenses
