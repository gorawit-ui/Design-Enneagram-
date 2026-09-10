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

**Bias / equal standing: PASS on the original trio, and now partly void.** Signed by the Products
Owner 2026-09-08; the male presentation it covered was withdrawn on 2026-09-10 and is being
regenerated, so this ruling stands for the female and neutral and must be given again once the new
male lands. A ruling on equal standing is a ruling on a set, and one member of the set changed.

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

**Ruled 2026-09-09 by the Products Owner: approved, with the likeness knowingly not held.**

- Equal standing: PASS.
- Same person as the female master: **NO**. The Products Owner judged that the figure does not read
  as the same woman, accepted it because it reads well as a second motion of the same character
  family, and directed that production continue.

That is a real relaxation of the premise the master structure was built on, so it is recorded as
one rather than left to look like an oversight. Three cores were locked so that nine cores of a
presentation would be one person; on the evidence of the first derived core, they will not be.

What it costs is bounded, and worth stating so the decision can be revisited on the right grounds.
A participant sees exactly one core in one presentation, so drifting likeness never reaches them.
Where it does reach is the contact sheet of all 27 assets that the production checklist requires,
and anywhere the set is seen together — there, nine different faces in the female column will read
as nine characters rather than one.

The prompts still ask for the same person. That is now a nudge rather than a requirement, and the
gate does not test it: `assets:ingest` compares head width against the master, which holds build,
not identity.

Outstanding: the male and neutral presentations of this core, each generated in its own
presentation's chat, with no attachment.

## Core 2 — Relationship Guide · male

**Withdrawn on style, 2026-09-09.** The Products Owner found the face reads as a real person's
photograph where the rest of the set reads as animation, and asked for it to sit closer to the
Core 1 male.

That is not only a preference. `docs/CHARACTER_ASSET_SYSTEM.md` requires equal detail density and
apparent production value across every core and presentation, so one core rendered at a different
distance from realism fails a clause that is already binding.

It passed every mechanical check first — 1024x1024, alpha intact, 140 KB, head width 12.3% against
the male master's 11.8% — which is the point worth keeping: the gate cannot see this, and could not
have caught it.

Two attempts to give it a number both failed, recorded so they are not repeated. Mean absolute
Laplacian over the whole figure read Core 1 male at 9.04 against Core 2 male's 6.10; over the head
alone, 12.53 against 10.00. Both say Core 2 male carries *less* fine detail, the opposite of what
was seen, because photographic realism lives in proportion, eye rendering and shading gradients
rather than in high-frequency texture. The measurement was discarded rather than kept as a
reassuring number that does not discriminate.

The prompts now carry a STYLE block naming this directly, so the remaining cores are asked for it
rather than left to the word "semi-realistic". Core 2 male is to be generated again against it.

## Core 1 — Standards Keeper · male, withdrawn 2026-09-10

Withdrawn and to be regenerated, on the Products Owner's decision, because the master itself is the
outlier rather than anything derived from it.

Head width as a share of the figure's height, across everything approved so far:

| | Head width |
|---|---|
| male master | 11.8% |
| Core 2 male, regenerated in the stylised look | 13.7% |
| female master | 14.3% |
| Core 2 female | 14.6% |
| neutral master | 15.7% |

A smaller head reads as realistic proportion and a larger one as stylised, and the male master sits
alone at the realistic end while the other two masters sit at the stylised end. That is very likely
the source of the original complaint — Core 2 male read as a photograph of a real person, and it was
following the master it was given.

It surfaced through a collision rather than by inspection. The STYLE block added after that
complaint asks for gently idealised proportions, which pushes the head larger; the regenerated
Core 2 male came back at 13.7% and failed the build check against its own master's 11.8%. The
prompt and the recorded number were pulling in opposite directions, and the number was the wrong
one — 13.7% sits inside the family, 11.8% does not.

Regenerating the master rather than the derived asset costs the same single generation and fixes
the nine male cores at once, instead of fighting the same collision on each of them.

`outputs/asset-masters/proportions.json` no longer carries a male entry, so the male prompts state
the shared target until the new master is measured and locked.
