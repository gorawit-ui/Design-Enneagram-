# Base asset sign-off record

One section per core. This file exists because `docs/CHARACTER_ASSET_SYSTEM.md` requires a named
human sign-off per core on the one criterion no script can decide: that no presentation reads as
more capable, more senior, more employable or more physically dominant than another.

The mechanical criteria are not recorded here. They are re-proven from the pixels on every run by
`npm run assets:check`, and a claim in a document cannot substitute for that.

## Signing conditions

The Products Owner holds every review role on this project — design, product, engineering, QA and
HR/privacy. The sign-offs below are therefore not independent reviews, and the bias review in
particular was made by the same person who commissioned the assets. Recorded so that a later reader
is not misled about how much scrutiny each decision received.

## Core 1 — Standards Keeper

**Bias / equal standing: PASS.** Signed by the Products Owner, 2026-09-08.

Measured builds, from `outputs/asset-masters/proportions.json`:

| Presentation | Head width | Shoulder width | Shoulders ÷ head |
|---|---|---|---|
| female | 14.3% | 25.1% | 1.76 |
| male | 11.8% | 30.5% | 2.59 |
| neutral | 15.7% | 26.0% | 1.65 |

The male is the outlier: its shoulders are 47% broader than the female's and 57% broader than the
neutral's, while those two sit close together. That spread was put to the Products Owner explicitly,
with the three assets rendered side by side at equal on-screen height, and ruled acceptable on the
grounds that shoulder width differs between builds in reality, so the difference reads as build
rather than as authority.

What this sign-off does **not** cover, and what a future reviewer should re-examine if any of it
changes:

- It rules on build only. Pose, action, prop prominence, lighting, production value and framing are
  identical across the three by construction, and the ruling assumed that.
- It rules on Core 1's standing pose. A core whose action is more assertive could turn the same
  shoulder spread into a power cue, so the ruling does not carry forward automatically.
- Both assets that fed the ruling render at the same 76% height. If framing ever diverges between
  presentations, prominence changes and this needs re-deciding.

**Assets:** `public/character-assets/enneagram-1/{female,male,neutral}.webp`
**Masters:** `outputs/asset-masters/enneagram-1/{female,male,neutral}-master.png`
