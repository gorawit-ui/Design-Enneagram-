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

## Core 2 — Relationship Guide · female

**Visual ruling given, asset not yet in the repository.** Recorded so it does not have to be asked
again, and marked as pending so it cannot be mistaken for a completed sign-off.

The Products Owner ruled on 2026-09-09 that the figure reads as the same person as the female
master, and as equal in standing. That judgement was made on a copy of the generator's chat
preview — re-encoded to WebP and upscaled from 1024 to 1254 — because the exported PNG has not been
seen here. The preview carries the same artwork, so the two questions it answers are the two it can
answer: who the figure is, and how it reads. It cannot answer anything mechanical.

Nothing has entered `public/character-assets/enneagram-2/`. `npm run assets:ingest` refuses a WebP
outright, since a lossy upscale cannot be undone and shipping one would put a softened asset beside
three sharp ones.

**That ruling is void.** The asset in the repository is a different image: attaching the master had
been routing the request through the generator's edit path, which exports without alpha, so the
prompt was rewritten to attach nothing and the core was generated again. The ruling above was made
on the earlier artwork and, by its own terms, does not carry to this one.

The shipped file passes every mechanical check — `public/character-assets/enneagram-2/female.webp`,
head width 14.6% against the master's 14.3% — and is awaiting a fresh ruling on the same two
questions.

Outstanding, in order:

1. a fresh visual ruling on the shipped image: same person as the female master, and equal standing
2. the male and neutral presentations of this core, each generated in its own presentation's chat
