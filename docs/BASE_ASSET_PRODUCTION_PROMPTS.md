# Module 2 Base Asset Production Prompts

**Purpose:** produce the 24 missing base assets (8 cores × Female/Male/Neutral) plus the one
exploration fallback, so the Module 2 release gate condition *"27 base assets and one exploration
fallback are approved and present"* can pass.

**Status:** production prompts only. Generating an asset does not approve it. Every output must
clear the checklist in [§5](#5-acceptance-checklist-run-before-submitting-anything) and then a human
visual / parity / bias review.

**Provenance:** the shared block in §2 is derived from the prompt set that actually passed Asset
Gate E for the 12-asset Core 2 pose pilot, adapted to the base-asset canvas contract. Keep this
file with the assets — `manifest.json` requires *"prompt or generation provenance when AI-assisted"*
and this document is that record.

---

## 1. What is missing

Core 5 already has three base assets. Everything below is outstanding:

| Core | Title | Base assets |
|---|---|---|
| 1 | Standards Keeper | ❌ 0/3 |
| 2 | Relationship Guide | ❌ 0/3 |
| 3 | Goal Driver | ❌ 0/3 |
| 4 | Identity Storyteller | ❌ 0/3 |
| 5 | Systems Cartographer | ⚠️ 3/3 present, but off-spec — see §6 |
| 6 | Risk Scout | ❌ 0/3 |
| 7 | Possibility Explorer | ❌ 0/3 |
| 8 | Boundary Guardian | ❌ 0/3 |
| 9 | Path Harmoniser | ❌ 0/3 |
| — | exploration fallback | ❌ 0/1 |

**Base assets are per Enneagram core only.** MBTI, Wing and A/T are *not* baked into a base asset —
they are later layers. Do not vary a base asset by MBTI type.

Output paths: `public/character-assets/enneagram-{core}/{female|male|neutral}` and
`public/character-assets/fallback/exploration-neutral`.

## 2. Locked block — paste this into every prompt, unchanged

> Polished, warm, semi-realistic 3D character illustration of a single adult, full body, standing,
> centred on a fully transparent background.
>
> **Build:** one balanced adult proportion guide, identical across every character in this family.
> Body shape carries no personality, competence, gender or status meaning.
>
> **Wardrobe (identical for every core and every presentation):** forest-green blazer, ivory knit
> top, straight charcoal trousers, flat-soled black ankle boots. No heels on any presentation —
> footwear is identical across female, male and neutral, so it cannot become a parity difference or
> a gender-value cue.
>
> **Props:** held, worn, or resting on a surface the character is touching. Never floating detached
> in mid-air, and never presented as an award, medal, trophy, rosette or rank badge.
>
> **Palette:** matcha green, forest green, ivory. Core-specific accents only in the prop. Never use colour alone to signal anything.
>
> **Finish:** equal lighting, detail density and apparent production value across all cores and
> presentations. Soft, even, warm key light. No dramatic rim light, no lens effects.
>
> **Framing:** square canvas, 1024 × 1024. Face, both hands, both feet and the prop are all fully
> visible and unclipped. Keep the face, prop and identifying silhouette inside the central 76% of
> the canvas. Leave at least 8% empty transparent margin on all four sides.
>
> **Background:** the canvas contains the character and the prop, and nothing else. Every pixel
> that is not the character or the prop is fully transparent — a cut-out figure on empty space.
> `app/result-view.tsx` renders the scene motif as a CSS layer behind the image at runtime, so a
> motif baked into the PNG is duplicated, un-editable, and breaks derivative parity by forcing the
> model to redraw the motif as well as the figure.
>
> **Never include:** text, numbers, letters, logos, watermarks, participant data, charts, money,
> luxury or status objects, badges of rank, job titles, distress, pathology, medical or diagnostic
> cues, dominance posturing, flirtation, or any body-shape encoding of personality or gender.

## 3. Per-core prompt — the Female master

Generate the **Female master first**. It becomes the reference for the other two presentations.

Prompt template — paste the §2 locked block, then this:

```
CORE: {core-number} — {title}
POSE ORIENTATION: {pose}
ACTION: {action}
PROP: {prop}
EXPRESSION: {expression}
PRESENTATION: female presentation, conveyed only through face and hair.
PROHIBITED READING FOR THIS CORE: never {prohibited}.
```

Fill from this table:

| Core | Title | Pose | Action | Prop | Expression | Never read as |
|---|---|---|---|---|---|---|
| **1** | Standards Keeper | forward | stands steady and checks one item in an open notebook | a standards notebook and a small quality seal | calm, attentive, unhurried | rigid enforcer, scolding, morally superior, joyless |
| **2** | Relationship Guide | right | opens a network map toward the viewer's side with a welcoming hand | a network map and a small welcome set | warm, friendly, contained | self-sacrificing, ingratiating, intrusive, emotionally needy |
| **3** | Goal Driver | right | indicates one milestone on a goal board | a goal board and a small progress marker | focused, positive, composed | status-seeking, boastful, salesy, image-obsessed |
| **4** | Identity Storyteller | left | holds an open story notebook beside layered colour swatches | a story notebook and mood colour swatches | thoughtful, sincere, settled | melancholic, tortured artist, fragile, self-absorbed |
| **6** | Risk Scout | forward | holds a compass level while a contingency satchel rests ready | a risk compass and a contingency satchel | prepared, steady, alert but calm | anxious, paranoid, fearful, distrustful |
| **7** | Possibility Explorer | right | raises a spotting scope toward an open route among idea cards | a spotting scope and idea cards | bright, curious, contained | scattered, manic, childish, thrill-seeking |
| **8** | Boundary Guardian | forward | holds a boundary shield steady, decision baton lowered and relaxed | a boundary shield and a decision baton | warm but firm, grounded | aggressive, intimidating, domineering, confrontational |
| **9** | Path Harmoniser | left | gathers several path strands into one ring with both hands | a path ring and a joining cord | settled, unhurried, present | passive, sleepy, checked-out, conflict-avoidant |

## 4. Male and Neutral derivatives

Do **not** generate these from scratch. Derive each from that core's approved Female master with a
face/hair-only edit, or the trio will fail parity review.

```
Using the attached approved master as the exact reference, change ONLY the face and hair
to read as {male | gender-neutral} presentation.

Keep IDENTICAL and unchanged: pose, gaze direction and target, shoulder line, arm positions,
which hand holds what, finger placement, foot stance, wardrobe, prop shape and position,
background motif and its placement, lighting direction and intensity, canvas position, scale,
crop, and expression intensity.

Do not change body build, height, shoulder width, or silhouette. Do not add or remove any
prop or motif. Do not restyle the wardrobe. Do not alter the expression's intensity — only
the face's presentation.

Background must remain true transparent RGBA.
```

**Parity is the criterion most likely to fail.** Before submitting a trio, put the three side by
side and confirm that the only difference you can name is face and hair. If a second difference is
nameable, the derivative is rejected — regenerate it, do not "fix" it by editing the master.

### If the output has a baked background

The pilot hit this repeatedly. Re-run the accepted output through a background-extraction pass:

```
Remove only the baked checkerboard or background pixels from the attached image.
Produce genuine alpha transparency. Preserve fine edges, hair strands and prop edges exactly.
No halo, no fringe, no colour bleed at the silhouette. Do not alter the character, prop,
motif, lighting, or framing in any way.
```

## 5. Acceptance checklist — run before submitting anything

Technical, per asset. The base-asset contract differs from the pose pilot's — do not reuse the
pilot's numbers:

- [ ] Generated square **1024 × 1024**, transparent — the model's native square and exactly the
      runtime target. See the canvas deviation in §6 before treating this as a master.
- [ ] Runtime export **1024 × 1024**, transparent, sRGB
- [ ] **≤ 180 KB preferred, 250 KB hard gate** (the pose pilot's 750 KB budget does not apply here)
- [ ] Genuine alpha: fully transparent pixels present, fully opaque pixels present, all four
      corners transparent
- [ ] ≥ 8% transparent margin on all four sides; face, prop and silhouette inside the central 76%
- [ ] No text, numbers, letters, logo or watermark anywhere in the image
- [ ] Nothing critical smaller than ~4 CSS px when the asset renders at a 360 px viewport

Family, per trio and across cores:

- [ ] Female / Male / Neutral differ **only** in face and hair
- [ ] Same proportions, wardrobe, lighting, finish and production value as every other core
- [ ] The core reads from the **action and prop**, not from colour alone
- [ ] None of that core's prohibited readings is present
- [ ] No core looks more competent, senior, intelligent or employable than another
- [ ] No presentation gets a stronger pose, a better prop, or a higher finish than its siblings

Then, in the repo:

```bash
npm run assets:manifest    # regenerate the manifest with dimensions, sizes and checksums
npm run gate:m2            # scoreboard: base count, canvas, budget, gaps
```

`gate:m2` will still report the human rows — parity, stereotype, proportions and the five-party
approval are not automatable and are not meant to be.

## 6. Two decisions to settle before mass production

Both are live and both change what to generate. Settle them first or 24 assets may need redoing.

**File format.** The spec in `docs/CHARACTER_ASSET_SYSTEM.md` says runtime assets are `.webp`.
Every asset on disk is `.png`, including the 12 that Asset Gate E passed and whose tests assert a
PNG signature. Migrating those 12 would invalidate a passed gate. Either align the spec to PNG, or
keep WebP for the base family only and accept two formats. **Decide before generating.**

**Master resolution.** The spec asks for a master of 2048 × 2048 or larger. Hosted image
generation returns fixed native sizes (1024 × 1024, 1024 × 1536, 1536 × 1024), so asking for 2048
gets a silently downsized image or a lossy upscale — which is how the pilot ended up at the
non-native 1122 × 1402 and 1072 × 1467. These prompts ask for 1024 × 1024 instead: native, sharp,
and identical to the runtime target. That leaves **no ≥2048 master**, which is a real deviation.
Either relax the master requirement, or produce masters with a tool that renders at 2048.

**Core 5.** Its three existing assets are off-spec on all three counts: `1122×1402`, `1072×1467`
and `1024×1536` instead of `1024×1024`; PNG instead of WebP; and 901 KB, 1096 KB and 1803 KB
against a 250 KB hard gate. Module 2 cannot pass with them as they are, so Core 5 needs regenerating
or normalising alongside the other eight. It is not a spare core that can be skipped.

## 7. Exploration fallback

One asset, shown when the core or MBTI result is ambiguous. It must not read as any particular core.

Paste the §2 locked block, then:

```
CORE: none — this is the neutral exploration fallback.
POSE ORIENTATION: forward.
ACTION: stands calmly with an open, unmarked map held loosely in both hands, as if still
  choosing a direction.
PROP: one blank, unmarked open map. No core prop, no seal, no shield, no scope, no ring.
EXPRESSION: open, unhurried, neither confident nor uncertain.
PRESENTATION: gender-neutral, conveyed only through face and hair.
PROHIBITED READING: never suggest a conclusion, a diagnosis, a rank, or that any particular
  core has been identified. It must not resemble any of the nine core characters.
```

This asset carries a product rule, not just an art rule: an ambiguous result must never be shown as
though it were confirmed.
