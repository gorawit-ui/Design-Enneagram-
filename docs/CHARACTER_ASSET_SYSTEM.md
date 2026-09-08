# Module 2 Character Asset System

## Status and scope

This document is the implementation and quality plan for Module 2. It does not authorize asset generation, application-code changes, deployment, persistence, or changes to assessment scoring.

Module 2 will supply a coherent, accessible character-asset system for the result experience. It must consume the existing resolved character recipe without changing MBTI, Enneagram, Wing, confidence, challenge selection, the three-field profile contract, or the 20-question limit.

## Current-state audit

### What exists

- `app/lib/character-system.ts` defines nine Enneagram core profiles, two adjacent Wings per core, sixteen MBTI visual profiles, A/T identity modifiers, and three presentation values: `female`, `male`, and `neutral`.
- `getCharacterProfile()` already returns a deterministic design recipe and an intended base path in the form `/character-assets/enneagram-{core}/{presentation}.webp`.
- Wing validation correctly permits only the two adjacent Wings and returns an ambiguous Wing rather than guessing.
- Ambiguous assessment results have a neutral text-and-symbol fallback in the result hero.
- The welcome screen has one 3D guild image. Brand logo files also exist.

### Gaps

- No `/public/character-assets` directory or referenced character files exist.
- `assetPath` is metadata only; the current result view does not render it.
- There is no source-file convention, export manifest, dimension budget, visual safe area, missing-file behavior, or licensing/provenance record.
- No visual-regression matrix covers nine cores, three presentations, valid/ambiguous Wings, clear/close/ambiguous confidence, reduced motion, or 360 px screens.
- The current neutral result is a deliberate UI fallback, not a production character asset.

## Product and ethical rules

1. Character art is a reflective visual metaphor, not a diagnosis or prediction.
2. Enneagram core determines the base archetype, primary prop, core palette, and background motif.
3. A valid adjacent Wing may add only a secondary accent, prop detail, or small pose cue. An ambiguous Wing receives no Wing-specific cue.
4. MBTI changes visual energy—posture, expression, interaction, and motif direction—not body type, status, competence, age, or attractiveness.
5. A/T changes light and detail treatment only. Neither state may look superior, healthier, stronger, or more polished.
6. Gender presentation changes presentation only. It must never change personality mappings, role, color hierarchy, competence cues, or scoring.
7. `neutral` is a first-class presentation, not a degraded or placeholder asset.
8. Ambiguous assessment results must use a neutral exploration asset and must not show a guessed core, Wing, or MBTI stereotype.
9. Assets must avoid culturally reductive clothing, gender stereotypes, disability caricatures, skin-tone hierarchy, and occupational status signals.
10. Every shipped file must have documented ownership, license, generation source, review state, and approval date.
11. All characters must use the same balanced adult proportion system. Body shape, height, weight, muscularity, limb proportion, and physical build must never encode personality, Enneagram core, MBTI, Wing, A/T identity, gender presentation, competence, or status.

## System architecture

Use a layered system so the number of exports remains reviewable and maintainable.

| Layer | Source of truth | Required variants | Purpose |
|---|---|---:|---|
| Base character | Enneagram core × presentation | 9 × 3 = 27 | Silhouette, face, core prop, core color, core pose |
| Wing accent | Valid adjacent Wing recipe | 18 reusable recipes | Small prop/accent cue; applied only when Wing is valid |
| MBTI energy | 16 MBTI profiles | Prefer tokens or reusable overlays | Posture/expression/motif direction without new character identity |
| Identity treatment | A or T | 2 reusable treatments | Light/detail behavior with equal visual prominence |
| Ambiguous fallback | Confidence state | 1 neutral exploration asset, presentation-independent | No inferred core, Wing, or MBTI |

Do not export every possible MBTI × Enneagram × Wing × identity × presentation combination. That approach would create hundreds of files, make parity review unreliable, and encourage personality stereotypes. The 27 base characters are the asset inventory; other dimensions are constrained modifiers.

## Asset inventory and naming contract

### Runtime assets

```text
public/character-assets/
  manifest.json
  fallback/
    exploration-neutral.webp
  enneagram-1/
    female.webp
    male.webp
    neutral.webp
  ...
  enneagram-9/
    female.webp
    male.webp
    neutral.webp
  overlays/
    wings/
      1w9.webp
      1w2.webp
      ...
      9w1.webp
    identity/
      assertive.webp
      turbulent.webp
    motifs/
      {approved-reusable-motif}.webp
```

The exact overlay implementation may use transparent WebP files, CSS/SVG tokens, or composition at asset-production time. The public path exposed by `getCharacterProfile()` must remain stable unless an explicit migration is approved.

### Source and review assets

Editable masters must live outside the runtime bundle in an approved design-source location. Each exported file needs a manifest entry containing:

- stable asset ID and public path;
- Enneagram core and presentation;
- optional Wing/MBTI/identity applicability;
- pixel dimensions, file type, byte size, and checksum;
- source-tool reference and creator;
- license/ownership status;
- prompt or generation provenance when AI-assisted;
- accessibility description;
- reviewer, approval state, and approval date.

Do not place prompts, editable masters, unused drafts, or review contact sheets in `public/`.

## Visual production specification

### Base canvas

- Master: square, minimum 2048 × 2048 px, transparent background.
- Runtime export: 1024 × 1024 WebP, transparent, sRGB.
- Preferred runtime target: no more than 180 KB per base asset; hard gate at 250 KB unless visual QA documents an exception.
- Preserve at least 8% transparent safe area on all sides.
- Keep the face, primary prop, and identifying silhouette inside the central 76% safe region so desktop and mobile crops do not remove meaning.
- Avoid critical details below a rendered size of 4 CSS px at the 360 px viewport.

### Shared art direction

- Warm, approachable 3D or softly modeled illustration consistent with the current guild image.
- Matcha/forest/ivory brand foundation with core-specific accents from `ENNEAGRAM_PROFILES`.
- Equal finish, lighting, detail density, and apparent production value across all cores and presentations.
- Use one approved balanced-adult proportion guide across the complete character family. Permitted personality differences are limited to pose, expression, props, motifs, and styling; body shape is not a personality or gender variable.
- Props communicate the existing recipe; they must not imply rank, salary, intelligence, or moral value.
- Text, numbers, letters, and logos must not be baked into character art.
- Do not use color alone to communicate core, Wing, MBTI, identity, or confidence.

### Presentation parity

Each presentation is its own locked character. The female, male, and neutral variants of a core must share canvas position, scale, pose intent, prop prominence, lighting, and background motif, and each must match its own presentation's master in build across all nine cores.

They are **not** required to share one physical build with each other. That was the original rule, and the Products Owner withdrew it on 2026-09-08: an assessment that asks the participant to choose a presentation and then shows every choice the same body contradicts the choice it just offered. The measured builds now differ — the female master's shoulders are 1.76 times its head width, the male master's 2.59 — and both are recorded in `outputs/asset-masters/proportions.json`, which the production prompts read so that cores 2-9 of a presentation match that presentation's own master.

What replaces the shared-build rule is narrower and still binding: no presentation may read as more capable, more senior, more employable or more physically dominant than another. A broader build is allowed as a build; it is not allowed to become a power cue. Same pose, same action, same prop prominence, same lighting, same production value, same framing. Review the three variants side by side against that, and against the anti-bias rules above, before reviewing personality fidelity — this is the one criterion an automated check cannot decide, and the reason the build difference needs a named human sign-off per core rather than a passing script. Those sign-offs are recorded in `outputs/BASE_ASSET_SIGNOFF.md`, one section per core, together with what each ruling did and did not cover.

### Modifier limits

- Wing: one secondary prop detail plus one accent motif at most; no silhouette replacement.
- MBTI: expression/posture energy and motif direction only; preserve the core archetype.
- A/T: lighting/detail treatment only, with matched contrast and file quality.
- Ambiguous Wing: omit the Wing overlay and label it as ambiguous in text.
- Ambiguous core or MBTI: show the exploration fallback; do not render the top candidate as though confirmed.

## Rendering contract for later implementation

This section specifies future code behavior but does not implement it.

1. Render the resolved base asset only for a non-ambiguous result whose file is present in the manifest.
2. Use the existing `assetPath` as the canonical base lookup.
3. Apply a Wing accent only when `wingStatus === "valid"` and adjacency validation passes.
4. For any ambiguous core or MBTI result, render `fallback/exploration-neutral.webp` and neutral explanatory text.
5. If an expected asset fails to load, render the same neutral fallback without shifting layout or exposing a broken-image icon.
6. Supply meaningful Thai alternative text from the resolved accessibility description. Decorative overlays must use empty alternative text or be hidden from assistive technology.
7. Reserve the final image box dimensions before loading to prevent layout shift.
8. Never include participant name, nickname, team, gender, answers, or result codes in asset URLs, analytics, logs, or image metadata.
9. Motion, if introduced later, must be optional, subtle, and disabled by `prefers-reduced-motion`.

## PDCA delivery plan

### Plan

Deliverables:

1. Approve one-page art direction and the ethical rules above.
2. Produce three proof assets for a single core—female, male, neutral—plus the exploration fallback.
3. Validate safe area, parity, accessibility description, file weight, 360 px legibility, and result-card contrast.
4. Approve the production template before generating the remaining 24 base assets.
5. Define reusable Wing, MBTI, and identity modifier treatments from the existing character recipe.
6. Complete the manifest and provenance record before integration.

Entry criteria:

- Module 1 scoring gate remains PASS.
- Product approves the layered architecture and ambiguous-state behavior.
- Design approves the proof-core choice and art direction.
- HR/Privacy confirms that presentation variants do not add sensitive inference or reporting behavior.
- Asset ownership and tool licensing are documented.

### Do

Production sequence:

1. Create a locked base template with canvas, camera, scale, lighting, safe area, and material settings.
2. Produce the proof core and fallback; review before batch work.
3. Produce remaining cores in three-presentation batches, checking parity after each core.
4. Export runtime WebP assets using the naming contract.
5. Strip unnecessary metadata and verify transparency/color profile.
6. Record each export in the manifest with checksum and provenance.
7. Create a contact sheet containing all 27 bases and the fallback at equal size.
8. Only after asset approval, open a separate implementation task to connect the assets to the result UI.

No scoring or content data may be edited during asset production.

### Check

#### Automated asset checks

- All 27 required base paths and the exploration fallback exist.
- Manifest paths are unique and resolve with exact case.
- Dimensions, format, transparency, byte budget, and checksum match the manifest.
- No unexpected files exist in the runtime asset directory.
- All nine cores have exactly the three approved presentations.
- All Wing identifiers are adjacent to their core.
- Every meaningful base/fallback asset has non-empty Thai accessibility copy.
- Build, lint, scoring tests, and the Module 1 contract tests remain green after integration.

#### Visual QA matrix

Test at minimum:

| Axis | Required cases |
|---|---|
| Core | 1 through 9 |
| Presentation | female, male, neutral |
| Wing | left valid, right valid, ambiguous |
| MBTI energy | one introverted and one extraverted profile per core across the matrix |
| Identity | A and T at equal prominence |
| Confidence | clear, close, ambiguous |
| Viewport | 360 × 800, 390 × 844, 768 × 1024, 1440 × 900 |
| Preferences | normal and reduced motion; high zoom at 200% |

At 360 px, the result remains one column, width 100%, `min-width: 0`, with no horizontal overflow. The full character silhouette may scale down but the face and core prop must remain legible. Text, controls, and result content must not be clipped, covered, or removed.

#### Review questions

- Can reviewers identify the intended core from silhouette/prop without relying on color?
- Are the three presentations equal in authority, warmth, detail, and scale?
- Do all cores and presentations retain the same balanced adult proportion system, with no personality or gender inferred through body shape?
- Does either A/T treatment look more desirable or complete?
- Are Wing cues visibly secondary to the core?
- Does the ambiguous fallback avoid implying a hidden winner?
- Does any asset encode cultural, gender, ability, age, or job-status stereotypes?
- Is the character secondary to the participant’s written result rather than visually overwhelming it?

### Act

Classify findings before release:

- **Blocker:** missing asset, broken fallback, non-adjacent Wing, privacy leak, unlicensed source, stereotype, body-shape mapping to personality or gender, clipped meaning, horizontal overflow, or scoring regression. Fix and rerun the full gate.
- **Major:** parity mismatch, unreadable prop at 360 px, incorrect core cue, inaccessible description, layout shift, or file above the hard budget. Fix affected family and rerun automated plus visual checks.
- **Minor:** polish difference that does not alter meaning, accessibility, parity, or layout. Record with owner and due date; Product decides whether it blocks v1.

After fixes, update the template and production checklist so the defect cannot silently recur. Do not patch only one export when the cause is shared by the base template.

## Module 2 release gate

Module 2 is **PASS** only when all of the following are true:

- 27 base assets and one exploration fallback are approved and present.
- Required modifier treatments are approved, deterministic, and subordinate to the core.
- Manifest, checksums, provenance, ownership, and accessibility descriptions are complete.
- Presentation parity and stereotype review pass.
- Balanced adult proportions are consistent across every core and presentation, with no body-shape encoding of personality or gender.
- Every required viewport passes, including 360 px with no horizontal overflow or content loss.
- Missing-file and ambiguous-result fallbacks pass.
- Automated asset validation, scoring tests, profile-contract tests, lint, and production build pass.
- No scoring, question wording, challenge routing, consent, privacy, or profile-contract regression exists.
- Design, Product, Engineering, QA, and HR/Privacy record approval.

Any failed item makes the gate **FAIL / NO-GO**. A partial asset set may be used in an internal review build only when the missing states always resolve to the approved neutral fallback; it is not eligible for production release.

## Completion evidence template

| Evidence | Owner | Location | Result | Date |
|---|---|---|---|---|
| Art-direction approval | Design | Pending | Pending | Pending |
| 27-base contact sheet | Design | Pending | Pending | Pending |
| Asset manifest validation | Engineering | Pending | Pending | Pending |
| Provenance and licensing review | Product/Legal | Pending | Pending | Pending |
| Presentation/stereotype review | HR/Privacy | Pending | Pending | Pending |
| Accessibility review | QA | Pending | Pending | Pending |
| 360 px visual matrix | QA | Pending | Pending | Pending |
| Module 1 regression suite | Engineering | Pending | Pending | Pending |
| Lint and production build | Engineering | Pending | Pending | Pending |
| Final Module 2 decision | Product | Pending | FAIL / NO-GO until evidence is complete | Pending |
