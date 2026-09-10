# The calibration run — how to collect the team's sessions

Six people including the Products Owner. This is the first time anything in this project will be
checked against a person rather than against itself, and it is worth being precise about why and
about what to collect.

## Why a screenshot is the wrong artefact

Every fixture in `app/lib/assessment-fixtures.ts` was searched for by `scripts/find-fixtures.mjs`:
an answer vector reverse-engineered until it produced a target. Those prove the scorer is
self-consistent. They cannot prove it is right about a person, because no person is in them.

A screenshot of a result has the same problem in a different form. It carries the **verdict**, and
the verdict is the thing under test — so a picture of it checks nothing. What can show our scoring
to be wrong is the **answers**: give us the same 24 choices and we can replay them against a changed
item bank, against a different scoring rule, or against the same person's second run.

So the export carries the answers, and the PDF carries the verdict, and they are for different
readers.

## What each person does

1. Take the assessment as themselves. Not as who they would like to be — the reference tool asks
   for exactly this distinction when it gets stuck, and it is the difference between measuring a
   person and measuring their self-image.
2. On the result page, three buttons under the summary card:
   - **บันทึกเป็น PDF** — theirs to keep. Prints the summary card only, one A4 page.
   - **คัดลอกโค้ดผลลัพธ์** — one line of text. This is the one that matters. Paste it in chat.
   - **ดาวน์โหลดไฟล์ข้อมูล (.json)** — the same session with every question id spelled out, for
     whoever is doing the analysis.
3. Send the code. On a phone the copy button is far less work than handling a file, which is why it
   is the primary action.

Nothing is uploaded. The app has no backend; each person copies and decides who to give it to.
Their name and team are in the code because a calibration set has to know whose session is whose,
and they can see them there before they send it — press **ดูโค้ดก่อน** to read it first.

## What a code looks like

```
TDFB1|b=fem9h2|n=24|a=300330300343343030300020|e=5|m=INTJ-A|c=CC|t=-|w=เบนซ์ Gorawit|g=Operation
```

| Field | Meaning |
|---|---|
| `b` | item-bank fingerprint — which version of the questions produced this |
| `n` | how many answers |
| `a` | the chosen option index for each question, in order |
| `e` | Enneagram core and wing |
| `m` | MBTI type, or `x` when ambiguous |
| `c` | confidence: Enneagram then MBTI, `C`lear / `N`ear / `A`mbiguous |
| `t` | inward/outward tension, or `-` |
| `w`, `g` | nickname and team |

**`a` is the whole session.** `selectNextQuestion` is a pure function of the answers so far, so those
digits replay which questions were asked, in what order, and what was chosen. `npm run test:scoring`
asserts that round trip on every fixture, because the entire plan rests on it.

**`b` is why the fingerprint exists.** The items will change again before January. A code exported
today, replayed against a changed bank, would silently describe a different person; a mismatched
fingerprint makes that visible instead.

## What to do with them

Collect all six, then:

1. **Compare each verdict to what the person believes.** Four of the team already have a verdict
   from พี่ทิม's tool (`outputs/reference/enneagram-tool-b/`) and the Products Owner has a type
   established outside every tool here (INTJ · 5w4). Disagreements are the finding, not the failure
   — `docs/REFERENCE_TOOL_B_ANALYSIS.md` §1 records that the same person got 6w5 and 9w1 from that
   tool on two runs.
2. **Ask two of them to take it twice**, a week or more apart. Retest stability is the property an
   instrument used for hiring must have, and ours has never been measured at all. One repeat pair
   is worth more than two more first-time sessions.
3. **Keep the codes.** When the item bank changes, replaying the same six vectors against the new
   bank says exactly what the change did to real people, which is a far better signal than any
   property test.

## What this is not

Six people is not a validation study. It cannot establish that the instrument is accurate, and
nothing produced from it should be described as though it had. What six people can do is find the
failures that are obvious once a human sees them — an item nobody reads the way we meant, a type
that never appears, a result somebody flatly does not recognise. Those are the failures worth
finding before January, and they do not need a large sample.
