# Claude Handoff — Core 2 Living Character Pilot

**Last updated:** 2026-09-07
**Branch:** `feat/core2-living-character-integration`
**HEAD:** `203a83e` (pushed, in sync with origin)
**Base:** `main` @ `b794900` — branch is **3 commits ahead**, fast-forward possible
**Production deployment:** **NOT ALLOWED** — see [Deployment status](#deployment-status)

---

## 1. Completed work

### Session commits

| Commit | Summary |
|---|---|
| `dd334d3` | Removed the obsolete blueprint assessment slice to unblock the build |
| `203a83e` | Completed the Core 2 pilot integration boundary (feature flag, confidence pass-through, focused tests) |

`c04f994` ("Import latest web app and Core 2 pilot") was already on the branch at session start and is also not yet on `main`.

### dd334d3 — build unblocked

`next build` was failing its TypeScript check with 6× `TS5097` (`allowImportingTsExtensions`). Every error came from the pre-import blueprint vertical slice, pulled into the typecheck by `tsconfig` `include: ["**/*.ts"]`.

An import audit confirmed those files were a closed, unreferenced island: nothing under `app/` imported them, no npm script or CI workflow executed `tests/assessment.test.ts` (there is no `.github/workflows` and no test runner), and the only cross-references were between the deleted files themselves. Removed rather than enabling `allowImportingTsExtensions`, which would have legitimised dead code and changed the compiler contract project-wide.

### 203a83e — pilot integration boundary

The 12-asset pilot was **already integrated** before this session: `app/lib/living-character-resolver.ts` already held exactly the 12 approved paths and `app/result-view.tsx` already rendered them. The resolver was not rewritten and is byte-identical. Two parts of the pilot contract were missing:

1. **Feature-flag boundary** (`app/lib/living-character-flag.ts`, new). `enabled: true` was hardcoded at the call site, so the resolver's `flag-disabled` route was unreachable and the pilot could not be withdrawn without a code edit. The system plan's SA contract gate requires a feature-flag boundary. Now switched by `NEXT_PUBLIC_LIVING_CHARACTER_PILOT`: only the exact string `off` withdraws the pilot. **Default (unset) keeps it enabled**, so introducing the flag did not itself change what participants see. Referenced statically so Next.js inlines it at build time.
2. **Confidence forwarded verbatim** (`app/result-view.tsx`). The call site collapsed confidence to `ambiguous ? "ambiguous" : "clear"`, so the resolver could never observe `"close"` and owned only half its own rule. Real values now pass through. Rendering is unchanged — `"close"` already resolved to a specific asset, and either axis reading `"ambiguous"` still routes to the neutral fallback.

### QA gate executed

A full QA gate was run against the production build. **7 of 8 PASS, 1 CONDITIONAL** — see [Remaining blockers](#4-remaining-blockers) for the conditional item.

| Check | Verdict | Evidence |
|---|---|---|
| All 12 asset paths | PASS | 12/12 present, 0 missing, 0 extra under `public/character-assets/living/` |
| 1122×1402 RGBA PNG | PASS | Decoded from PNG bytes: all 12 at `1122×1402`, bit depth 8, colour type 6, non-interlaced, 502–604 KB |
| True transparency | PASS | Full IDAT decode: 79.3–81.5% fully transparent px, all four corners α=0, 1240–2420 fully opaque px |
| Resolver mapping | PASS | 12/12 cells vs literal expected paths; correct per-presentation asset in all 6 live browser runs |
| Ambiguous fallback | PASS | Verified live, not only in unit tests (see below) |
| Scoring isolation | PASS | 0 visual/resolver references in protected modules; 7 scoring/question/profile modules unchanged since `c04f994` |
| 360 / 390 responsive | **CONDITIONAL** | No horizontal scroll, character fully in viewport, 0 console errors — but a pre-existing 360px clip was found |
| test / lint / build | PASS | All EXIT=0 |

**Ambiguous fallback, live.** A worst case was searched for deliberately: effective **Core 2 × ESFP with `mbtiConfidence=ambiguous`** — the resolver *would* map to a pilot asset if the guard failed.

```
AMBIGUOUS      pilot <img>: 0   .character-fallback: 1   label="ภาพกลางสำหรับผลที่ยังไม่ชัดเจน"
NON-AMBIGUOUS  pilot <img>: 1   .character-fallback: 0
```

---

## 2. Changed files

Nothing outside this list was modified. Assets were not touched and none were added — still exactly 12.

### `dd334d3` — 5 files, 209 deletions, 0 insertions

```
D lib/assessment/questions.ts
D lib/assessment/scoring.ts
D lib/assessment/selector.ts
D lib/assessment/types.ts
D tests/assessment.test.ts
```

`lib/` and `tests/` are now empty and gone.

### `203a83e` — 4 files, +285 / −10

```
A app/lib/living-character-flag.ts               feature-flag boundary
M app/result-view.tsx                            flag wired in; confidence forwarded verbatim
A scripts/run-living-character-pilot-tests.mjs   focused resolver + fallback tests
M package.json                                   pilot suite added to `npm test`; `test:pilot` alias
```

### Verified unchanged since `c04f994`

`app/lib/scoring.ts` · `app/lib/assessment-data.ts` · `app/lib/profile-contract.ts` · `app/lib/character-system.ts` · `app/lib/result-insights.ts` · `app/lib/assessment-fixtures.ts` · `app/page.tsx` · `app/lib/living-character-resolver.ts` · `app/lib/character-visual-modifiers.ts`

Scoring, questions, challenge selection, profile, consent, confidence, Wing, A/T and the existing neutral fallback all behave exactly as before.

---

## 3. Test / lint / build results

Run from a clean tree at `203a83e`:

```
npm test        EXIT=0
npm run lint    EXIT=0
npm run build   EXIT=0
```

```
Module 1 tests passed: three-field profile contract, 5 scoring fixtures, confidence
  boundaries, all wing adjacencies, challenge routing, and the 20-question contract.
Living character resolver tests passed: 12 approved paths, PNG contract, deterministic
  mapping, presentation parity, neutral fallbacks, isolation, and no source mutation.
Living character pilot tests passed: 12/12 approved cells, scope guard (4 types x 3
  presentations, Core 2 only), presentation parity, full fallback matrix,
  close-confidence behavior, Wing/A-T isolation, and the feature-flag boundary.
```

Build: TypeScript finished in ~1.3s, 4/4 static pages generated. The build also succeeds with `NEXT_PUBLIC_LIVING_CHARACTER_PILOT=off`.

**The new pilot tests are mutation-verified, not merely green.** Each guard was confirmed to fail when its invariant is broken: a swapped asset path, an unmanifested 13th asset on disk, inverted flag semantics, and a disabled ambiguity guard.

---

## 4. Remaining blockers

### B1 — Gate E is recorded FAIL / HOLD, and the record is stale (blocking)

`outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md` records **Gate E: FAIL, release action: HOLD**, with one blocker: ENFP Female stuck at `1070×1470`.

**That blocker is factually resolved.** All 12 assets in the committed tree measure exactly `1122×1402`, verified twice by independent means. The document has not been updated.

Gate E still cannot be flipped to PASS on repo evidence alone, because all three evidence files it references are **missing** from `outputs/`:

- `CORE2_ENFP_FEMALE_NORMALIZED_PENDING.png`
- `CORE2_POSE_ACTION_GATE_E_360.png`
- `CORE2_POSE_ACTION_GATE_E_390.png`

The visual, parity, bias and responsive criteria were human review judgements whose artefacts are gone.

Two documents also disagree: `docs/MBTI_POSE_ACTION_LIVING_CHARACTER_SYSTEM_PLAN.md:591` records Asset Gate E as **NOT RUN** with overall **NO-GO**, while the Gate E report says FAIL. Reconcile before relying on either.

### B2 — 360px result-layout clip (pre-existing, not pilot-caused)

At 360px, 22 content elements on the result screen — header, hero, all five insight cards, footer — sit at `left=-15`, so roughly 15px is clipped off the left edge by `.app-shell{overflow:hidden}`. It is silent: no scrollbar appears, and `scrollWidth == clientWidth`.

**Attribution is settled.** With the pilot fully disabled (no `<img>`, fallback div rendering), 360px reproduces identically:

```
                     pilot ON            pilot OFF
welcome    stage[l=12  w=336]     stage[l=12  w=336]
question1  stage[l=12  w=336]     stage[l=12  w=336]
RESULT     stage[l=-15 w=336]     stage[l=-15 w=336]   <- identical
```

Result-screen-specific and independent of the pilot. Not fixed — it was out of scope for the QA gate. 390px is clean (only the two decorative `.ambient` blurs extend out, by design).

### B3 — Pilot art renders live while Gate E stands at HOLD (governance)

The flag defaults to enabled, so Core 2 participants see pilot art now. Withdrawing it is a config change (`NEXT_PUBLIC_LIVING_CHARACTER_PILOT=off` + rebuild) rather than a code change, but **running enabled under a HOLD is a decision the Gate E owner has not made on record.**

### B4 — Branch is unreviewed

No pull request exists for `feat/core2-living-character-integration`. The only PR in the repo is #1 (closed, blueprint docs). Nobody has reviewed the integration.

### B5 — Fresh 360/390 evidence is ephemeral

Live 360/390 screenshots and the measurement harness were produced this session but live in the session scratchpad, which does not survive. They are **not** in the repo. Method, if it needs rebuilding: production build → `next start` → Playwright (globally installed at `/opt/node22/lib/node_modules/playwright`, Chromium at `/opt/pw-browsers`) driving the real 20-question flow, measuring only after `document.getAnimations()` resolves and the PNG decodes.

Two traps cost real time and will recur:
- A naive JS LCG (`rng*1103515245`) exceeds float precision and returns an identical sample every iteration — every result looks like Core 1 × ISTJ. Use `mulberry32` / `Math.imul`.
- Measuring during the `fade-in` animation reports shifted boxes. Settle animations first.

A deterministic answer vector reaching **Core 2 × INTJ-A** (both confidences `close`) is:
`[1,0,2,3,0,0,0,1,1,1,1,0,1,1,0,0,1,0]` for the 18 foundation questions, then `c-at`→option 0 and `c-core-2`→option 3.

---

## 5. Exact next task

**Fix the 360px result-view horizontal clip (B2).**

It is the only open engineering defect, it sits inside the Gate E responsive criterion, and it blocks a clean Gate E re-run. Everything else on this list is a human decision or needs the gate owner.

Scope it tightly:

1. Reproduce: build, `next start`, load the result screen at 360px wide, and confirm `.stage` reports `left=-15` while `main.app-shell` is `left=0 width=360`.
2. Find why `.stage` (`width:100%; max-width:1120px; margin:auto`) is offset by −27px on `stage-result` only, when it is correctly at `left=12` on `stage-welcome`, `stage-profile` and `stage-questions`. Start at `app/globals.css` — the `@media(max-width:760px)`, `@media(max-width:390px)` and `.app-shell{padding-inline:…}` rules are the likely interaction. Note `.app-shell{overflow:hidden}` is what makes the clip silent.
3. Fix in `app/globals.css` only. Do not touch the resolver, the flag, scoring, or any asset.
4. Verify at 360px **and** 390px that `.stage` sits at `left=12 width=336`, that no non-decorative element has `left < 0`, and that the character remains fully in viewport.
5. Re-run `npm test && npm run lint && npm run build`.

Do not fix B1, B3 or B4 in code — they need the gate owner.

### Backlog after that

1. Re-run Gate E: regenerate the 360/390 review sheets, redo the human visual/parity/bias review, then update `outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md` and reconcile it with the plan's release table (B1).
2. Put B3 to the Gate E owner: should the flag default to enabled while the gate stands at HOLD?
3. Open a PR for the branch (B4).
4. Decide whether to commit the QA harness so 360/390 evidence stops being ephemeral (B5).

---

## Deployment status

**Production deployment is NOT allowed.**

Four conditions are unmet:

1. **Gate E is recorded FAIL with release action HOLD**, and the plan's release table records overall **NO-GO** (B1).
2. The Gate E decision explicitly says *"do not integrate these candidates and do not begin broader type/Core production."* Integration exists and is enabled by default (B3).
3. An open responsive defect at 360px sits inside the Gate E responsive criterion (B2).
4. No review: the branch has no pull request (B4).

Also do not merge to `main` — `main` is untouched at `b794900` and should stay there until the above is resolved.

Deployment becomes discussable only when: Gate E is re-run and recorded PASS on current evidence, the two governance documents agree, the 360px defect is fixed or explicitly accepted by the gate owner, the branch is reviewed and approved, and the gate owner has decided on record what the flag default should be.

**Safe to do meanwhile:** continue development on this branch, run the test suites, and build locally. The pilot can be withdrawn at any time without a code change via `NEXT_PUBLIC_LIVING_CHARACTER_PILOT=off` followed by a rebuild.
