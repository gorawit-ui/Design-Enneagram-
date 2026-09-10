# What พี่ทิม's Enneagram tool taught us, and the four types ours cannot return

Ten screenshots in `outputs/reference/tim-enneagram-tool/`, in reading order:
`1-batch1-q1-q2` · `2-batch1-q3` · `3-batch1-analysis` · `4-batch2-q4-q6` · `5-batch2-analysis` ·
`6-batch3-q7-q9` · `7-batch3-analysis-and-verdict` · `8-result-structure` ·
`9-result-strengths-weaknesses` · `10-result-health-arrows-growth`.

---

## Correction first: the tool got it right, and an earlier note in this repo said it failed

An earlier version of this document, written from the first five screenshots only, said the tool
"spent five questions unable to close, ending on a coin-flip". That was wrong, and wrong in a way
worth naming: batch 2 genuinely ends on "เหลือ 5 กับ 7 เป็นตัวเต็ง", and I read a mid-point as an
endpoint. Batch 3 closes it correctly.

**It reached INTJ-equivalent · 5w4 in nine questions.** The narrowing:

| After | Candidates | What closed it |
|---|---|---|
| Q1–Q3 | 5, 6, 7 | Q1 put the respondent in the Head Center on the first question |
| Q4–Q6 | 5, 7 | Q4 cut 6 (no need for a trusted system); Q5 was a strong 5; Q6 read as 7 |
| Q7–Q9 | **5w4** | Q7 (solitude recharges) + Q8 (withdraw and observe) killed 7; Q9 fixed the wing at 4 |

Two moves in that sequence are better than anything we do.

**Q9 is a first-person sentence, not a scenario.** *"ฉันต่างจากคนอื่น และฉันเลือกที่จะอยู่กับตัวเอง"* —
the respondent recognises their own inner voice rather than predicting their behaviour. It is what
fixed the wing. All nineteen of our prompts are situational (`เมื่อ X … คุณ Y?`); we have zero voice
items.

**It reinterprets an earlier answer instead of averaging it.** Q2 said "people see me as warm and
helpful", a Heart signal that pulls against Head. The tool's verdict: *"นี่คือสิ่งที่ 5w4 พัฒนาขึ้นมา
เพื่อเชื่อมกับโลก ไม่ใช่ core motivation แท้จริง"* — it separates adapted behaviour from core drive, and
it separates the **outside view** (how others see you) from the **inside view** (what you fear and
want). Our scorer sums weights and has one word, `ambiguous`, meaning *not enough signal*. It has
no way to say *these two answers disagree, and the disagreement is the finding*.

---

## The finding that matters: four of our eighteen types cannot be returned

Reading their tool sent me to measure ours. `npm run items:reachability` answers every item as
favourably to a target type as the item set allows — mechanically, no hand-picking — and asks
whether the scorer returns that type. This is an upper bound: a real person answers less
consistently, so a type that fails here cannot be reached by anyone.

**14 of 18 core+wing pairs reachable. 16 of 18 cores.**

| Target | Core returned | Wing returned | Margin | Runner-up |
|---|---|---|---:|---:|
| **4w5** | **null (ambiguous)** | **null (unavailable)** | **1** | 5 |
| **7w8** | **null (ambiguous)** | **null (unavailable)** | **1** | 8 |
| 3w2 | 3 (clear) | **null (ambiguous)** | 8 | 8 |
| 6w7 | 6 (clear) | **null (ambiguous)** | 9 | 2 |
| 7w6 | 7 (close) | 6 (valid) | 2 | 6 |
| 9w8 | 9 (close) | 8 (valid) | 3 | 8 |
| the other twelve | correct, clear | correct, valid | 4–12 | — |

A person who is 4w5 or 7w8 gets **"ไม่สามารถระบุได้"** however honestly and consistently they answer.
Not a low-confidence result — no result. In January that lands in front of an employee at an outing.

**This is not an artifact of the probe.** The probe models how hard a respondent leans on their
wing as one number. Sweeping it from 0.5 to 2.0 against a core weight of 3 returns the *same four
misses, with the same margins, at every setting.* The failures are structural.

**The mechanism, from `npm run items:coverage`.** Two measurements combine:

1. **Forced donation.** On any single item, a respondent whose core has no option must give their
   answer to a core that is not theirs, and which one is decided by the wording of the other three
   options rather than by them. Per core, items in the ten-item block with no option at all:

   | Core | 7 | 2 | 4 | 1 | 3 | 5 | 6 | 9 | 8 |
   |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
   | Silent items | **6** | **5** | **5** | 4 | 4 | 4 | 3 | 3 | 2 |

   `f-e-6` is the clearest case: its four options carry cores 4, 6, 7 and 9 only. A core-5
   respondent asked *"เมื่อกังวลเรื่องงาน อะไรช่วยให้คุณผ่อนลงได้ก่อน?"* has nowhere to go.

2. **Total weight.** Cores 7 (8) and 4 (9) are the two lightest in the foundation block; cores 3,
   5, 6 and 8 carry 12.

So cores 4 and 7 arrive at the adaptive block already weak, and the adaptive block cannot rescue
them: the wing challenge `c-wing-N` raises the *adjacent* cores, so answering as a 4w5 lifts 5
nearly as fast as 4. The core ends up ahead by 1, the rule is `ambiguous if margin < 2`, and the
result is nothing. Cores 5, 6, 8, 9 have enough foundation weight to survive the same squeeze —
which is why our own Products Owner's type, 5w4, comes back clear (`npm run items:probe`) and why
this went unnoticed.

The two `ambiguous` wings, 3w2 and 6w7, are a separate and smaller problem in the wing rule: it
needs margin ≥ 2 between the two cores adjacent to the leader, and for those pairs the adjacent
cores finish within 1.

**Recommendation, not applied.** The item set is behind a review gate and the January calibration,
so this is logged rather than changed. The fix is items, not the scorer: cores 4 and 7 need
options on the items that are currently silent on them, which is also the cheapest way to buy back
the margin. `npm run items:reachability` should become a gate that exits non-zero — it does already
— so this class of defect cannot come back.

---

## Three things worth borrowing, one worth declining

**Borrow: an item that asks the core fear directly.** Enneagram type is a fear structure. Their Q3
asks it outright with one option per type. Our nearest is `f-e-3`, *"ในงานประจำวัน เรื่องใดรบกวนใจคุณ
ได้มากที่สุด?"* — daily-work irritation, and it reaches only cores 1, 2, 3 and 4, silent on the other
five. One fear item covering all nine would do more for the weak cores than several behaviour items.

**Borrow: two-tier options.** This is the structural reason behind the Products Owner's read that
their questions are *ลื่นหู* and ours are not. Theirs are a short label plus a one-line gloss:
*"ลุยเลย / ควบคุมสถานการณ์"* over *"รู้สึกอยากจัดการทันที ไม่ชอบรอบอ"*. Ours are a single phrase with a
median of 21 characters and no gloss — and `AssessmentOption` is `{ text, weights }`, so it
**cannot carry one**. Adding an optional second line is a small type change and probably the highest
ratio of comprehension gained to work done anywhere in the assessment.

**Borrow: naming the tension.** Add a notion of outside-view versus inside-view items, and when
they disagree, say so in the result instead of averaging them into a muddle. This is what let their
tool explain the false 7 signal as *"'7 mode' ที่เปิดเมื่อกดดัน"* rather than scoring it as evidence for 7.
Related and checkable in our bank: `f-e-5` and `f-e-6` both ask about behaviour under pressure —
20% of the Enneagram block — which by that reasoning measures the **stress arrow** rather than the
core.

**Decline: showing the respondent the live narrowing.** *"ตอนนี้แคบลงเหลือ ลักษณ์ 5, 6, หรือ 7"* is
excellent in a coaching conversation and wrong in a hiring one: it tells a candidate what to answer
next. This belongs to internal mode only and must never reach candidate mode — which the two-mode
decision in `docs/QUESTION_COUNT_DECISION.md` already anticipated, without knowing this was the
feature it was protecting against.

---

## Result page: our Thai is better, our content is thinner

The Products Owner's read is right on both halves, and they are two separate problems.

**Their Thai reads like a translation, ours does not.** Theirs leaves frame vocabulary in English
with a Thai gloss — *Defense Mechanism · Isolation*, *Passion (บาปหลัก) · Avarice*, *Archetype*, *act
into energy* — and carries English sentence shapes. Ours is written in Thai: *"ชอบเป้าหมายและขั้นตอนที่
ชัดเจน พร้อมดูแลรายละเอียดให้ครบ"*. Keep that, and do not import their vocabulary along with their
structure.

**But their content has three things we have nothing for**, and one of them is not decoration:

- **Healthy / Average / Unhealthy levels.** Three paragraphs describing the same type at three
  states. Ours describes one state and implies it is the person.
- **Stress and growth arrows** (5 → 7 under stress, 5 → 8 in growth). This is the mechanism that
  let them explain a contradictory answer, so it earns its place in the model and not just on the
  page.
- **A growth path with attribution** (Helen Palmer, อ.ธนา). Ours gives advice with no provenance,
  which is weaker for exactly the audience most likely to ask where it comes from.

Ours is also flatter in a way worth naming: nearly every line follows the same two shapes,
*"ชอบ X และ Y"* and *"เมื่อ A อาจ B"* — safe, operational, and forgettable. Theirs is clumsy in places
and memorable anyway: *"โลกข้างในรวยกว่าที่แสดงออก"*, *"กักตุนพลังงานจนไม่ลงมือทำ"*. The lesson is
specificity, not translation.

---

## New commands

```
npm run items:reachability     # 18 core+wing pairs; exits non-zero on any unreachable type
npm run items:coverage         # per-core weight and the forced-donation table
npm run items:probe            # answer our items as 5w4, then as 5w6, and score
```
