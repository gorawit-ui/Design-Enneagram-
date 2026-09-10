# Question count and instrument design — decision record

## The question put

The Products Owner asked, on 2026-09-10, whether the assessment should be fixed at 24 questions as
`docs/QUESTION_AND_SCORING_SPEC.md` specifies, "to be as accurate as possible", weighing the time it
takes against a stated future use: HR giving the assessment to candidates when they apply.

The question came with a premise from an earlier executive discussion — that in the version built
before, respondents answered *different numbers of questions*, because once the system judged it had
enough evidence to name an MBTI type, Enneagram core and wing, it ended the assessment early.

## First: that premise does not describe this codebase

There is no early stop here. `selectChallengeQuestions` in `app/lib/scoring.ts` returns a tuple of
exactly two questions on every path — one MBTI dimension challenge and one Enneagram challenge —
with no branch that returns fewer. `MAX_QUESTIONS` is 20 and
`scripts/run-scoring-tests.mjs` asserts it. **Every respondent answers exactly 20 questions.**

So the risk the executives raised is already absent. The decision below is therefore not "should we
stop the early stop" but the narrower "should 20 become 24".

## What the 20 are, and what the spec's 24 would be

| | MBTI foundation | Enneagram foundation | Adaptive | Total |
|---|---:|---:|---:|---:|
| Built today | 10 (incl. 2 A/T) | 8 | 2 | **20** |
| Spec | 8 | 10 | 6 | **24** |

The two differ by more than four items: the spec moves two items *out* of MBTI and puts four more
into the adaptive block.

## Recommendation on count: adopt 24, and adopt the spec's allocation with it

Not because more items are generically more accurate, but because the current allocation spends its
items on the easier of the two problems.

- MBTI resolves **five binary decisions** (I/E, S/N, T/F, J/P, A/T) and currently gets ten items —
  two per decision.
- Enneagram resolves **one choice among nine cores**, then a wing (two candidates), so 18 possible
  outcomes, and currently gets eight foundation items plus one adaptive.

Eight items separating nine cores is the thinnest evidence anywhere in the instrument, and the wing
rests largely on a single question. Moving two items from MBTI to Enneagram and widening the adaptive
block from two to six targets exactly that, so the spec's split is the better one on the same budget
plus four.

Cost in time is not a real constraint. At the spec's own 18 seconds per item, 20 items is about six
minutes and 24 is about seven. A candidate assessment of seven minutes is short by any standard.

## Two problems that going to 24 does not fix, both of which matter more for candidate use

### 1. Option position maps to the same pole on every single item

`mbtiQuestion` in `app/lib/assessment-data.ts` assigns weights by position, always in the same
direction:

```
option 1 -> left pole,  weight 2
option 2 -> left pole,  weight 1
option 3 -> right pole, weight 1
option 4 -> right pole, weight 2
```

Every MBTI foundation item, every dimension challenge and every wing challenge follows it. Nothing is
reverse-keyed anywhere in the bank.

Two consequences. A respondent who straight-lines the first option receives a maximally I-S-T-J-A
profile, and one who straight-lines the last receives maximally E-N-F-P-T — both arriving as
*confident* results rather than as the low-confidence results that non-answering should produce. And
the mapping is learnable: after three or four items anyone can see that "the first choice is the
reserved one", and can steer the outcome deliberately.

For an internal reflection activity this is tolerable. For an instrument shown to job applicants,
who have an obvious incentive to present a particular profile, it is the defect most likely to cause
harm — and the spec already forbids it, requiring "สมดุล keyed direction/order".

The fix is cheap and needs no runtime randomness: reverse the authored option order on roughly half
the items in the data file, so the keying stays deterministic, testable and reproducible, while
straight-lining produces an incoherent low-confidence profile instead of an extreme one. It does
require regenerating the scoring fixtures.

### 2. Two respondents who both answer 24 have still not taken the same test

The adaptive block selects items from the respondent's own answers, so candidate A's challenge
questions differ from candidate B's. Fixing the *count* does not make the *instrument* common.

For self-discovery that is a feature — it spends questions where a person is genuinely ambiguous.
For comparing candidates it breaks the premise of comparison: two scores computed from different
items are not on one scale, and "we gave everyone 24 questions" would not survive being asked which
24.

If the candidate use goes ahead, the assessment needs a fixed-item mode: the same 24 items, in the
same order, for every candidate, with adaptive selection disabled. The adaptive version stays for the
internal activity. This is a genuine fork in the product, not a setting.

### 3. Smaller, but expensive to retrofit: the spec's item metadata does not exist

The spec requires each item to carry `version`, `locale`, `status: approved`, `responseScaleId`,
`reviewEvidence`, `contentHash`, `estimatedSeconds`, `exclusionTags` and `reverseKeyed`. The built
`AssessmentQuestion` type carries `id`, `kind`, `context`, `prompt`, `options` and `challengeFor`.

For an internal activity that is fine. For hiring, being unable to say *which version of the
instrument a given candidate took* is a problem the first time a decision is questioned, and
back-filling version history after the fact is not possible. Adding `version` and `contentHash` now
costs little.

## The candidate use conflicts with two decisions already recorded in this repository

This is not a matter of opinion about personality testing; the project has already ruled on it, and
the new plan reverses the ruling.

`docs/HR_DATA_AND_CONSENT.md`, first line of its own summary:

> The assessment is a reflection tool for team development. It is not a psychological diagnosis,
> performance measure, **hiring screen**, promotion criterion, or source of automated employment
> decisions.

The same document, rule 5: *"Do not infer protected characteristics from answers or combine
assessment data with performance, compensation, attendance, disciplinary, **recruitment**, or
promotion records."*

`docs/PRODUCT_BLUEPRINT.md` carries it as a shipping requirement — *"product copy มี non-diagnostic
disclaimer และห้ามใช้เพื่อคัดเลือก/ประเมินผลงาน"* — and as an accepted precondition — *"องค์กรยอมรับว่า
output เป็น self-reflection ไม่ใช่ HR selection/performance signal"*.

Using the assessment as a candidate screen therefore requires those documents to be changed
deliberately, by whoever holds the HR and privacy roles, with the consent language and the
participant-facing copy changed to match. It cannot be reached by leaving them in place and using the
tool differently: participants who consented under the current wording consented to a development
tool.

Two substantive points for that decision, stated once and not laboured:

- The wording exists because a development tool and a selection tool are held to different
  standards. A selection instrument is expected to show job-relevant validity, and MBTI and Enneagram
  typologies are not generally accepted as predictors of job performance — which is why the
  consent document rules the use out rather than merely discouraging it.
- Even if the decision is to proceed, the safer shape is the same instrument used *after* hiring, for
  onboarding and team development, or as an unscored conversation starter that no decision rests on.
  That keeps the candidate-facing value without turning a reflection tool into a gate.

## What is decided and what is not

Decided here, as engineering judgement within the existing spec:

- The premise that respondents answer different numbers of questions is **false for this codebase**;
  no change is needed to prevent it.
- If the count changes, it should change to **24 with the spec's allocation** (8 MBTI, 10 Enneagram,
  6 adaptive), not to 24 by adding four items to the current split.

Needs the Products Owner:

1. **20 or 24.** Recommendation: 24, per the reasoning above. Note it invalidates the current
   `MAX_QUESTIONS` test and the scoring fixtures, both of which are cheap to update.
2. **Reverse-key roughly half the items?** Recommendation: yes, and before any candidate ever sees
   it. This is the highest-value change in this document.
3. **Fixed-item mode for candidates?** Only if item 4 is approved. Recommendation: if candidates are
   in scope at all, the fixed-item mode is not optional.
4. **Does the candidate use go ahead at all,** given that it reverses `HR_DATA_AND_CONSENT.md` and
   `PRODUCT_BLUEPRINT.md`? This is not an engineering decision and is not taken here.

## Record

Raised and analysed 2026-09-10. Nothing in `app/` was changed by this document. The stale
`docs/ASSESSMENT_CONTENT_AUDIT.md` was marked resolved in the same commit, because its findings had
in fact been fixed and its unmarked state had already caused one incorrect status report to the
Products Owner.

---

# Decisions taken 2026-09-10, and the two-mode design

The Products Owner ruled on the first two questions and asked, on the third, whether the internal
and candidate uses could be built as two modes or two phases — the internal run being the outing in
January 2027, the candidate use following it.

## Ruled

1. **24 questions, with the spec's allocation** (8 MBTI foundation, 10 Enneagram foundation,
   6 adaptive). Not 24 by adding four items to the current split.
2. **Reverse-key roughly half the items, before any candidate sees the instrument.**
3. **Two modes, phased.** Design below.
4. Still open, and still not an engineering decision: whether the candidate use proceeds, given that
   it reverses `docs/HR_DATA_AND_CONSENT.md` and `docs/PRODUCT_BLUEPRINT.md`. The Products Owner has
   confirmed the intent to use it with real applicants, so the work proceeds; the document change is
   recorded as a required task rather than treated as a blocker, and the candidate mode ships behind
   a flag that is off until those documents are changed.

## The two modes differ in one thing

| | Mode A — internal | Mode B — candidate |
|---|---|---|
| Items 1-18 | the same 18 foundation items | the same 18 foundation items |
| Items 19-24 | selected from the respondent's own answers | a fixed set, identical for everyone |
| Scoring | the same pure function | the same pure function |
| Result | the same character and narrative | the same, plus the instrument version taken |

Everything except item selection is shared, so this is one branch in one function, not two products.
What makes it real rather than a setting is that the mode and the instrument version must be
**recorded with the response** — being unable to say which instrument a given candidate took is the
metadata gap already noted above, and it becomes load-bearing here.

## Phase 1 is the calibration study for phase 2, and that is the strongest argument for phasing

Mode B currently has no way to choose *which* six fixed items to use. There is no evidence about
which items discriminate, which options are never chosen, or how often the result lands ambiguous.
Picking six by judgement now would be guessing, and guessing is exactly what a candidate-facing
instrument cannot afford.

The January 2027 internal run produces that evidence, if it is instrumented to. What to collect,
aggregate and unlinked to individuals:

- per-item response distribution across the four options — an option nobody picks is a dead option
  that has been costing a quarter of that item's information
- time per item, against the spec's assumed 18 seconds
- straight-lining rate: how many respondents chose the same option position many times in a row,
  which is also the first real test of whether the reverse-keying works
- how often MBTI and Enneagram confidence land "ambiguous", per axis and per core
- how often `wingStatus` is "valid", and — the number that decides mode B's wing behaviour — how
  often it would still have been valid *without* the targeted wing challenge

That last one matters because of how the wing actually works, which is easy to get wrong from the
outside. The wing is **not** read off the wing challenge; `scoreAssessment` derives it by comparing
the two cores adjacent to the top core and requiring a margin of at least 2. The wing challenge only
adds weight to those two. So mode B does not lose the wing — it loses a booster, and will land
`wingStatus: "ambiguous"` more often. Phase 1 measures how much more often, and that number decides
whether mode B reports a wing at all.

## Build order, and why this order

1. **Restructure to 24 (8/10/6).** Changes which items exist, so everything else depends on it.
2. **Reverse-key about half.** Applies to the final item set; doing it first would mean re-keying
   items that are about to be removed.
3. **Item metadata** — `version` and `contentHash` at minimum. Stamps a set that has stopped moving.
4. **Mode A/B switch and per-response mode recording.**
5. **Instrumentation for the phase 1 calibration**, in time for January 2027.
6. After the outing: choose mode B's six fixed items from the calibration data, and decide the wing
   question — then, and only then, is mode B ready to be enabled.

## One deviation from the spec, flagged rather than taken silently

The spec's 8 MBTI foundation items are "I/E, S/N, T/F, J/P แกนละ 2", which leaves **A/T with no
foundation coverage** — it moves entirely into the adaptive block. The spec's adaptive block is
"MBTI Adaptive 2 + Core Challenge 2 + Wing Challenge 2", which does not reserve a slot for A/T
either, so on a literal reading a respondent can finish the assessment with no A/T evidence at all
and still be handed an A or T letter.

Proposal: reserve one of the six adaptive slots for the A/T challenge unconditionally, leaving five
selected. This is a deliberate deviation from the spec's literal split and is recorded here so it is
not mistaken for an implementation slip. The alternative — keeping A/T in foundation and dropping to
9 Enneagram foundation items — undoes the reallocation that is the whole point of moving to 24.

---

# Mode routing, and what candidate mode actually costs

## Ruled 2026-09-10

**A/T: option (ก).** One of the six adaptive slots is reserved for the A/T challenge
unconditionally, leaving five selected. Final shape: 8 MBTI foundation + 10 Enneagram foundation +
(1 A/T + 5 selected) = 24.

## The routing proposal, and the one change it needs

The Products Owner proposed a page before the current profile page: *who are you?* — Employee routes
to the existing name / team / character page, Candidate routes to a separate form whose fields are
still to be agreed with HR.

This is the right shape, and it is better than a configuration flag for a reason worth stating: page
one is exactly where the two **consent texts** have to diverge. An employee consents to a team
development activity; a candidate has to be told the assessment is part of an application, what is
kept, for how long, and who sees it. Putting the fork in the UI puts it where that difference can be
shown honestly.

The change it needs: **the respondent must not be the one who chooses the mode.** If candidate mode
is a button anyone can press, then a candidate can press "Employee" instead and take the adaptive
version, and the fixed-item guarantee — the whole reason candidate mode exists — is gone.

Candidate mode should be reached by a **one-time invite link issued by HR**, not by self-selection.
That buys four things at once:

- the mode is decided by whoever issued the link
- one response per invite, which is retake prevention (see below — this is not optional)
- the candidate's identity comes from the invite, so the form asks for less personal data
- an audit trail: who was invited, when, and which instrument version they were served

The self-select page still earns its place: it is the door for employees, and it is where a candidate
who arrives without a link is told to ask HR for one.

## The thing that has to be said before January is planned around

**There is no persistence in this application at all.** `app/page.tsx` holds the entire session in
`useState` — profile, answers, challenges, result. Nothing is written anywhere. The consent checkbox
on the profile page says so in as many words:

> ไม่มีการส่งข้อมูลออกหรือบันทึกลงฐานข้อมูล

For the internal outing this is a feature: no data leaves the browser, so the privacy surface is
almost nil. For candidate mode it is a wall. Every single thing candidate mode is for requires
storage that does not exist:

| Needed for candidates | Exists today |
|---|---|
| HR can see the result | no — the result lives in one browser tab |
| one attempt per candidate | no — a reload starts over, unlimited |
| record of which instrument version was taken | no |
| record of which mode was served | no |
| retention and deletion per PDPA | no |

**Retake prevention is the decisive one.** Without it, reverse-keying and fixed items buy nothing:
a candidate who does not like the result reloads and tries again until they do. Everything in the
integrity story above rests on the response being recorded once.

So candidate mode is not "a router page plus fixed items". It is a router page, fixed items, a
backend, invite tokens, a second consent text, retention rules, and an HR-facing view. That is a
project, not a phase-2 setting — and it is a second reason the January outing should run in mode A
only, which needs none of it.

## "We are not fixed on time for candidates — should we add more questions, or analyse deeper?"

Not more of the same questions. Adding personality items past 24 makes the *measurement* more
reliable without making the *decision* better, because the ceiling is not item count — it is that
MBTI and Enneagram types are not accepted predictors of job performance. Sixty items would measure
the same non-predictor more precisely.

What does add value, cheapest first.

**1. Response-quality indicators. Zero extra questions.** Everything needed is already in the
answer records:

- straight-lining: how many times in a row the same option position was chosen. With the
  reverse-keying from decision 2, a straight-liner produces a self-contradicting profile, and this
  detects it explicitly rather than leaving it to look like a confident result.
- time per item, and total time. Implausibly fast responses are a quality signal.
- internal consistency: the foundation and adaptive items covering the same axis should agree. When
  they do not, say so.

Output should be a plain statement — *"this response set does not look internally consistent; treat
the profile as indicative only"* — not a hidden adjustment to the score.

**2. Two or three consistency items. About one minute.** Near-duplicate items placed far apart in the
sequence. Standard practice in any instrument used for decisions, cheap to write, and it turns
consistency from an inference into a measurement.

**3. Situational judgement items, per role. About six minutes.** This is where predictive validity
actually lives: a real situation from the role, four plausible responses, scored against what the
hiring manager considers good judgement. It is also the one item type that a candidate cannot game
by knowing the personality mapping. But the content is role-specific and has to be written with the
hiring manager, so it is a separate project rather than an extension of this one.

**4. Interview prompts as the output. The best value here, and the recommendation.** Instead of
handing HR a type, hand them **three or four structured questions to ask this candidate**, derived
from the profile — the places where this person's answers were ambiguous, the strengths worth probing,
the working-style questions worth asking out loud.

This is the recommendation for the candidate use, and it is worth being explicit about why: it turns
the whole problem into a feature. The assessment stops being a gate that has to defend its
predictive validity, and becomes an aid that makes a human interview better — which is a use no
consent document has to be rewritten to permit, and which is more useful to HR than a four-letter
label. It also removes the incentive to game: there is no "good result" to aim at, because the
output is questions, not a score.

**Time budget, if the candidate flow is not time-boxed.** Candidate goodwill runs out somewhere
around 15-20 minutes for an unpaid assessment. Against that: 24 personality items at the spec's 18
seconds is about 7 minutes, plus 3 consistency items about 1 minute, plus 6-8 situational items about
6 minutes — roughly 14 minutes, which fits with room left. Length is not the constraint; content
type is.

## What to ask HR, before any of the candidate work is designed

The Products Owner is going to ask HR which fields the candidate form should collect. That is the
smaller half of the question. The list worth taking to that conversation:

1. **What is it for — screening out, ranking, or interview preparation?** Every other answer follows
   from this one, and only the third needs no change to `HR_DATA_AND_CONSENT.md`.
2. **At which stage does the candidate take it** — before any human reads the CV, after a CV screen,
   before the interview, or after it?
3. **What decision, if any, rests on it?** If the honest answer is "none, it informs the
   conversation", say that in the candidate-facing text; it is both true and reassuring.
4. **The minimum fields.** Fewer is better, and some fields should be actively refused: date of
   birth or age, photograph, marital status, religion, nationality and health or disability
   information all create discrimination exposure, and several are sensitive personal data under the
   Thai PDPA with a higher consent bar. The assessment needs none of them.
5. **Retention and access.** How long may candidate responses be kept, who may read them, and what
   happens to them when the candidate is not hired.
6. **Who tells the candidate what this is for, and where does that text live** — the invite email,
   page one, or both.

One note on the existing gender field, which matters more in candidate mode than internally. The UI
already asks it correctly — the legend is *เลือกภาพตัวละครที่ใกล้เคียงกับคุณ*, a character choice, not
a demographic question — and `app/page.tsx` maps it to presentation only, never to scoring. But the
field is *named* `gender` in `PROFILE_FIELDS`. Stored under that name in a record attached to a job
application, it will read as demographic collection whatever the UI said, to anyone auditing later.
The three-field profile contract is protected by tests and should not be broken casually; the rule
instead is that **no candidate record persists this field under the name `gender`** — it is a
presentation preference and should be stored as one, or not stored at all.

---

# Retake control without HR labour, and the account-migration constraint

## The proposal, and why name-matching is not the gate

The Products Owner does not want HR generating a link per candidate, and proposed instead: the
candidate fills Thai name, English name and nickname, and if two of the three match an existing
record, the assessment is refused with a message telling them to contact HR.

The logic is sound as a *signal* and unsound as a *gate*, for four reasons:

1. **It is bypassed by changing two fields.** The rule blocks at two matches out of three, so
   altering the nickname and the English spelling leaves one match and passes. That takes seconds.
2. **False positives cost more than false negatives here.** Common Thai given names plus their
   obvious transliteration will hit two of three for two different people. The person penalised is a
   real applicant, told to contact HR — which is the HR work the proposal was meant to avoid.
3. **Transliteration is not stable even for one person.** Gorawit / Korawit / Gorawith are the same
   applicant spelling their own name differently on different days, so the rule produces both false
   positives and false negatives from the same cause.
4. **It does not avoid the backend.** Checking a name against earlier submissions requires storing
   every earlier submission, so the check needs the database it was meant to work around.

There is also a privacy defect in the proposed message. *"เคยมีการทำแบบทดสอบนี้มาแล้ว"* shown to
whoever typed the name confirms that a person with that name is in the system — so anyone can probe
names to learn who applied. A refusal message must never reveal whether a record exists.

## What to do instead, cheapest first

**Layer 1 — remove the reason to retake. Already decided, and it does most of the work.**

The output is going to be interview questions rather than a type or a score. That change dissolves
most of this problem rather than mitigating it: there is no flattering result to retake toward, and
gaming has no target, because the output is questions for the interviewer. A duplicate submission
then costs data tidiness, not integrity. This is worth saying plainly because it means the heavy
machinery below is optional rather than required.

**Layer 2 — a self-serve one-time link that costs HR nothing: email magic link.**

The candidate enters an email address, the system emails a single-use link, and clicking it starts
the assessment. That email can never start another. It is fully automated, so HR generates nothing,
and it is a real gate rather than a soft one because it requires control of a mailbox. It also
supplies the identity record and the channel for sending the result, so it replaces form fields
rather than adding a step. This is the standard pattern and the recommendation.

**Layer 3 — keep the name check, but as an HR-side flag rather than a candidate-facing block.**

Same comparison, opposite direction: when a new submission's name closely matches an earlier one,
show that on the HR view — *"similar to an earlier submission, please check"* — and let a person
decide. No applicant is ever wrongly refused, HR only looks when there is a genuine collision, and
nothing is disclosed to whoever typed the name.

**A weaker fallback if there is no email sending.** One link per job posting rather than per
candidate, with one attempt per browser marked in local storage. Bypassable by clearing storage, so
it stops the casual second attempt and nothing more — which, given layer 1, may be enough.

## The account-migration constraint changes the storage advice

The Products Owner explained the plan: build the web app close to complete on this account, then move
the whole repository and its data to an account owned by HR, because employee data is confidential
and must live in an account the Products Owner cannot create. Nothing has been built for the outing
database yet.

That constraint makes one piece of advice much stronger: **do not provision a database on this
account.** Anything created here — a hosted Postgres, a Firebase or Supabase project — becomes a
live-data migration across accounts later, which is exactly where personal data gets lost, duplicated
or exposed. The confidentiality requirement is not only about who can read the data at the end; it is
about the data never having been on the wrong account in the first place.

The shape that respects it:

- Define a **narrow storage interface** — save a response, read a response, check for a duplicate —
  and ship a no-op implementation. The application stays complete and testable with nothing stored,
  which is also exactly what the outing needs.
- The **HR account provisions the real implementation** and plugs it in after the migration. Then no
  identified response ever touches this account, and ownership is correct from the first write rather
  than corrected afterwards.

## The one storage thing that does have a January deadline

Everything above can wait — except the calibration data. Recommendation above was that the outing is
what tells phase 2 which six items to fix, which options are dead and whether the reverse-keying
works. **If nothing records that at the outing, the data does not exist and phase 2 has no basis but
judgement.**

What it needs is much less than the candidate database: no names, no profile, no identity — only the
answers, the timings and the resulting confidence, written once at the end. Two ways to get it
without provisioning anything on this account:

1. **Post to a Google Form or Sheet owned by the HR account.** Near-zero engineering, the data lands
   in HR's Google account from the first row, and it needs no backend at all. This is the pragmatic
   recommendation given the constraint.
2. Offer a file download at the end of the result page and have the facilitator collect them. Works
   with no network dependency, but relies on people at a party doing an errand.

Either way the consent text has to say it, and the current text — *ไม่มีการส่งข้อมูลออกหรือบันทึกลง
ฐานข้อมูล* — becomes false the moment anything is posted anywhere. Anonymous aggregate collection is
a small change to that sentence, not a rewrite, but it is not optional.

---

# The 24-item restructure: what changes, and why these two new items

## Enneagram foundation coverage is not balanced today, and the imbalance picks the new items

Counting how many of the eight Enneagram foundation items give each core a **primary** (weight-2)
option:

| Core | Items giving it a primary | |
|---:|---|---:|
| 1 | f-e-1, f-e-3, f-e-5, f-e-7 | 4 |
| 2 | f-e-1, f-e-3, f-e-5, f-e-7 | 4 |
| 3 | f-e-1, f-e-3, f-e-5, f-e-7 | 4 |
| 4 | f-e-1, f-e-3, f-e-6, f-e-7 | 4 |
| 5 | f-e-2, f-e-4, f-e-5, f-e-8 | 4 |
| 6 | f-e-2, f-e-4, f-e-6, f-e-8 | 4 |
| 7 | f-e-2, f-e-4, f-e-6, f-e-8 | 4 |
| **8** | f-e-2, f-e-4 | **2** |
| **9** | f-e-6, f-e-8 | **2** |

**Cores 8 and 9 run on half the evidence of every other core.** Someone whose real core is 8 or 9 is
measured by two items where everyone else is measured by four, so those two cores are the most likely
to be missed or under-scored. That is a design imbalance rather than a matter of taste, and it
decides what the two new items should be for.

There is a second, related gap. Cores 8 and 9 are **adjacent**, so telling them apart is exactly a
wing decision for anyone landing on either — and no item currently offers 8 and 9 as primaries in the
same question, so that discrimination is never asked directly. Both new items fix that too by
carrying 8 and 9 as two of their four options.

Resulting coverage: 1 → 5, 2 → 5, 3 → 5, 4 → 4, 5 → 5, 6 → 4, 7 → 4, 8 → 4, 9 → 4. A range of 4-5
instead of 2-4.

## The two new items, drafted for review

Written to the house style the post-audit rewrite established: a named work situation with a
timeframe, one motive per option, four options in parallel grammatical form, and no option more
socially flattering than the others.

**`f-e-9`** — context `เมื่อเห็นต่าง`
prompt: *เมื่อทีมเห็นไม่ตรงกันในเรื่องงาน คุณอยากให้เรื่องนั้นจบลงแบบไหน?*

| Option | Core |
|---|---:|
| จบโดยไม่มีใครต้องกลืนความเห็นไว้ | 8 |
| จบโดยทุกฝ่ายยังทำงานร่วมกันได้ | 9 |
| จบด้วยข้อสรุปที่ตรวจสอบย้อนได้ | 1 |
| จบเมื่อเข้าใจเหตุผลของทุกฝ่ายแล้ว | 5 |

**`f-e-10`** — context `เมื่องานถูกแทรก`
prompt: *เมื่อมีงานแทรกเข้ามากลางสัปดาห์ อะไรที่คุณอยากรักษาไว้มากที่สุด?*

| Option | Core |
|---|---:|
| สิทธิ์จัดลำดับงานของตัวเอง | 8 |
| จังหวะงานที่ไม่ถูกดึงไปหลายทาง | 9 |
| คำมั่นที่ให้ไว้กับคนอื่น | 2 |
| ผลลัพธ์ที่ตั้งเป้าไว้ | 3 |

## Which two MBTI items leave, and where A/T goes

The spec's 8 MBTI foundation items are two each for I/E, S/N, T/F and J/P, which means **`f-at-1` and
`f-at-2` leave foundation**. A/T is then carried entirely by the `c-at` dimension challenge in the
reserved adaptive slot, per ruling (ก) — so every respondent still meets A/T exactly once, which the
spec's literal split would not have guaranteed.

## Proposed adaptive block, 6 slots

| Slot | Content | Selection |
|---:|---|---|
| 1 | `c-at` | always, unconditionally |
| 2-3 | dimension challenges | the two MBTI axes with the smallest margins |
| 4-5 | core challenges | the top two candidate cores |
| 6 | wing challenge | for the leading core |

The Enneagram side gets three of the five selected slots because it is the side with the thinnest
evidence, which is the same reasoning that moved two items into it.

## What this breaks, and it is all cheap

- `MAX_QUESTIONS` 20 → 24, and the assertion in `scripts/run-scoring-tests.mjs`.
- `selectChallengeQuestions` returns two questions; it must return six, and its return type is a
  fixed-length tuple.
- The scoring fixtures in `app/lib/assessment-fixtures.ts` are answer sets of the old length and must
  be regenerated.
- Nothing in the character, asset or resolver layers is touched. The visual work in flight is
  unaffected.

---

# HR's answers, and what they resolve

On 2026-09-10 HR (Mook Wiparat) answered the three questions taken from the list above. Recorded
here because they settle the item this document could not, and they change the risk picture
substantially.

| Question | HR's answer |
|---|---|
| At which stage does the candidate take it? | **After the first interview, before the final interview** |
| What is it for? | **To know the candidate's disposition, as support for the interview** — *ประกอบการสัมภาษณ์* |
| How long is it retained? | **Within a PDPA-compliant retention period**, set deliberately rather than kept until forgotten |

## This is not the use the repository forbids

`HR_DATA_AND_CONSENT.md` rules out a **hiring screen**, a **promotion criterion** and a source of
**automated employment decisions**. What HR has described is none of those: the candidate has already
passed a human interview, nothing is screened out by the result, nothing is ranked by it, and the
output informs a conversation a person then has. That is the "safer shape" this document recommended
two sections ago, arrived at independently by HR.

So the conflict is much smaller than it looked, and much more defensible. `HR_DATA_AND_CONSENT.md`
still needs a controlled amendment, because attaching a named candidate's responses to a recruitment
process is exactly what rule 5 tells us not to do — but the amendment to write is now:

> may be used as **interview-preparation material** for a candidate who has already passed the first
> interview, with no selection, ranking or employment decision resting on the result

rather than "may be used to screen candidates". That is a sentence HR and privacy can sign, and the
participant-facing text can say the same thing truthfully.

Two things this makes load-bearing rather than optional:

- **The output must be interview questions, not a type or a score.** It was the recommendation
  before; it is now what HR asked for in their own words. If the result page hands the interviewer a
  four-letter label, the tool becomes the thing the consent document forbids no matter what the
  document says.
- **The retention period must be a stated number, chosen now.** HR's own note is that past practice
  kept records until everyone forgot about them. A number in the consent text and an actual deletion
  are two different commitments and both are needed.

## The invite flow: HR's and the Products Owner's design is better than the magic link

The magic-link recommendation assumed the system had to prove control of a mailbox. At this stage —
after a human interview, as interview preparation, with no decision resting on it — that proof is
not worth the infrastructure it costs. The design the Products Owner drafted with HR fits the
constraints better:

1. HR keeps a sheet of invited candidates, which is data they already hold from the application.
2. The invitation email carries **one generic link**, in the existing HR email template. Nothing is
   generated per candidate.
3. On page one the candidate enters the email address they applied with.
4. A script checks it against the sheet: on the list and not yet used → proceed and mark it used;
   otherwise → refuse.

Why this is the better answer here, not merely the cheaper one:

- **No email-sending infrastructure at all**, where a magic link needs it.
- **The link lives where the Products Owner said it belongs** — in the HR template that already
  explains what the candidate is about to do and why.
- **HR generates nothing.** Pasting candidate details into a sheet is work they already do.
- **It lands on the right account from the first row.** A Google Sheet plus Apps Script is owned by
  the HR Google account, which is precisely what the migration constraint requires — no personal data
  is ever created on the Products Owner's account and later moved.

What it gives up: it is a whitelist, not proof of mailbox control, so someone who knows a
candidate's email address and has the link could impersonate them. At this stage and for this
purpose that risk is not worth engineering against.

One rule to carry into it: **the refusal message must read the same whether the email is absent from
the list or already used.** Otherwise anyone with the link can test addresses to learn who is
interviewing here. A single message — "this link cannot be used; please check you used the same
address you applied with, or contact HR" — is helpful to someone who mistyped and reveals nothing.

## Apps Script as the storage layer: right for this scale, and name where it stops being right

Apps Script behind a Sheet answers three needs at once — the candidate whitelist, the single-use
marker, and the anonymous outing calibration write — with no server provisioned and everything owned
by the HR account.

Its real limits, so they are known rather than discovered: a web-app call takes a few hundred
milliseconds to a couple of seconds, quotas are per-account and per-day, a Sheet becomes unpleasant
past a few tens of thousands of rows, and cross-origin calls from the app need the response headers
set deliberately. For a few dozen outing participants and a handful of candidates a week, none of
that binds. It would bind if this ever became a public self-serve assessment at thousands of
responses a month, and that is the point to move to a real database — in the HR account, which by
then already owns the data.

## Mid-October changes the critical path

The Products Owner set a date: the outing data collection has to be taking shape by **mid-October**,
because the repository and data then move to the real account and the onsite activity design is
built around it. That is about five weeks from this record.

The consequence worth stating plainly: **the instrument has to be frozen before the outing collects
anything.** Calibration data describes the instrument that produced it, so if the item set or the
option keying changes afterwards, the data describes a test that no longer exists and phase 2 is back
to judgement. That moves two pieces onto the critical path that were previously just "next":

**Must be done and frozen before the outing:**

1. The 24-item restructure — 8 MBTI + 10 Enneagram + (1 A/T + 5 selected).
2. Reverse-keying about half the items. It is part of the instrument, so it cannot come after the
   data.
3. The anonymous calibration write — Apps Script and Sheet on the HR account, no names.
4. The consent sentence, which currently says nothing is saved and stops being true at step 3.

**Can follow the outing:**

- Candidate mode, the router page, the whitelist check and the retention mechanics.
- The interview-question output.
- Item `version` and `contentHash` — wanted before candidates, not before the outing, though
  stamping the frozen set in step 1 is the natural moment and costs nothing then.

## Thai wording, second pass

The Products Owner reviewed the two drafted items. Four options read as awkward Thai and are
rewritten below; the reasoning is recorded because two of the rewrites had to avoid blurring a core
into its neighbour.

| Item | Core | First draft | Revised |
|---|---:|---|---|
| `f-e-9` | 8 | จบโดยไม่มีใครต้องกลืนความเห็นไว้ | **จบโดยไม่ต้องฝืนยอมตาม** |
| `f-e-10` | 8 | สิทธิ์จัดลำดับงานของตัวเอง | **การจัดลำดับงานของตัวเอง** |
| `f-e-10` | 9 | จังหวะงานที่ไม่ถูกดึงไปหลายทาง | **จังหวะการทำงานที่ไม่ถูกเร่ง** |
| `f-e-10` | 2 | คำมั่นที่ให้ไว้กับคนอื่น | **สิ่งที่รับปากคนอื่นไว้** |

Two notes on the choices:

- The core 8 option in `f-e-9` could easily have become *"จบโดยทุกคนได้พูดสิ่งที่คิด"*, which is
  natural Thai but is **core 9's motive, or core 2's** — everyone getting a voice is harmony, not
  self-assertion. Core 8's motive is not conceding, so the revision keeps *ไม่ต้องฝืนยอมตาม*, which
  contrasts sharply with the core 9 option sitting directly beneath it.
- The core 9 option in `f-e-10` uses *ไม่ถูกเร่ง* deliberately: "unhurried" is core 9's own
  expression word in `scripts/generate-asset-prompts.mjs` and its character definition, so the item
  and the character now describe the same person.

The Products Owner accepted *ผลลัพธ์ที่ตั้งเป้าไว้* (core 3) and did not flag the core 1 and core 5
options in `f-e-9`, which stand as drafted.
