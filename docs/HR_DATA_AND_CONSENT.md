# HR Data and Consent Plan

## Status and scope

This document defines the proposed data, consent, and governance model for the TDFB Personality Quest. It is a product and HR policy plan only; it does not authorize storage, analytics, or application changes.

The assessment is a reflection tool for team development. It is not a psychological diagnosis, performance measure, hiring screen, promotion criterion, or source of automated employment decisions.

## Current-state baseline

The current application keeps profile fields and answers in browser memory for the active page session. It does not send them to an API or store them in browser storage or a database.

The approved profile contract contains exactly three fields: combined name and nickname, team, and gender. Consent state and assessment answers are processing data, not profile fields.

| Field | Current purpose | Assessment need | Recommendation |
|---|---|---:|---|
| Name and nickname | Identify and personalize whose result is displayed in the active session | No scoring effect | Keep as one combined field for the active session; do not use in aggregate reporting |
| Team | Display the participant's work context | No scoring effect | Use an HR-approved team list when a controlled taxonomy is available |
| Gender | Select the participant's visual presentation | No scoring effect | Explain that it changes presentation only and offer `ไม่ระบุ` |
| Consent checkbox | Permit use for the stated activity | Yes | Replace bundled language with layered notice and explicit acknowledgement |
| Assessment answers | Calculate the result | Yes | Keep in session memory unless separate storage consent is introduced |

## Data-minimization principles

1. Collect only fields required for a stated participant benefit or approved aggregate analysis.
2. Do not collect profile fields beyond combined name and nickname, team, and gender.
3. Prefer broad categories over free text to reduce accidental personal information.
4. Keep all three profile fields separate from scoring. Name and nickname, team, and gender must never alter MBTI, Enneagram, Wing, confidence, or challenge selection.
5. Do not infer protected characteristics from answers or combine assessment data with performance, compensation, attendance, disciplinary, recruitment, or promotion records.
6. Default to session-only processing. Any future persistence requires a separate decision, notice, retention schedule, access model, and security review.

## Approved profile-field contract

No future profile dropdown or free-text field may be added outside this contract without a new HR, Privacy, Security, and Product review.

| Field | Input contract | Permitted use | Prohibited use |
|---|---|---|---|
| Name and nickname | Participant name and preferred nickname in one field | Identify and personalize the result during the active session | Scoring, identity matching, segmentation, ranking, or aggregate reporting |
| Team | HR-approved team value or current team text | Display work context; approved aggregate grouping only with separate consent | Individual employment decisions or cross-system matching |
| Gender | `ผู้หญิง`, `ผู้ชาย`, or `ไม่ระบุ` | Select visual presentation only | Scoring, behavioral inference, segmentation, or HR decisions |

Contract requirements:

- The application must reject or ignore any unapproved profile key.
- Profile fields must remain outside all assessment weight and challenge-selection data.
- Gender must default to or offer `ไม่ระบุ` and must not be inferred.
- Team values must not expose manager names or reporting lines.
- The combined name-and-nickname field must be excluded from aggregate datasets and reports.

## Consent model

### Layer 1: short notice before the assessment

Recommended participant copy:

> แบบประเมินนี้ช่วยให้คุณสะท้อนวิธีคิด แรงขับภายใน และการทำงานร่วมกับผู้อื่น ไม่มีคำตอบถูกหรือผิด และผลลัพธ์ไม่ใช่การวินิจฉัยหรือการประเมินผลงาน

### Layer 2: data-use summary

Recommended participant copy for the current session-only version:

> ข้อมูลโปรไฟล์และคำตอบใช้เพื่อคำนวณและแสดงผลบนอุปกรณ์นี้ในระหว่างที่เปิดหน้านี้ ระบบไม่ส่งหรือบันทึกข้อมูลลงฐานข้อมูล

The statement must be revised before any telemetry, persistence, export, or server processing is introduced.

### Layer 3: required acknowledgement

Recommended checkbox copy:

> ฉันเข้าใจวัตถุประสงค์และยินยอมให้ระบบใช้คำตอบเพื่อคำนวณและแสดงผลแบบประเมินนี้

This acknowledgement covers only assessment processing needed to return the participant's result. It must not be treated as consent for future storage, HR reporting, research, or reuse.

### Separate optional consent for future aggregate use

If aggregate reporting is introduced, use a second unchecked checkbox:

> ฉันยินยอมให้นำผลและข้อมูลหมวดหมู่ที่เลือกไปสรุปรวมเพื่อพัฒนากิจกรรมทีม โดยไม่นำเสนอผลรายบุคคล

Rules:

- Participation in the assessment must not depend on accepting aggregate use.
- Refusal must not reduce access to the personal result.
- Withdrawal instructions must be provided whenever persistent data exists.
- Consent must not be bundled with employment terms or presented by a direct manager in a coercive way.

## Purpose and access matrix

| Data | Personal result | Workshop facilitation | Aggregate reporting | Individual HR decision |
|---|---:|---:|---:|---:|
| Assessment answers | Yes | Participant-controlled | Optional consent only | Never |
| MBTI/Enneagram/Wing result | Yes | Participant-controlled | Optional consent only | Never |
| Name and nickname | Yes | Participant-controlled | Exclude | Never |
| Team | Yes | Optional | Optional consent only | Never |
| Gender | Visual presentation only | Do not use | Exclude | Never |

For the session-only version, no HR, manager, facilitator, or administrator receives system access because no data is stored or transmitted.

## Retention and deletion

### Session-only v1

- Keep profile values and answers only in in-memory application state.
- Clear them on Restart, page reload, or tab closure.
- Do not place them in URLs, logs, analytics events, local storage, session storage, cookies, or crash reports.

### Any future stored version

Before implementation, HR, Legal/Privacy, Security, and the product owner must approve:

- Data owner and processor roles.
- Storage location and encryption controls.
- Role-based access and audit logs.
- A short, explicit retention period.
- Participant access, correction, export, and deletion procedures.
- Backup-deletion behavior.
- Minimum group-size and suppression rules.
- Incident-response ownership.

No indefinite retention is permitted.

## Reporting safeguards

- Default to individual results visible only to the participant.
- Sharing with a facilitator must be initiated knowingly by the participant.
- Aggregate reports must exclude names, nicknames, free text, and raw answer sequences.
- Suppress groups below an HR-approved threshold; five participants is the minimum candidate, not an automatic approval.
- Do not rank teams or label one profile as better than another.
- Report distributions and collaboration considerations, not predictions of performance.
- Do not allow team-level drill-down that can identify an individual participant.

## Product requirements for future implementation

1. Limit the profile object to exactly three fields: combined name and nickname, team, and gender.
2. Treat any additional profile field as a contract change requiring a new review.
3. Keep all three profile fields outside scoring and challenge-selection functions.
4. Show the short notice and data-use summary before acknowledgement.
5. Separate required result-processing acknowledgement from optional aggregate-use consent.
6. Disable submission until the required acknowledgement is checked; do not require optional consent.
7. Provide a visible privacy summary near the form and a fuller policy link when persistence exists.
8. Add automated tests proving changes to any profile field do not change assessment scores.
9. Add tests proving optional-consent refusal still permits assessment completion and personal results.
10. Re-audit all participant-facing statements whenever data flow changes.

## Approval and release gates

Any change to the three-field profile contract or any aggregate reporting is **no-go** until all of the following are complete:

- HR approves the purpose and the Team taxonomy when a controlled list is used.
- Privacy/Legal approves notice, lawful basis, consent wording, and participant rights.
- Security approves the data-flow and threat model if information leaves the browser session.
- Product confirms that refusal of optional consent causes no disadvantage.
- Engineering demonstrates scoring isolation, deletion behavior, access controls, and logging exclusions.
- QA verifies mobile and desktop consent usability and keyboard/screen-reader access.

The session-only assessment may proceed with the three-field contract only when each field is limited to its documented purpose and remains isolated from scoring.

## Decision log template

Record each future decision in this table before implementation:

| Date | Decision | Owner | Purpose | Data affected | Retention | Approvers |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | Pending | Pending | Pending | Pending | Pending | HR, Privacy, Security, Product |
