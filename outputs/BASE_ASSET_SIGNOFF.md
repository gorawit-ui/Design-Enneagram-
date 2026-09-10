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

**Bias / equal standing: PASS.** Signed by the Products Owner 2026-09-08 on the original trio, and
given again on 2026-09-10 after the male presentation was withdrawn and regenerated. A ruling on
equal standing is a ruling on a set, so it was re-taken rather than carried over when one member of
the set changed. The measured builds below are the original trio's; the male row is superseded by
the entry at the end of this file.

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

## Core 1 — male, regenerated 2026-09-10

The replacement is in and passes every mechanical check. It also disproves the reasoning that asked
for it, which is worth stating plainly because the Products Owner chose option C on that reasoning.

The claim was that the male master's small head — 11.8% where the other two masters sit at 14.3%
and 15.7% — was what made the male presentation read photographically, and that regenerating it
inside the family's range would fix the style at its source. The new master came back at **12.0%**,
essentially unchanged, and reads clearly stylised. Head width and photographic realism are
independent; the STYLE block is what fixed the style, and it would have fixed it without touching
the master.

The numeric range in the prompt did not move the result either. It asked for 14.3 to 15.7% and got
12.0%, so the generator's prior for male proportions is stronger than the instruction. Male figures
are simply drawn with smaller heads here, and that is now recorded as the male presentation's own
locked number rather than treated as a defect.

What this leaves open is the Core 2 male that was rejected at 13.7%. It failed against the old
11.8% by 1.9pp and would fail against 12.0% by 1.7pp, on a 1.5pp tolerance. Two same-prompt
generations of this presentation have now come back 1.7pp apart, while the two female generations
came back 0.3pp apart — too little evidence to say whether the tolerance is too tight or that one
asset is genuinely off, and not something to settle by loosening the check until it passes.

**Ruled 2026-09-10 by the Products Owner: approved.** Preferred over the withdrawn male, and equal
standing beside the female and neutral confirmed with the three seen side by side. The Core 1
equal-standing sign-off is therefore whole again and covers all three presentations, on this male
rather than the withdrawn one.

Recorded proportions: head 12.0%, shoulders 29.8%, ratio 2.48.

## Core 2 — Relationship Guide · male, regenerated 2026-09-10

Generated in the new male master's own chat with no attachment, against the STYLE block. In the
repository at `public/character-assets/enneagram-2/male.webp`, 153 KB, alpha intact.

**Mechanical: PASS.** Head width 13.3% against the new male master's 12.0% — 1.3pp apart, inside the
1.5pp tolerance. Margin 12.0% on every side, figure fitted to the central 76%, same framing as every
other base asset.

**Ruled 2026-09-10 by the Products Owner: approved.** Both questions answered yes, on the two
side-by-side renders at equal on-screen height: the figure reads as the same person as the male
master, and it reads as equal in standing beside the Core 2 female.

Worth recording that this is the first derived core where the likeness held. Core 2 female was
approved with the same-person premise knowingly relaxed; Core 2 male was not asked for any
relaxation and did not need one. So the drift recorded on the female entry is not a property of the
derived-core method — it happened on one asset, not on the approach.

The male presentation's equal-standing ruling now covers Core 2 as well as Core 1. It still does not
carry forward to cores 3-9 automatically: those pose differently, and a more assertive action can
turn the same build into a power cue.

This also adds the fourth data point to the head-width spread that was left unresolved on the Core 1
male entry above:

| Male generation | Head width |
|---|---|
| original master (withdrawn) | 11.8% |
| Core 2, first attempt (withdrawn on style) | 13.7% |
| regenerated master (locked) | 12.0% |
| Core 2, this asset | 13.3% |

Both derived Core 2 attempts land near 13.5% while both masters land near 12%, which is a more
orderly picture than random scatter: the outstretched-arm pose appears to draw the head slightly
larger relative to the figure's height, or the map prop shortens the apparent body. Either way the
1.5pp tolerance held on this asset without being touched, so it stays as it is. If a later core in
this presentation fails it by a few tenths, the question to ask is whether the tolerance should be
measured against a pose-matched master, not whether to widen it.

## Core 2 — Relationship Guide · neutral, 2026-09-10

Generated in the neutral master's own chat with no attachment, against the STYLE block. In the
repository at `public/character-assets/enneagram-2/neutral.webp`, 134 KB, alpha intact.

**Mechanical: PASS.** Head width 14.8% against the neutral master's 15.7% — 0.9pp apart, inside the
1.5pp tolerance. Margin 12.0% on every side, figure fitted to the central 76%, same framing as every
other base asset.

**Human ruling: pending.** The same two questions the gate cannot answer are open: same person as
the neutral master, and equal in standing beside the female and male.

Note on direction of drift, which is now consistent enough to be worth recording. Every derived
Core 2 asset moved its head width *toward* the middle of the family and away from its own master:

| Presentation | Master | Core 2 | Direction |
|---|---|---|---|
| female | 14.3% | 14.6% | +0.3pp, up |
| male | 12.0% | 13.3% | +1.3pp, up |
| neutral | 15.7% | 14.8% | −0.9pp, down |

The two masters below the middle moved up, the one above it moved down. That is the generator's own
prior for this pose pulling all three toward roughly 14%, not three independent errors. It means the
presentations converge slightly as cores are added rather than diverge, which is the harmless
direction for the equal-standing criterion — but it also means the 1.5pp tolerance is measuring
partly the pose and partly the build. The male is the presentation with room to fail it first,
since it starts furthest from the middle.
