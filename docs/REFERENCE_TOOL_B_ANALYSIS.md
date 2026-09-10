# Tool B — what 54 screenshots across four team members actually show

Raw evidence: `outputs/reference/enneagram-tool-b/` (respondents 1-4, index in `NOTES.md`).
Collected in batches 2026-09-10 and analysed only after the Products Owner declared the set
complete — the protocol in `outputs/reference/README.md` exists because the previous round's
findings were drawn from half a set and were wrong.

---

## 1. What the material is

Four complete sessions from members of the team, with four different verdicts and four different
MBTI types supplied by the respondents themselves.

| | Verdict | MBTI given | Other frameworks | Questions | Batches |
|---|---|---|---|---:|---:|
| Respondent 1 | 6w5 · The Defender | ISFP-T (previously INFP) | — | 12 | 4 |
| Respondent 2 | 1w2 · The Advocate | ESFJ | DISC D/S · BOSI S/I | 9 | 3 |
| Respondent 3 | 9w1 · The Dreamer | ISFP-T | DISC "ลม" (I) | 12 | 4 |
| Respondent 4 | 3w4 · The Professional | ENTJ-A | BOSI I→B · DISC Di **inferred** | 12 | 4 |

Two interface variants are in the set: respondents 1-2 answer by tapping option cards and the tool
prints a machine trace per batch (`Q1: gut · Q2: warm · Q3: unsafe`); respondents 3-4 answer in
free text with no traces. Respondent 4 produced **both** a prose result and a laid-out dashboard,
so "typed answers means prose output" does not hold. Whether these are two tools, two modes or two
builds is still an open question for the Products Owner — it does not change any conclusion below,
because everything below is about logic rather than chrome.

**The single most useful thing in the set is not a feature.** It is four real profiles, from four
real people, each with an independently-supplied MBTI. Every fixture in this repo was
reverse-engineered by `scripts/find-fixtures.mjs` until it hit a target, which proves the scorer is
self-consistent and can never prove it is right about a person. These four are the beginning of a
calibration set. Respondents 1 and 3 both report ISFP-T on different Enneagram cores (6w5 and 9w1),
which is exactly the independence the two lenses are supposed to have — and a useful pair to run
through our own items once we can ask these four people to take ours.

---

## 2. Logic that is genuinely new to us

Ordered by how much it would change our product, not by how impressive it looks.

### 2.1 The tool's own uncertainty triggers more questions, out loud

Three of four sessions reached a point where two candidates could not be separated, **said so**, and
opened an extra batch specifically to break the tie:

- Respondent 1: "Q7+Q8 ชี้ไปที่ 6w5 แต่ Q9 คุณเลือก 6w7 ด้วยตัวเอง" → a fourth batch of three.
- Respondent 3: wing 1 and wing 8 both signalled → a fourth batch of four.
- Respondent 4: "ข้อ 1 ขัดกับข้อ 2-3" → a fourth batch of three.

And in each case the extra batch carried an instruction the earlier ones did not:
**"ตอบตามความเป็นจริง ไม่ใช่ตามที่อยากเป็น"** (respondent 3), *"ตอบตามความเป็นจริง ไม่ใช่ตามที่อยากเป็นนะครับ
— จุดนี้สำคัญมากในการแยก wing ให้แม่น"* (respondent 4).

We have none of this. Our adaptive block is six slots spent on a fixed budget regardless of whether
anything is still unresolved, and we never distinguish *what you do* from *what you would like to be
true*. That distinction is the difference between measuring a person and measuring their self-image,
and it is the cheapest thing on this list to add.

### 2.2 Cross-framework reading: synergy AND tension, per framework

Respondent 2's overlay table gives, for each of MBTI / DISC / BOSI, one "เสริมกัน" line and one
"tension" line against the Enneagram verdict. Respondent 4's does the same in prose.

We already carry MBTI and Enneagram together, and `result-insights.ts` line 102 concatenates them:
*"MBTI ช่วยอธิบายวิธีคิด … ขณะเดียวกันแรงขับแบบ N เน้นว่า …"*. That is **juxtaposition, not
crossing.** We never say the two agree here and pull against each other there — which is the part
a reader recognises themselves in.

### 2.3 A Tension Map — several competing voices, one line each

Respondent 3's session renders the conflict as six voices:

```
Fi บอกว่า        "เรารู้ว่าอะไรถูกต้องสำหรับเรา"
9 บอกว่า          "แต่อย่าพูดเลย เดี๋ยวขัดแย้ง"
Wing 1 บอกว่า    "แต่ควรทำสิ่งที่ถูกต้องนะ"
Te inferior บอกว่า "แต่ไม่รู้จะจัดการยังไง"
I (DISC) บอกว่า   "ยิ้มไว้ ทำให้ทุกคนสบายใจ"
T (Turbulent)     "แล้วเราทำถูกหรือเปล่า?"
```

We built tension detection this session, and ours is one comparison — inward lens versus outward
lens, two cores. This is the same idea with more sources and a far better presentation.

### 2.4 An inferred framework, marked as inferred

Respondent 4 supplied MBTI and BOSI but not DISC. The dashboard shows a DISC card reading
**"Di — DISC (INFERRED)"**. The tool derived it and labelled the derivation on the face of the
card. That is a small piece of honesty we should copy wholesale, and it generalises: anything we
compute rather than measure should say so where it is shown.

### 2.5 The whole profile on one page

Respondent 4's dashboard puts the type badge, the frameworks, the core structure, the two arrows, a
radar chart, strengths and challenges as a two-column grid, and the growth path **on a single
screen** — and the tool describes it in those words: *"ภาพรวม profile ทั้งหมดของคุณในหน้าเดียว"*.

Our result page is **4797px on a phone, about 5.7 screens**, measured after this session's
additions. §3 of `docs/UX_REVIEW_2026-09-10.md` called it too long at 3 screens and asked for a
top screen that is a complete 60-second read. This is what that fix looks like, built by someone
else.

### 2.6 A radar of energy distribution

Six axes — Achievement drive, Competence, Adaptability, Emotional access, Vulnerability, Inner
depth. We have no visual representation of a profile anywhere, and we already hold the scores a
radar would need.

### 2.7 Named personas for all 18 core-and-wing combinations

The Defender (6w5), The Advocate (1w2), The Dreamer (9w1), The Professional (3w4). Each with a Thai
subtitle: *นักสร้างสันติผู้มีอุดมคติ*, *ผู้ปฏิรูปที่มีหัวใจ*.

We name the nine cores (*นักทำแผนที่เชิงระบบ*) and carry 18 wing entries with an `influence` and a
`workNuance` line each — but the wing surfaces as **a number**. "ลักษณ์ 5 · Wing 4" against
"5w4 — The Iconoclast" is not a close contest for something a person is meant to remember and
repeat to their team.

### 2.8 Quoting the respondent's own words back at them

Respondent 4's weaknesses section cites *"ข้อ 3 ชุดสุดท้ายที่บอกว่า ผลงานสำคัญกว่าความรู้สึก"*, and its
health levels quote earlier answers directly. We hold every answer and never cite one.

### 2.9 Passion / บาปหลัก

Deceit (3), Anger (1), Sloth (9), Fear (6) — the classical passion per core, attributed to Helen
Palmer. Our depth layer has fear, desire, defence and the two arrows; it has no passion.

### 2.10 A growth path of named practices with sources

Three numbered practices per type, each attributed — Helen Palmer, อ.ธนา นิลชัยโกวิทย์ — and each
concrete enough to do this week ("ฝึก 2 นาทีระหว่างวัน ถามตัวเองว่ารู้สึกอะไร"). We carry a single
attribution sentence saying the arrows are standard structure. Not the same thing.

### 2.11 Named follow-up topics

Chips offering *ความสัมพันธ์*, *บริหารทีม*, *เจาะลึกจุดอ่อน*, *เทียบ 3w4 vs 3w2*.

---

## 3. The one thing in it that we must not copy

**The overlay can explain away any contradiction, which means no answer can disconfirm the verdict.**

Respondent 4 answered batch 3 item 1 with "ชอบมีช่วงเวลาอยู่คนเดียว ขุดลึกกับสิ่งที่สนใจ มีโลกภายในที่เข้มข้น",
which points to wing 4. The tool's reading: *"โลกภายในเข้มข้นของคุณอาจมาจาก ENTJ-Ni มากกว่า wing 4
โดยตรง"* — it used a second framework to discount a signal from the first. Respondent 3's session
does the same thing in the other direction, attributing an answer to Se rather than to the core.

As coaching that is genuinely good: it is how a skilled practitioner holds two models at once. As
**measurement** it is a trapdoor. If any inconvenient answer can be reassigned to another
framework's function, the verdict is unfalsifiable, and an unfalsifiable instrument cannot be
calibrated. January's outing is a calibration event — the whole point is to find out where our
scoring is wrong.

So the rule for us: **adopt the overlay as presentation, never as scoring input.** The score comes
from the items, by the arithmetic in `scoring.ts`, and the cross-framework reading is something the
result page *says* about a score that was already computed without it. Written down here because it
is the kind of line that gets crossed by accident.

Two smaller things also not to take:

- **Variable question count.** Their sessions closed in 9-12 questions against our fixed 24, and
  that is not evidence we are inefficient: their answers are free text read by a model, ours are
  forced choices with reverse keying, scored by arithmetic that has to be comparable across a
  hundred people and resistant to a candidate answering strategically. Different instruments for
  different jobs. The 24 decision stands (`docs/QUESTION_COUNT_DECISION.md`) — but 2.1 above is
  worth taking inside it.
- **Free-text answers.** They make the reverse keying in `find-keying.mjs` meaningless and make two
  people's results incomparable. Fine for a coaching dialogue, wrong for anything HR will put next
  to another candidate's.

---

## 4. What to adapt, in order

Ranked by value per unit of work, with what we already have stated honestly so nothing gets built
twice.

| # | Change | We already have | Effort | Why this order |
|---|---|---|---|---|
| 1 | **One-page summary card** at the top of the result: type badge, core structure, both arrows, three strengths, three challenges | all the content, spread over 4797px | M | Fixes the oldest open UX finding and the newest one at once. Everything it needs already exists; this is layout, not new material |
| 2 | **18 wing persona names** with a Thai subtitle each | 9 core titles, 18 wing `influence`/`workNuance` entries, wing shown as a number | S | Cheapest change with the largest effect on whether a person remembers and repeats their result |
| 3 | **Behaviour-versus-aspiration wording** on the adaptive block, and reserve the last adaptive slot for a tie-break when the core or wing is still unresolved | 6 adaptive slots spent on a fixed budget | M | The only item on this list that improves *accuracy* rather than presentation |
| 4 | **MBTI × Enneagram: one agreement line and one tension line** | the two lenses juxtaposed in one sentence | M | This is the sentence people quote back. Needs content for 5 axes × 9 cores, or a rule that composes it |
| 5 | **Passion per core**, and the growth path as three attributed practices | fear, desire, defence, 3 levels, 2 arrows, one attribution line | S | Completes the depth layer we just built; the sources answer "where does this come from" for the audience most likely to ask |
| 6 | **Quote the respondent's own answers** in the result | every answer, never cited | S | Turns a generic paragraph into evidently theirs, at almost no cost |
| 7 | **Radar of the score distribution** | the scores | M | The first visual of a profile we would have. Wants a designer's eye on the axes |
| 8 | **Tension Map** — extend our two-lens tension to several named sources | one inward-versus-outward comparison | M | Better after 4, since the MBTI cross-reading is what supplies the extra voices |
| 9 | **Label anything inferred as inferred** | nothing inferred is labelled | S | Do it as part of whichever of the above lands first |
| 10 | **Follow-up topics** | nothing | M | **Internal mode only.** A dialogue that answers a candidate's questions about their own assessment is a different product with different consent |

Nothing here changes the item bank, so nothing here needs the review gate. Items 1, 2, 5, 6 and 9
are presentation and content and could ship this week; item 3 touches `scoring.ts` and the adaptive
selector and should carry a property test like the ones added this session.

---

## 5. Open questions for the Products Owner

1. **Are respondents 3 and 4 on a different tool from 1 and 2**, or a different mode of the same
   one? Two interface variants are in the set and it affects nothing above, but it should be
   recorded correctly.
2. **Respondents 1 and 3 both report ISFP-T.** Two people, or one person on two runs?
3. **Can these four take ours?** Four people with a known independent MBTI and a verdict from
   another instrument is the calibration set this project has never had. It would tell us more than
   any further screenshot.
