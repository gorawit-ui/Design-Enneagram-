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
