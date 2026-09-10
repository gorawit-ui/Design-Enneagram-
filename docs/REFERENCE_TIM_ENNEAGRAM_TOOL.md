# Reference — พี่ทิม's Enneagram tool, and the first real ground-truth case

**Status: collecting. Five screenshots captured, more coming.** Nothing in this document has been
acted on yet; it exists so the observations do not evaporate.

Screenshots in `outputs/reference/tim-enneagram-tool/`, in reading order:
`1-batch1-q1-q2` · `2-batch1-q3` · `3-batch1-analysis` · `4-batch2-q4-q6` · `5-batch2-analysis`.

---

## The most valuable thing here is not the tool. It is a known answer.

The Products Owner's own type is **INTJ · Enneagram 5w4 ("The Iconoclast")**, established
independently of any tool in this project.

This project has five scoring fixtures, and every one of them was *searched for* by
`scripts/find-fixtures.mjs` — an answer vector reverse-engineered until it produced a target
result. They prove the scorer is self-consistent. They cannot prove it is right about a person,
because no person is in them. This is the first case with a human on one side and an expected
answer on the other, which makes it the first thing capable of falsifying the item bank rather than
just exercising it.

It should become a test with the same standing as the property tests: answer our own 24 items as
this person, and the result should be 5, wing 4, INTJ. If it is not, the items are wrong, not the
person. **Recording this before running it, so the expectation cannot be quietly adjusted to
whatever comes out.**

---

## How the tool works

Batched adaptive, three questions at a time, narrowing openly between batches and showing its
reasoning to the respondent as it goes.

**Batch 1 — locate the Center and the core fear**

| | Question | What it reads |
|---|---|---|
| Q1 | เวลาเจอปัญหากะทันหันหรือความกดดัน ปฏิกิริยาแรกของคุณคืออะไร? | Center: Body (ลุยเลย/ควบคุมสถานการณ์ · ต้านทาน/หลีกเลี่ยงความขัดแย้ง), Heart (รู้สึกและห่วงผลกระทบต่อคนอื่น), Head (ถอยออกมาคิด/วิเคราะห์ก่อน) |
| Q2 | คนที่รู้จักคุณดีมักมองว่าคุณเป็นคนแบบไหน? | 9 chips, one per type — the outside view |
| Q3 | ความกลัวที่ลึกที่สุดของคุณคืออะไร — สิ่งที่คิดไม่อยากให้เกิดขึ้นในชีวิต? | 9 chips, one per type — **core fear** |

**Batch 2 — separate the survivors**

| | Question | What it reads |
|---|---|---|
| Q4 | เวลาต้องพึ่งพาคนอื่น ความรู้สึกแรกของคุณคืออะไร? | autonomy vs. needing a trusted system → cuts 6 |
| Q5 | เวลาต้องตัดสินใจสำคัญ คุณมักทำอะไร? | 5 (รวบรวมข้อมูลคนเดียว) vs 6 (ถามคนที่ไว้ใจ) vs 7 (ประเมินเร็วแล้วตัดสินใจ) vs 9 (ชะลอ) |
| Q6 | อะไรที่ทำให้คุณรู้สึก "มีพลังงาน" มากที่สุด? | 5 (เรียนรู้เรื่องที่สนใจ) vs 6 (คนที่ไว้ใจ + เป้าหมายร่วม) vs 7 (ประสบการณ์ใหม่) |

**Batch 3** — Wing confirmation (not yet captured).

Three things it does that are worth stealing outright:

1. **It asks the core fear directly.** Enneagram type is a fear structure, not a behaviour
   pattern. Our own ten `f-e-*` items all ask about behaviour in work situations — what you'd do
   when the team disagrees, what you protect when work lands mid-week. None asks what you are
   afraid of. That is a real gap and it is the most likely reason a behaviourally-similar 3 and 1
   are hard for us to separate.
2. **It names the tension out loud.** "Head + กลัวถูกควบคุม แต่คนมองว่าอบอุ่นช่วยเหลือ — อาจหมายความว่าคุณ
   *เลือก* ช่วยด้วยความสมัครใจ" — it treats a contradiction between answers as information rather
   than as noise. Our scorer has `ambiguous`, which says "not enough signal"; it has no way to say
   "these two answers disagree, and the disagreement is the finding".
3. **It shows its narrowing.** "ตอนนี้แคบลงเหลือ ลักษณ์ 5, 6, หรือ 7" after three questions. Ours
   selects adaptively too but tells the respondent nothing about why.

---

## Where it went wrong on this case, from the trace it printed

```
ชุดที่ 1 — Q1 reaction: head_analyze · Q2 others see: warm_helpful · Q3 core fear: fear_controlled
ชุดที่ 2 — Q4 dependency: ok_but_limited · Q5 decision: research_alone · Q6 energize: new_experiences
```

Its own reading: Head Center ✓ → cut 6 on Q4 → "สัญญาณ 5 ชัดมาก" on Q5 → "นี่คือสัญญาณ 7 ที่แข็งแกร่ง"
on Q6 → **"เหลือ 5 กับ 7 เป็นตัวเต็ง"**. The answer is 5w4. So it landed the Center on question one
and then spent five more questions unable to close, ending on a coin-flip that included a type that
is not the answer and never raising the one that is (4, as the wing).

Two item-writing defects look responsible, and both are the kind our own bank can have:

- **Q3's fear options split type 5's actual fear across two chips, neither coded to 5.** The chip
  coded to 5 is *"กลัวไม่มีความรู้ / ไม่เพียงพอ"* — which reads as impostor syndrome and does not
  resonate. A 5 much more often experiences the core fear as being invaded, drained, overwhelmed,
  having their capacity taken — which lands on *"กลัวถูกควบคุม / อ่อนแอ"*, a chip coded to 6/7/8. So
  a 5 answering honestly hands the tool evidence against 5. The tool even notices, hedging that
  "ลักษณ์ 5 ก็กลัวการถูกล่วงล้ำพื้นที่ตัวเองได้เช่นกัน", and then does not act on its own hedge.
- **Q6 conflates two different meanings of "new".** *"ประสบการณ์ใหม่ ความตื่นเต้น ความเป็นไปได้"* is
  written for 7's appetite for stimulation, but a 5w4 reads "new" as *novel understanding* and picks
  the same chip. One word doing two jobs is what produced the false 7 signal, and it is exactly the
  failure mode `scripts/find-keying.mjs` was written to catch in a different guise.

---

## Not yet decided

Whether any of this changes our 24 items. The item set is locked behind a review gate and the
January calibration, and one case — even the owner's own — is one case. What it justifies now is a
**test**, not a rewrite. Five more screenshots are coming; batch 3 and the Wing logic are the part
most likely to say something we cannot already see.
