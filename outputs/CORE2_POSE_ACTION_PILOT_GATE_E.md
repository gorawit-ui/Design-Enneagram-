# Core 2 Pose & Action Pilot — Gate E Report

## Scope

Do-phase asset production only for Core 2 × INTJ, ISTJ, ENFP, and ESFP ×
Female, Male, and Neutral. No application integration was performed.

## Production sequence

1. Four Female masters were generated first: INTJ trace, ISTJ align, ENFP link,
   and ESFP move/present.
2. Male and Neutral derivatives were produced from each corresponding Female
   master with face/hair-only edit instructions.
3. Opaque checkerboard outputs were rejected and reprocessed through targeted
   background extraction.
4. Candidate exports were normalized to the specified canvas with aspect ratio
   and alpha preserved.

Built-in image generation was used. The final prompt set shared these locked
requirements: polished semi-realistic warm 3D adult character; balanced neutral
build; forest-green blazer, ivory knit top, straight charcoal trousers, and
black ankle boots; blank ivory note card plus linked-circle motif only; full
body with face, hands, feet, and props visible; restrained Core 2 warmth; true
transparent RGBA background; no text, logo, participant data, Scene Kit,
financial/status imagery, stereotype, distress, dominance, or body-shape
personality coding. Female master deltas were: INTJ traces a curved connection;
ISTJ aligns a marker beside the card; ENFP links two open circles with contained
delight; ESFP moves/presents one node into a three-node motif. Male and Neutral
prompts changed localized face/hair presentation only and repeated every pose,
body, hand, outfit, prop, lighting, crop, and intensity invariant. A final
background-extraction prompt removed only baked checkerboard/background pixels
and required genuine alpha with preserved fine edges and no halo.

## Candidate inventory

| Type | Female | Male | Neutral |
|---|---|---|---|
| INTJ | `public/character-assets/living/v1/enneagram-2/intj/female-observant-curiosity.png` | `public/character-assets/living/v1/enneagram-2/intj/male-observant-curiosity.png` | `public/character-assets/living/v1/enneagram-2/intj/neutral-observant-curiosity.png` |
| ISTJ | `public/character-assets/living/v1/enneagram-2/istj/female-observant-curiosity.png` | `public/character-assets/living/v1/enneagram-2/istj/male-observant-curiosity.png` | `public/character-assets/living/v1/enneagram-2/istj/neutral-observant-curiosity.png` |
| ENFP | `public/character-assets/living/v1/enneagram-2/enfp/female-idea-spark.png` | `public/character-assets/living/v1/enneagram-2/enfp/male-idea-spark.png` | `public/character-assets/living/v1/enneagram-2/enfp/neutral-idea-spark.png` |
| ESFP | `public/character-assets/living/v1/enneagram-2/esfp/female-idea-spark.png` | `public/character-assets/living/v1/enneagram-2/esfp/male-idea-spark.png` | `public/character-assets/living/v1/enneagram-2/esfp/neutral-idea-spark.png` |

## Gate evidence

### Technical

- **PASS:** 12/12 are PNG, sRGB, four-channel RGBA, and contain both fully
  transparent and fully opaque pixels.
- **PASS:** full body, face, both hands, both feet, blank note card, and
  linked-circle motif are present without clipping.
- **PASS:** no text, logo, participant data, or embedded Scene Kit appears.
- **FAIL:** 11/12 are exactly `1122×1402`. ENFP Female remains `1070×1470`
  because an external process holds the file open and prevented promotion of
  its validated `1122×1402` normalized copy. The pending normalized candidate
  is `outputs/CORE2_ENFP_FEMALE_NORMALIZED_PENDING.png`.

### Pose distinction

- **PASS:** INTJ traces a curved route; ISTJ aligns a horizontal marker; ENFP
  links two open rings; ESFP moves/presents one node into a three-node motif.
- **PASS:** both same-family comparisons remain readable: trace versus align,
  and link versus move/present.
- **PASS:** expressions remain restrained: focused curiosity for INTJ/ISTJ and
  contained delight for ENFP/ESFP.

### Female / Male / Neutral parity

- **PASS (visual review):** each trio retains its action, gaze target, shoulder
  and foot stance, hand roles, outfit, note card, motif relationship, lighting,
  framing intent, and expression intensity.
- **PASS (bias review):** no presentation is assigned a larger power pose,
  stronger action, superior prop, higher production value, or more employable
  reading. Differences are localized to face/hair presentation.

### Anti-bias

- **PASS:** balanced adult proportions and the same outfit/prop hierarchy are
  used throughout.
- **PASS:** no intelligence, weakness, dominance, employability, rank, wealth,
  body-type, ability, gender-value, distress, pathology, or diagnostic cue is
  intentionally encoded.
- **PASS:** no financial claim, chart, money, luxury, badge, title, or status
  object was copied from reference imagery.

### 360 px / 390 px readability

- **PASS:** the primary character, face, hands, feet, note card, motif, and
  action remain visible at both review widths.
- **PASS:** all actions remain distinguishable on the review sheets; no asset
  itself requires horizontal overflow.
- Evidence: `outputs/CORE2_POSE_ACTION_GATE_E_360.png` and
  `outputs/CORE2_POSE_ACTION_GATE_E_390.png`. Rows are INTJ, ISTJ, ENFP, ESFP;
  columns are Female, Male, Neutral.

### Logic and application isolation

- **PASS:** no scoring, question, 20-question limit, challenge-selection,
  profile/consent, result-logic, application-code, package, or deployment file
  was changed.
- **PASS:** no asset was integrated into the app; Wing and A/T behavior remains
  external to the PNGs and therefore cannot change the pose contract.

## Gate E decision

**Gate E: FAIL. Release action: HOLD.**

The technical gate requires 12/12 exact canvases and has no partial pass. Keep
existing emotional candidates as the application fallback; do not integrate
these candidates and do not begin broader type/Core production.

The only recorded blocker is promotion of the already-normalized ENFP Female
file to its final path. After the external lock is released, replace that one
file, rerun the 12-file technical audit and both responsive sheets, and change
Gate E only if every criterion still passes. Do not regenerate the matrix or
the other 11 candidates.
