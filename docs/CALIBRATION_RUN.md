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

## Before the run: set the roster

Optional, and worth the two minutes. With no roster the form asks each person to type their name
and team, and six people typing their own names is six chances for the same person to arrive as
"เบนซ์", "เบนซ์ Gorawit" and "Benz" across one calibration set — which has to be reconciled by hand
afterwards, by guessing.

Set `NEXT_PUBLIC_ROSTER` at build time and the name field becomes a picker that fills in the team
for you:

```
NEXT_PUBLIC_ROSTER='[{"name":"เบนซ์ Gorawit","team":"Operation"},{"name":"...","team":"..."}]' npm run build
```

The names are NOT committed to this repository. They are personal data, and the repository moves to
the HR-owned account in mid-October (docs/HR_DATA_AND_CONSENT.md); a build-time variable keeps them
out of git history without costing anything. Anything malformed — a bad JSON, a missing team, two
people with the same name — falls back to typing rather than rendering an empty picker somebody
cannot get past, and `npm test` covers all thirteen of those cases.

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
TDFB1|b=3lziv4|n=24|a=300330300343343030300020|e=5w6|m=INTJ-A|c=CC|t=-|s=k2p9xq
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
| `s` | session id, derived from the answers |

**There is no name in it, and that is deliberate.** An earlier version carried `w=` and `g=` —
nickname and team — because a calibration set seemed to need to know whose session was whose. The
requirement is narrower than that: take the result data forward, not the people. `s` is derived from
the answers, so two codes can be told apart, counted and de-duplicated without saying who took
either one. The person's name still appears on their own screen and in their own PDF; what leaves as
data does not carry it. `npm test` asserts that the code, the JSON and even the filename are clean,
because a field like that comes back by accident, not on purpose.

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
   instrument used for hiring must have, and ours has never been measured at all — not because
   anything suggests it is unstable, but because no data exists in which anybody answered twice. One
   repeat pair is worth more than two more first-time sessions.

   Say plainly why when you ask, because the request can read as doubting their first answer. It is
   the instrument being checked, not them. And if the two runs disagree, that is a finding about our
   items — in the Enneagram model the core type is treated as stable, so a person does not "change
   type" between two Tuesdays; what changes is health, strain, and which arrow they are expressing,
   which is exactly what the result page's arrows and three levels are there to say.
3. **Keep the codes.** When the item bank changes, replaying the same six vectors against the new
   bank says exactly what the change did to real people, which is a far better signal than any
   property test.

## What this is not

Six people is not a validation study. It cannot establish that the instrument is accurate, and
nothing produced from it should be described as though it had. What six people can do is find the
failures that are obvious once a human sees them — an item nobody reads the way we meant, a type
that never appears, a result somebody flatly does not recognise. Those are the failures worth
finding before January, and they do not need a large sample.
