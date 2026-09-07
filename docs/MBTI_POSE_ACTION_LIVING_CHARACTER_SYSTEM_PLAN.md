# M2.6.2 — MBTI Pose, Action & Living Character System Plan

## Status and authority

This is the documentation-only **Plan** phase for the TDFB Personality Quest.
It defines future production and implementation contracts but authorizes no
code change, image generation, scoring or assessment change, package change,
deployment, commit, push, or pull request.

The system is a reflection aid. Its visual behaviors are editorial metaphors,
not diagnoses, predictions, fixed traits, or employment-decision evidence.

## Locked system boundaries

| Input layer | May control | Must not control |
|---|---|---|
| Enneagram Core | Emotional baseline and inner-motive story | MBTI action, body shape, status, competence, gender, or scoring |
| MBTI | Observable attention style, pose family, gaze, gesture, action, and existing Scene Kit | Body shape, ability, rank, attractiveness, gender, or certainty |
| Wing | One small accent inside an existing object/action | Body, pose contract, status, new focal object, or new action |
| A/T | Ambient tone only: `settled` or `reflective` | Face, pose, distress, pathology, confidence, or mental-health meaning |
| Confidence | Whether the specific recipe or neutral fallback is shown | Guessing a missing/ambiguous value or implying certainty |
| Presentation | Approved localized face/hair presentation only | Pose, hands, outfit, prop placement, lighting, crop, expression intensity, or result logic |

All characters use the same balanced adult proportion system. Personality,
competence, rank, attractiveness, gender, weight, build, and ability must never
be encoded through body shape. Module 1 scoring, question flow, the 20-question
limit, challenge selection, profile/consent, and the existing result contract
remain frozen.

---

## Products Owner handoff — one-page brief

### Goal

Make result characters feel alive through deterministic, restrained differences
in attention, facial expression, pose, gesture, observable action, and Scene Kit
context while preserving fairness, accessibility, technical consistency, and
the authority of the existing assessment result.

### Release-model decision

**Use four controlled pose families, not 16 unique MBTI pose systems.** All 16
types receive a distinct behavior recipe inside one family. This keeps pose
construction, parity review, responsive composition, and later Core expansion
maintainable without reducing the 16 Scene Kits to interchangeable decoration.

The four families are:

1. `observant-curiosity` — balanced stance, attention toward a map/object, small
   analytical gesture.
2. `warm-engagement` — open shoulders, welcoming hand/recipient orientation,
   natural listening posture.
3. `idea-spark` — slight exploratory lean, hand linking or presenting a
   possibility, contained delight.
4. `grounded-action` — stable stance, direct attention to a plan/object,
   composed readiness to act.

### Scope

- Plan deterministic behavior for all 16 MBTI types.
- Specify four pose boards, four Gate C pilot storyboards, a machine-processable
  result contract, fallbacks, tests, and implementation readiness.
- Bound the first production pilot to Core 2 × INTJ, ISTJ, ENFP, and ESFP ×
  Female, Male, and Neutral: exactly 12 candidate assets.
- Preserve the Core 2 emotional baseline, Wing accent, A/T ambient behavior,
  and distinct existing Scene Kits without changing the pose contract.
- Keep all other types and all other Cores out of production until pilot gates pass.

### Success metrics

- 16/16 type rows resolve deterministically to one complete recipe.
- 12/12 pilot assets meet the technical contract and 4/4 presentation trios
  pass parity review.
- 4/4 pilot type actions are distinguishable at review size without caricature,
  including within the two shared pilot families.
- 4/4 Scene Kits remain distinguishable by focal object, secondary objects,
  anchor, hierarchy, and visual story.
- 0 unresolved, missing, or ambiguous required values render a guessed type.
- 0 bias-review findings imply intelligence, weakness, dominance,
  employability, body type, gender value, diagnosis, or comparative worth.
- 360 px, 390 px, and desktop checks have no horizontal overflow, clipped
  action, obscured face/hands/primary object, or layout shift above the agreed budget.
- Existing scoring and result-contract regression suites remain unchanged and pass
  in a future implementation task.

### Principal risks and controls

| Risk | Control |
|---|---|
| Type caricature or workplace-status coding | Prohibited-reading field per recipe; independent bias review; equal production value |
| Four families collapse into generic gestures | Pose-board silhouettes plus action/object checks at thumbnail and mobile size |
| Types sharing a family become indistinguishable | Type-specific gaze, hand action, object relationship, and Scene Kit review |
| Presentation parity drifts | Female master followed by Male and Neutral derivatives; locked overlay comparison |
| Core, Wing, or A/T leaks into MBTI pose | Resolver ownership and precedence tests; Wing/A-T isolation cases |
| Asset count expands uncontrollably | Hard pilot boundary and feature flag; no other Core/type assets before approval |
| Ambiguous results overstate certainty | Neutral pose/expression fallback; never choose a top candidate |
| Reference imagery imports financial stereotypes | Use only general liveliness/composition inspiration; exclude wealth, salary, rank, trading, luxury, and performance claims |

### Decision owners

| Decision | Accountable owner | Required consultees |
|---|---|---|
| Scope, pilot, Go/No-Go | Products Owner | BA, Design, Engineering, QA, HR/Privacy |
| Behavior semantics and traceability | Sr. Business Analyst | Product, HR/Privacy, UX Writing |
| Schema, resolver, fallback, performance | Sr. System Analyst | Front-end, QA, Accessibility |
| Pose/action art direction and parity | Sr. UX/UI Designer | Product, HR/Privacy, Accessibility |
| Implementation readiness | Sr. Front-end Developer | System Analyst, QA, Design |
| Final release approval | Products Owner | All gate owners |

### Timeline assumptions

Timing starts only after named owners and the source/reference policy are
approved: T0 Plan sign-off; T0+1 production cycle for four Female pilot masters;
T0+1 cycle for Male/Neutral derivatives; T0+1 review cycle for technical,
parity, bias, responsive, and accessibility evidence; then a separate
implementation estimate. These are sequencing assumptions, not delivery dates.

### Go / No-Go

**GO to pilot production** only when PO, BA, SA, and UX/UI Plan handoffs are
approved, source ownership is documented, and the 12-asset boundary is accepted.
**NO-GO** for implementation or expansion until all pilot gates pass. **HOLD**
uses the current 12 emotional candidates as fallback and forbids a 432-asset
expansion.

---

## Sr. Business Analyst handoff

### Sixteen-type behavior matrix

The `type` and rationale are internal configuration/review data. The
accessibility description is participant-facing visual copy: it contains no
type letters, diagnosis, fixed-trait claim, rank, or stereotype.

| Type | Behavior rationale | Emotional moment | Pose family | Gaze cue | Gesture cue | Observable action | Primary scene object | Prohibited reading | Accessibility description |
|---|---|---|---|---|---|---|---|---|---|
| INTJ | Attend to a structured possibility before choosing a path. | Focused, thoughtful attention | `observant-curiosity` | Toward the nearest decision point on the map | One relaxed hand indicates a connection | Traces one route between map points | `strategy-map` | Aloof genius, mastermind, superiority, suspicion | A person calmly traces a route on a layered map. |
| INTP | Examine how open ideas relate without forcing closure. | Quiet exploratory interest | `observant-curiosity` | Between the object and an open hypothesis tile | Small linking gesture with relaxed fingers | Compares two connected concept nodes | `concept-lab` | Absent-minded genius, social detachment, impracticality | A person compares two connected idea cards with a thoughtful expression. |
| INFJ | Notice a relationship pattern with gentle concentration. | Thoughtful relational attention | `observant-curiosity` | Toward a shared-context point | Open palm lightly marks a relationship | Connects one context point to another | `people-map` | Mystic insight, mind-reading, moral superiority | A person gently connects two points on a shared-context map. |
| INFP | Attend to meaning while leaving interpretation open. | Reflective, receptive curiosity | `observant-curiosity` | Toward an open reflection card | One hand steadies; the other indicates a detail | Places a small marker beside a reflection card | `meaning-notebook` | Fragility, dreaminess, sadness, impracticality | A person places a small marker beside an open reflection card. |
| ISTJ | Check a concrete sequence carefully and calmly. | Steady practical attention | `observant-curiosity` | Along the next visible checklist item | Compact point beside, not on, the list | Aligns one route marker with the checklist | `operations-check` | Rigid rule-enforcer, dullness, obedience, greater reliability | A person aligns a route marker beside a practical checklist. |
| ISTP | Inspect how a visible object detail works. | Calm hands-on curiosity | `observant-curiosity` | At a specific feature of the object | Small measuring or comparison gesture | Rotates a detail card to inspect it | `tool-detail` | Mechanic stereotype, emotional coldness, lone-wolf competence | A person turns an object-detail card for a closer look. |
| ENFJ | Invite attention toward a shared next step. | Warm, directed engagement | `warm-engagement` | Alternates naturally between recipient zone and shared path | Welcoming hand opens toward the route | Presents one shared route point for consideration | `shared-path` | Charismatic leader, savior, manipulation, authority | A person opens a hand toward a shared route card. |
| ESFJ | Make a practical contribution visible to others. | Responsive shared warmth | `warm-engagement` | Toward the recipient zone and contribution tile | Open hand receives or passes a tile | Places one contribution tile into a shared arrangement | `team-pulse` | Servility, popularity, hosting stereotype, approval-seeking | A person places a contribution tile into a shared arrangement. |
| ISFJ | Offer a grounded support detail without assuming need. | Quiet attentive engagement | `warm-engagement` | Toward a practical support point, then recipient zone | Gentle open-palm offer | Positions a support marker within easy reach | `support-route` | Caregiver destiny, self-sacrifice, submission, gender coding | A person places a practical marker within easy reach. |
| ISFP | Share a present detail and leave room for response. | Soft present-moment engagement | `warm-engagement` | Toward a sensory detail, then recipient zone | Relaxed hand presents the detail | Turns a detail tile outward for shared viewing | `craft-detail` | Artist stereotype, delicacy, passivity, greater taste | A person turns a textured detail card outward for shared viewing. |
| ENTP | Open more than one route for exploration. | Alert, contained delight | `idea-spark` | Moves between a central idea and two branches | Linking hand opens toward a second branch | Adds a branch to a possibility field | `possibility-field` | Hyperactivity, argumentative cleverness, chaos, childishness | A person adds one branch to an open possibility board. |
| ENFP | Connect a possibility to shared context. | Bright but restrained interest | `idea-spark` | From the possibility card toward the recipient-side connection | One hand links two open cards | Extends a connection between possibility cards | `connection-garden` | Scattered enthusiasm, manic energy, childishness, social superiority | A person links two open possibility cards with contained delight. |
| ESFP | Bring a concrete interaction into the present exchange. | Warm, contained liveliness | `idea-spark` | Toward an activity tile and recipient zone | Presents one active tile without flourish | Moves an activity tile into the shared exchange | `live-exchange` | Entertainer stereotype, attention-seeking, impulsiveness, flirtation | A person moves an activity tile into a shared exchange. |
| ENTJ | Orient a plan toward a visible next milestone. | Composed forward readiness | `grounded-action` | Directly toward the next milestone | Flat, relaxed hand indicates direction | Sets the next milestone card in line | `direction-board` | Boss, dominance, aggression, greater competence or employability | A person calmly sets a milestone card into a forward plan. |
| ESTJ | Coordinate a concrete next action without commanding. | Clear practical readiness | `grounded-action` | Toward the immediate action marker | Measured placement gesture | Places one action marker into an ordered board | `action-board` | Authoritarian manager, rigidity, toughness, rank | A person places an action marker into an ordered board. |
| ESTP | Choose a visible route and begin a contained action. | Present, steady readiness | `grounded-action` | Along the first segment of an open route | Direct but relaxed hand aligns the start marker | Sets a route marker at the next practical step | `action-route` | Recklessness, physical dominance, thrill-seeking, sales stereotype | A person sets a marker at the start of an open route. |

### Traceability to the final visual result

| Source dimension | Required/allowed values | Visual contribution | Precedence and isolation | Missing/ambiguous behavior | Prohibited deterministic claim |
|---|---|---|---|---|---|
| Core | `1..9`, or unresolved | Emotional baseline, inner motive, core prop/motif | Established first; later layers cannot contradict it | Unresolved Core → neutral fallback | Core proves morality, health, role, or need |
| MBTI | 16 supported values, or unresolved | Pose family, gaze, gesture, observable action, Scene Kit | Applied only after a valid Core; cannot change body or scoring | Missing/invalid/ambiguous MBTI → neutral fallback | Type proves intelligence, skill, employability, or behavior |
| Wing | Adjacent valid Wing, unavailable, or ambiguous | One small accent inside the selected object/action | Applied after MBTI; never changes pose/action/object hierarchy | Omit accent | Wing proves a second identity, rank, or capability |
| A/T | `A`, `T`, or unavailable | Ambient `settled`, `reflective`, or neutral tone | Applied after scene composition; never changes character pixels/face | Neutral ambient tone | A means confident/healthy; T means anxious/unwell |
| Confidence | clear, close, ambiguous, or missing | Specific recipe eligibility | Overrides specificity: ambiguous/missing forces fallback | Neutral pose/expression and no guessed type | Confidence score proves certainty about a person |
| Presentation | `female`, `male`, `neutral` | Approved localized face/hair presentation | Last asset selector; all locked parity fields remain identical | Invalid/missing → `neutral` presentation only when result itself is otherwise valid | Presentation predicts type, role, competence, or body |

### Edge cases and claim controls

- Missing, unsupported, or ambiguous Core or MBTI uses the neutral
  pose/expression fallback. Never use the highest candidate as a hidden winner.
- Close confidence follows the existing result contract; if that contract marks
  the result ambiguous, fallback wins. This visual layer cannot reinterpret thresholds.
- Missing/invalid presentation selects the first-class Neutral presentation only
  when Core and MBTI are valid; it does not infer presentation from any result.
- Invalid or non-adjacent Wing is omitted. It never blocks an otherwise valid
  base recipe and never falls back to the closest Wing.
- Missing A/T uses neutral ambient tone. It never changes face or pose.
- Missing asset, schema-version mismatch, unsupported Core/type combination, or
  disabled feature flag uses the current approved emotional candidate/fallback.
- Participant-facing copy describes only visible composition and action. It must
  not expose MBTI letters or say the participant *is* an emotion, behavior,
  diagnosis, capability, leader, worker, or fixed personality stereotype.

---

## Sr. System Analyst handoff

### Machine-processable visual-result schema

The following JSON-compatible contract is normative for a future implementation.
Enums are closed; unknown values fail to fallback rather than being coerced.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "tdfb://schemas/living-character-visual-result/v1",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "source", "resolution", "visual"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": ["core", "mbti", "wing", "assertiveness", "confidence", "presentation"],
      "properties": {
        "core": { "type": ["integer", "null"], "minimum": 1, "maximum": 9 },
        "mbti": { "type": ["string", "null"], "enum": ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP", null] },
        "wing": { "type": ["string", "null"] },
        "assertiveness": { "type": ["string", "null"], "enum": ["A", "T", null] },
        "confidence": { "type": "string", "enum": ["clear", "close", "ambiguous", "missing"] },
        "presentation": { "type": ["string", "null"], "enum": ["female", "male", "neutral", null] }
      }
    },
    "resolution": {
      "type": "object",
      "additionalProperties": false,
      "required": ["mode", "reason"],
      "properties": {
        "mode": { "type": "string", "enum": ["specific", "fallback"] },
        "reason": { "type": "string", "enum": ["valid", "flag-disabled", "ambiguous-result", "missing-value", "unsupported-combination", "missing-asset", "schema-error"] }
      }
    },
    "visual": {
      "type": "object",
      "additionalProperties": false,
      "required": ["assetId", "assetPath", "poseFamily", "sceneKitId", "wingAccentId", "ambientTone", "alt"],
      "properties": {
        "assetId": { "type": "string" },
        "assetPath": { "type": "string" },
        "poseFamily": { "type": "string", "enum": ["observant-curiosity", "warm-engagement", "idea-spark", "grounded-action", "neutral"] },
        "sceneKitId": { "type": ["string", "null"] },
        "wingAccentId": { "type": ["string", "null"] },
        "ambientTone": { "type": "string", "enum": ["settled", "reflective", "neutral"] },
        "alt": { "type": "string", "minLength": 1 }
      }
    }
  }
}
```

`source` is a read-only projection of the already-resolved result. The visual
resolver returns only `resolution` and `visual`; it has no API for answers,
scores, thresholds, challenge selection, profile/consent, or result mutation.

### Resolver precedence

1. Read the existing resolved result without mutation.
2. If the feature flag is off, return the current approved emotional candidate
   or existing neutral fallback with `reason: "flag-disabled"`.
3. Validate schema version, confidence state, Core, and MBTI. Any ambiguous,
   missing, invalid, or unsupported required value returns the neutral fallback.
4. Resolve Core emotional baseline and core prop.
5. Resolve MBTI behavior row: pose family, gaze, gesture, action, and Scene Kit.
6. Resolve presentation asset: use requested Female/Male/Neutral when valid;
   use Neutral only for a missing/invalid presentation on an otherwise valid result.
7. Apply a Wing accent only when it is valid and adjacent, inside an existing
   selected object/action; otherwise omit it.
8. Apply A/T to ambient tone only: `A → settled`, `T → reflective`, missing → neutral.
9. Verify manifest entry and asset availability. Failure returns fallback
   without a broken-image state or layout shift.
10. Return visual metadata. Never write back to result or assessment state.

Confidence and validity override visual specificity; Core precedes MBTI; MBTI
owns pose/action/Scene Kit; presentation selects only a parity asset; Wing and
A/T are subordinate decorations.

### Asset naming convention

Future pilot runtime proposal:

```text
/character-assets/living/v1/enneagram-{core}/
  {mbti-lower}/{presentation}-{pose-family}.png
```

Rules: lowercase ASCII slugs; exact enum values; one file per Core × MBTI ×
presentation candidate; no Wing, A/T, confidence, participant, or scoring data
in paths; versioned root; case-sensitive manifest lookup. Each file is
`1122×1402`, RGBA PNG, true transparent background, full-body, sRGB, with no
clipping, halo, text, logo, participant data, or embedded Scene Kit.

### Core 2 pilot asset matrix

These are 12 future candidates only. They do not exist and are not authorized
for creation by this Plan.

| Type | Family | Female | Male | Neutral |
|---|---|---|---|---|
| INTJ | `observant-curiosity` | `/character-assets/living/v1/enneagram-2/intj/female-observant-curiosity.png` | `/character-assets/living/v1/enneagram-2/intj/male-observant-curiosity.png` | `/character-assets/living/v1/enneagram-2/intj/neutral-observant-curiosity.png` |
| ISTJ | `observant-curiosity` | `/character-assets/living/v1/enneagram-2/istj/female-observant-curiosity.png` | `/character-assets/living/v1/enneagram-2/istj/male-observant-curiosity.png` | `/character-assets/living/v1/enneagram-2/istj/neutral-observant-curiosity.png` |
| ENFP | `idea-spark` | `/character-assets/living/v1/enneagram-2/enfp/female-idea-spark.png` | `/character-assets/living/v1/enneagram-2/enfp/male-idea-spark.png` | `/character-assets/living/v1/enneagram-2/enfp/neutral-idea-spark.png` |
| ESFP | `idea-spark` | `/character-assets/living/v1/enneagram-2/esfp/female-idea-spark.png` | `/character-assets/living/v1/enneagram-2/esfp/male-idea-spark.png` | `/character-assets/living/v1/enneagram-2/esfp/neutral-idea-spark.png` |

### Fallback matrix

| Condition | Asset behavior | Scene/Wing/A-T behavior | Resolution reason |
|---|---|---|---|
| Flag disabled | Current approved emotional candidate where available; otherwise existing neutral fallback | Existing behavior only | `flag-disabled` |
| Core missing/ambiguous/invalid | Neutral pose/expression fallback | No typed Scene Kit or Wing; neutral tone | `ambiguous-result` or `missing-value` |
| MBTI missing/ambiguous/invalid | Neutral pose/expression fallback | No typed Scene Kit or Wing; neutral tone | `ambiguous-result` or `missing-value` |
| Unsupported Core × type | Current approved emotional candidate if contract-safe; otherwise neutral fallback | No new typed action | `unsupported-combination` |
| Presentation missing/invalid with valid result | Neutral presentation of the same approved recipe | Preserve Scene Kit; valid Wing/A-T remain isolated | `valid` |
| Wing missing/ambiguous/non-adjacent | Use valid base recipe | Omit Wing accent; preserve Scene Kit and tone | `valid` |
| A/T missing/invalid | Use valid base recipe | Neutral ambient tone; no face/pose change | `valid` |
| Asset or manifest entry missing | Current approved emotional candidate if available; otherwise neutral fallback | Do not expose broken asset; reserve layout | `missing-asset` |
| Schema error/version mismatch | Neutral fallback | No typed modifiers | `schema-error` |

### Feature-flag boundary

Future flag: `livingCharacterPoseActionV1`. It is evaluated only in the visual
result adapter after the existing result has been finalized. It must not be
read by scoring, answer capture, question routing, challenge selection,
confidence calculation, profile/consent, analytics classification, or result
persistence. Off means present behavior. On means the resolver may select only
manifest-approved pilot assets; unsupported cases follow the fallback matrix.
No participant identifier or result answers belong in flag context.

### Contract and acceptance test cases

| ID | Case | Expected result |
|---|---|---|
| SA-01 | Each of 16 valid MBTI values | Exactly one complete matrix row and Scene Kit resolves deterministically |
| SA-02 | Pilot Core 2 × four types × three presentations | Exactly 12 unique manifest paths; no collision |
| SA-03 | Female/Male/Neutral for same Core/type | Pose, hands, outfit, prop placement, lighting, crop, action, and intensity tokens are identical |
| SA-04 | Valid adjacent Wing | One permitted accent appears inside an existing object; pose/action unchanged |
| SA-05 | Invalid/non-adjacent/ambiguous Wing | No Wing accent; base recipe unchanged |
| SA-06 | A, T, and missing A/T | Only ambient tone changes to settled, reflective, or neutral |
| SA-07 | Ambiguous/missing Core or MBTI | Neutral fallback; no guessed type, pose, or Scene Kit |
| SA-08 | Missing/invalid presentation with valid result | Neutral presentation; no inferred gender |
| SA-09 | Flag off | Existing approved behavior; no new asset request |
| SA-10 | Flag on with unsupported combination | Contract-safe fallback; no broken path |
| SA-11 | Missing asset/network failure | Reserved layout and fallback; no broken-image icon or content shift |
| SA-12 | 360 px, 390 px, desktop | Character/action readable; secondary scene objects reduce first; no horizontal overflow |
| SA-13 | Reduced motion and 200% zoom | No required meaning depends on motion; content remains available and unclipped |
| SA-14 | Snapshot result before/after visual resolution | Answers, scores, confidence, type, Core, Wing, challenge, profile, and consent are byte-for-byte unchanged |
| SA-15 | Static dependency check | Scoring modules do not import the flag, visual matrix, resolver, or manifest |
| SA-16 | Accessibility strings | Visual-only, non-diagnostic, no model letters or stereotype claims |

### Performance constraints

- Reserve the image/composition aspect ratio before loading; no visible layout shift.
- One character asset request per result; no speculative preload of all 12 assets.
- Pilot PNG size target ≤ 500 KB each and hard gate ≤ 750 KB unless Design and
  Engineering record an exception; future delivery formats may be proposed only
  in a separate implementation task.
- Visual resolver is a pure synchronous lookup with no network call and an
  implementation target below 2 ms at p95 on supported clients.
- Lazy-load below-the-fold secondary elements; character and primary object
  receive priority only on the result view.
- At mobile widths, remove/reduce secondary Scene Kit objects before scaling the
  primary character/action below legibility. No horizontal overflow.
- Optional motion must stop under `prefers-reduced-motion` and must not be needed
  to understand gaze, action, object, or result.

### Proof that scoring is untouched

This Plan introduces no executable artifact. The proposed future boundary is
one-way: `existing resolved result → visual adapter → visual result`. There is
no return channel and no visual field exists in scoring inputs. SA-14 and SA-15
are mandatory future regression evidence. The frozen 20-question limit,
questions, answer weights, scoring thresholds, challenge selection,
confidence rules, profile/consent, and result contract are outside the feature
flag and outside this task.

---

## Sr. UX/UI Designer handoff

### Shared pose-board contract

All boards use balanced adult proportions, equal apparent age/build, the Core 2
emotional baseline, equal expression intensity, consistent camera and lighting,
and a full-body transparent composition. Feet support natural balance; hands
remain anatomically clear; no pose implies rank, fitness, weakness, dominance,
seduction, diagnosis, or employability. The supplied reference may inspire only
general liveliness and readable action. Do not copy financial, wealth, trading,
salary, luxury, performance, or status claims.

#### Pose board 1 — `observant-curiosity`

- **Face:** focused eyes, relaxed brow, thoughtful closed or softly neutral mouth;
  never cold or suspicious.
- **Gaze:** toward a specific map/object detail, not away from the composition.
- **Shoulders:** level, relaxed, and balanced; no hunching or aloof withdrawal.
- **Hands:** one stabilizes the Core 2 prop relationship; one makes a small
  analytical linking, indicating, aligning, or inspecting gesture.
- **Feet:** balanced parallel or natural offset stance with equal weight.
- **Action:** observes, traces, compares, aligns, connects, or inspects one detail.
- **Object relationship:** object is near enough for clear attention but never a
  shield, authority symbol, or intelligence trophy.
- **Mobile-safe crop:** full silhouette inside the `1122×1402` canvas; face,
  both hands, feet, Core 2 prop, action point, and primary object survive at
  360 px and 390 px; secondary tiles reduce first.
- **Accessibility pattern:** “A person calmly [visible action] with [visible object].”
- **Presentation parity:** only approved face/hair details vary; gaze target,
  shoulders, hands, feet, action, object placement, lighting, crop, and
  expression intensity are pixel-aligned in Female/Male/Neutral derivatives.

#### Pose board 2 — `warm-engagement`

- **Face:** soft eyes and a small natural smile; never servile or flirtatious.
- **Gaze:** naturally connects object and recipient zone without staring.
- **Shoulders:** open and level, with no bowing, chest display, or retreat.
- **Hands:** one welcoming/listening hand; one keeps the Core 2 prop stable.
- **Feet:** comfortable stable base; no tiptoe, curtsy, or exaggerated approach.
- **Action:** presents, places, shares, or makes a practical detail available.
- **Object relationship:** object supports reciprocal attention, not rescue,
  caretaking destiny, persuasion, or approval-seeking.
- **Mobile-safe crop:** face, open hand, Core 2 prop, primary object, and feet
  remain visible; recipient-side whitespace is retained without overflow.
- **Accessibility pattern:** “A person [visible sharing action] for shared viewing.”
- **Presentation parity:** identical pose, hands, feet, smile intensity, outfit,
  prop/object placement, lighting, and crop; localized face/hair only.

#### Pose board 3 — `idea-spark`

- **Face:** alert eyes, relaxed brow, contained delight; never hyperactive or childish.
- **Gaze:** follows a visible connection from central idea to an open possibility.
- **Shoulders:** slight exploratory lean from the whole balanced stance, not a
  compressed or bouncing posture.
- **Hands:** one links or presents a possibility; the other preserves Core 2
  prop continuity without flourish.
- **Feet:** grounded natural offset that safely supports the slight lean.
- **Action:** adds, links, extends, or moves one possibility into shared context.
- **Object relationship:** possibility remains concrete enough to perceive;
  branching elements do not become chaotic confetti or “genius” effects.
- **Mobile-safe crop:** lean, both hands, face, feet, Core 2 prop, central idea,
  and first branch stay inside the safe area; later branches reduce first.
- **Accessibility pattern:** “A person [visible linking action] between open cards.”
- **Presentation parity:** identical lean angle, balance, hand/finger placement,
  feet, gaze path, action, objects, crop, and expression intensity.

#### Pose board 4 — `grounded-action`

- **Face:** direct attention, steady brow, composed mouth; never aggressive.
- **Gaze:** toward the immediate plan/object step rather than at the viewer as command.
- **Shoulders:** stable, level, and ready without squared-up dominance.
- **Hands:** one measured placement/direction gesture; one calmly supports the
  existing Core 2 prop relationship.
- **Feet:** planted natural stance without widened power posing.
- **Action:** sets, places, or aligns the next visible step.
- **Object relationship:** plan/object is a shared work aid, not a badge of rank,
  control, productivity, or superior competence.
- **Mobile-safe crop:** face, both hands, feet, Core 2 prop, action marker, and
  next step remain visible; secondary milestones reduce first.
- **Accessibility pattern:** “A person calmly [visible placement action] in a plan.”
- **Presentation parity:** identical stance width, shoulders, hands, feet, gaze,
  action, object placement, lighting, framing, and expression intensity.

### Four Core 2 pilot storyboards

Each storyboard preserves Core 2's warm inner-motive baseline. Wing may modify
one small mark inside the named primary object; A/T changes ambient tone only.

| Pilot | Face and gaze | Shoulders, hands, feet | Observable action and object | Mobile/accessibility | Parity and prohibited reading |
|---|---|---|---|---|---|
| INTJ × Core 2 — `observant-curiosity` | Focused eyes, relaxed brow; gaze at one `strategy-map` route point | Balanced shoulders and stance; one hand supports Core 2 continuity, one traces a connection | Traces one route between ordered decision points; Wing accent may appear only inside one map tile | Preserve face, hands, feet, route point, and map. Alt: “A person calmly traces a route on a layered map.” | Face/hair only across presentations. Never aloof genius, mastermind, suspicious, or superior. |
| ISTJ × Core 2 — `observant-curiosity` | Calm focused eyes; gaze follows the next concrete checklist point | Same family silhouette but distinct compact alignment gesture; stable feet | Aligns one route marker beside `operations-check`; Wing accent stays inside the marker/card | Preserve face, hands, feet, checklist, and marker. Alt: “A person aligns a route marker beside a practical checklist.” | Face/hair only. Never rigid, obedient, dull, or inherently more reliable/employable. |
| ENFP × Core 2 — `idea-spark` | Alert eyes and contained delight; gaze follows an open connection | Slight balanced lean; one hand links two cards; grounded feet | Extends a link in `connection-garden`; Wing accent stays inside one possibility card | Preserve face, hands, feet, two cards, and first link. Alt: “A person links two open possibility cards with contained delight.” | Face/hair only. Never scattered, manic, childish, or socially superior. |
| ESFP × Core 2 — `idea-spark` | Warm alert eyes; gaze moves from a concrete tile to recipient zone | Same family lean but distinct presenting movement; one hand moves a tile | Moves an activity tile into `live-exchange`; Wing accent stays inside that tile | Preserve face, hands, feet, activity tile, and exchange anchor. Alt: “A person moves an activity tile into a shared exchange.” | Face/hair only. Never entertainer, attention-seeking, impulsive, or flirtatious. |

The two within-family pairs must remain visibly distinct through action and
object relationship, not expression intensity or production value. INTJ versus
ISTJ is trace-versus-align; ENFP versus ESFP is link-versus-move/present.

---

## Sr. Front-end Developer handoff — implementation-readiness only

No implementation occurs in this task. A future implementation may start only
when every prerequisite below has an owner and approved evidence.

### Resolver integration

- [ ] Consume only the frozen, already-resolved result contract.
- [ ] Implement the schema and precedence exactly; use exhaustive enum handling.
- [ ] Keep visual modules out of scoring, questions, confidence, challenge,
  profile, consent, and result-generation dependency graphs.
- [ ] Make resolution pure and deterministic; add immutable before/after tests.
- [ ] Gate after result resolution with `livingCharacterPoseActionV1`.

### Asset loading and manifest

- [ ] Register only the 12 approved pilot paths and verified metadata.
- [ ] Validate exact case, dimensions, RGBA, transparency, sRGB, full body,
  checksum, file size, ownership, provenance, accessibility text, and approval.
- [ ] Request one character asset; reserve aspect ratio; avoid asset fan-out.
- [ ] Keep Scene Kits, Wing accents, and ambient tones outside character PNGs.
- [ ] Prevent participant data, result answers, or score data in URLs/metadata.

### Fallback and failure behavior

- [ ] Implement every fallback-matrix row without guessing.
- [ ] Preserve the current 12 emotional candidates as flag-off/HOLD fallback.
- [ ] Handle load failure without broken-image icon, layout shift, or raw type code.
- [ ] Treat Neutral presentation as first-class, not lower quality.

### Development preview

- [ ] Provide a non-production preview for 4 types × 3 presentations × valid,
  missing, and ambiguous modifiers.
- [ ] Toggle flag, Wing states, A/T states, reduced motion, missing files, and
  360/390/desktop viewports without editing assessment inputs.
- [ ] Show internal IDs only in the development preview, never participant UI.

### Responsive and accessibility

- [ ] Test 360 px, 390 px, tablet, desktop, and 200% zoom with no overflow.
- [ ] Reduce secondary Scene Kit objects before character/action legibility.
- [ ] Keep face, hands, feet, Core prop, primary object, and action visible.
- [ ] Use approved visual-only alt text; hide decorative layers from assistive technology.
- [ ] Disable optional motion under `prefers-reduced-motion` without meaning loss.

### Regression evidence

- [ ] Add mapping, precedence, fallback, isolation, flag-off, missing-asset,
  parity-token, accessibility, and responsive tests from SA-01 through SA-16.
- [ ] Prove the frozen scoring, 20-question, challenge, profile/consent, and result
  contracts are unchanged before and after integration.
- [ ] Run existing unit, contract, accessibility, responsive, lint, build, and
  visual-regression suites in the future implementation task.

---

## PDCA and design gates

### Plan — completed by this document

- Product scope, four-family release decision, reflection-only purpose, and
  anti-bias rules are defined for approval.
- The 16-type behavior matrix and dimension traceability are complete.
- The machine-processable schema, resolver precedence, naming convention,
  12-asset matrix, fallback matrix, feature boundary, tests, and performance
  constraints are complete.
- Four pose boards, four pilot storyboards, pilot acceptance criteria, and the
  implementation-readiness checklist are complete.

### Do — future authorized task

1. Create four Female pilot masters: INTJ, ISTJ, ENFP, and ESFP × Core 2.
2. Create Male and Neutral parity derivatives from each approved Female master.
3. Validate each asset before any production integration.
4. Do not produce other MBTI types, other Cores, or a 432-asset matrix.

### Check — pilot acceptance criteria

- **Technical PASS:** 12/12 are exactly `1122×1402`, RGBA, true transparent,
  full-body sRGB PNGs with no clipping, halo, text, logo, participant data, or
  embedded Scene Kit; manifest/provenance/ownership records are complete.
- **Visual PASS:** four pilot actions are distinct, readable, restrained,
  natural, and compatible with their distinct Scene Kits. Shared-family pairs
  remain distinguishable by action/object relationship, not value or intensity.
- **Parity PASS:** all four Female/Male/Neutral trios retain identical pose,
  gaze, shoulders, hands, feet, outfit, prop placement, action, object
  relationship, lighting, framing, and expression intensity; only approved
  face/hair presentation differs.
- **Bias PASS:** independent review finds no intelligence, weakness, dominance,
  employability, body-type, ability, rank, attractiveness, gender-value,
  diagnostic, distress, or fixed-trait implication.
- **UX PASS:** primary character/action remains readable at 360 px, 390 px, and
  desktop; face, hands, feet, Core prop, and primary action are unobscured; no
  horizontal overflow; alt descriptions are visual-only.
- **Logic PASS:** mapping is deterministic; ambiguous/missing values never
  guess; Wing and A/T remain isolated; the flag is post-result; scoring,
  questions, 20-question limit, challenge selection, profile/consent, and
  result contract are unchanged.

Every category must pass. Missing evidence, a failed asset, a failed parity
trio, an indistinct action, a stereotype/value cue, responsive failure, or
logic leakage is **FAIL**; there is no partial release pass.

### Act

- **PASS:** approve the complete Core 2 pilot template, update the action plan,
  and separately authorize implementation and controlled expansion.
- **FAIL:** revise only the failed pose family, type action, derivative, or rule;
  rerun the affected checks plus shared parity/bias regression. Do not regenerate
  the entire matrix when the defect is local.
- **HOLD:** preserve the current 12 emotional candidates as fallback; do not
  integrate unapproved pose assets or begin the 432-asset expansion.

## Release decision record

| Gate | Owner | Plan evidence | Current status |
|---|---|---|---|
| PO scope gate | Products Owner | One-page brief and four-family decision above | NOT RUN |
| BA behavior gate | Sr. Business Analyst | 16-row matrix, traceability, edge cases above | NOT RUN |
| SA contract gate | Sr. System Analyst | Schema, resolver, assets, fallbacks, tests above | NOT RUN |
| UX/UI pose gate | Sr. UX/UI Designer | Four pose boards and four storyboards above | NOT RUN |
| Asset Gate E | Design/QA/HR-Privacy | 12-asset technical, visual, parity, bias and UX evidence — see `outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md` | **PASS** (2026-09-07) |
| Front-end engineering gate | Sr. Front-end Developer | Readiness checklist; future implementation evidence | NOT RUN |
| UAT/release gate | Products Owner | All signed evidence and regression results | NOT RUN |
| **Overall decision** | Products Owner | All gates required | **NO-GO until the pilot passes all gates** |

## Plan definition-of-done record

- [x] Role handoffs are explicit.
- [x] The 16-type matrix fields and four pose families are defined.
- [x] The 12-asset Core 2 pilot is bounded.
- [x] PDCA gates and PASS/FAIL/HOLD actions are explicit.
- [x] No application code, image assets, scoring, questions, challenges,
  profile/consent, or result logic are changed by this Plan.
