# Items owed by HR

A running log of things the assessment needs from HR (Mook Wiparat) that engineering cannot write.
Recorded so they are asked for once and tracked, rather than remembered.

Nothing in this list blocks the January outing except the first item.

## 0. Not owed by HR, but parked here so it is not lost: the outing's anonymous write

Deferred on the Products Owner's decision 2026-09-10, to be picked up after the question work.

The calibration write for the January outing — an Apps Script behind a Google Sheet on the HR
account, taking answers, time per item and the resulting confidence, with no name, no team and
nothing identifying. Engineering can write both the script and the client call in advance without
touching the HR account; what it cannot do is create the Sheet, so the last step is pasting the
deployment URL in.

Due at the same time as item 1 below, and for the same reason: the data has to be arriving by
mid-October for the onsite activity to be designed around it, and if nothing records the outing then
the evidence that decides the candidate instrument will not exist.

## 1. Consent text — employee, for the outing · needed before mid-October

The consent checkbox on the profile page currently reads:

> ยินยอมให้ใช้ข้อมูลเพื่อแสดงผลกิจกรรม — ไม่มีการส่งข้อมูลออกหรือบันทึกลงฐานข้อมูล

That second clause is true today: `app/page.tsx` holds the whole session in React state and writes
nothing anywhere. It **stops being true** the moment the outing records anything, which is planned,
because the calibration data from the outing is what decides the candidate instrument later.

What is planned to be collected is deliberately small: **the answers, the time per item and the
resulting confidence — no name, no team, no character choice, nothing that identifies a person.**
HR needs to supply the Thai wording that says that accurately. It is a change to one sentence, not
a new document.

Why mid-October: the repository and its data move to the HR-owned account then, and the onsite
activity is designed around the collection.

## 2. Consent text — candidate · needed before the first candidate, not before the outing

A separate text, because a candidate is being told something different from an employee. It has to
cover what HR confirmed on 2026-09-10:

- the assessment is taken **after the first interview and before the final one**
- its purpose is **to inform the interview** — *ประกอบการสัมภาษณ์* — and **no selection, ranking or
  employment decision rests on the result**
- the retention period, as an actual number (see item 3)
- who can read the result
- what happens to it if the candidate is not hired

## 3. Retention period, as a number · needed with item 2

HR's own note was that past records were kept "นานจนลืม". A stated number and an actual deletion are
two separate commitments and the assessment needs both. The question in HR's own list was whether
this is 1 year, 2 years, or 6 months for candidates who do not pass — engineering has no basis to
pick, and PDPA requires the period to be defined rather than open-ended.

## 4. Amendment to `docs/HR_DATA_AND_CONSENT.md` · needed before the first candidate

That document currently rules the assessment out as a **hiring screen** and forbids combining it
with **recruitment** records. The use HR described is narrower than what it forbids, but attaching a
named candidate's responses to a recruitment process still needs the document changed rather than
worked around. The sentence to add, for HR and privacy to approve:

> may be used as interview-preparation material for a candidate who has already passed the first
> interview, with no selection, ranking or employment decision resting on the result

`docs/PRODUCT_BLUEPRINT.md` carries the same rule twice and needs the matching change.

## 5. Candidate form fields · needed before the router page is built

Which fields the candidate form collects. The recommendation from
`docs/QUESTION_COUNT_DECISION.md` is fewest possible, and that these are actively refused: date of
birth or age, photograph, marital status, religion, nationality, and health or disability
information. All create discrimination exposure, several are sensitive personal data under the Thai
PDPA with a higher consent bar, and the assessment needs none of them.

If the invite flow verifies an email against a sheet HR already keeps, the form needs less than it
otherwise would — the identity is already known.

## 6. Who sends the invitation, and where the explanation lives

The generic assessment link goes in an HR email template. HR owns the wording that tells the
candidate what they are about to do, why, and what happens to their answers — and it should say the
same thing as item 2 rather than something warmer.
