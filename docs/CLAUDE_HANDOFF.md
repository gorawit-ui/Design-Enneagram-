# Claude Handoff — Core 2 Living Character Pilot

**Last updated:** 2026-09-07 (session 3 — Asset Gate E recorded PASS)
**Branch:** `feat/core2-living-character-integration` · **PR:** #2 (open, CI green, unreviewed)
**Base:** `main` @ `b794900` — fast-forward possible
**Asset Gate E:** **PASS** (2026-09-07) · six of seven gates still `NOT RUN` · overall **NO-GO**
**Production deployment:** **NOT ALLOWED** — see [Deployment status](#deployment-status)

> Sections 1–4 below are the original session-1 record and are kept for history. Where they
> conflict with a later addendum, **the newest addendum is authoritative** — in particular B1, B2,
> B3 and the Gate E verdict have all changed since section 4 was written.

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


---

# Session 2 addendum — 2026-09-07

Executed the agreed sequence 1 → 5. Everything below is verified, not asserted.

## 1. B2 fixed — 360 px result-layout clip

**Root cause:** `.app-shell{overflow:hidden}`. Once the result page overflowed vertically, `hidden`
turned the shell into a scroll container and horizontal centring resolved against the scrollable
overflow area instead of the content box, shifting the whole page ~27 px left and clipping ~15 px.

**Fix:** one declaration in `app/globals.css` — `overflow:hidden;overflow:clip`. `clip` clips
without creating a scroll container, which is the actual intent (hiding the decorative `.ambient`
blurs). `hidden` is retained first as a fallback for browsers that do not support `clip`.

Two hypotheses were tested and **disproved** before this one: `margin:auto` on `.stage`, and on
`.site-header`/`.result-wrap`. Neither changed anything. The bug is height-dependent — it reproduces
at 360×800 but not at 360×900 — which is why a single-height check can miss it.

Verified at 360×800, 360×900, 390×844 and 320×800: `.stage` at the correct offset, zero
non-decorative elements outside the viewport, no horizontal scroll, `scrollHeight` unchanged.

## 2. The gates are now executable

| Command | Replaces | In `npm test` / CI |
|---|---|---|
| `npm run gate:e` | manual Asset Gate E technical review | yes |
| `npm run gate:responsive` | manual 360/390 review | no — needs server + browser |
| `npm run gate:sheets` | hand-made review sheets | no — on demand |

`gate:e` proves canvas, RGBA, genuine alpha, transparent corners and size budget from the PNG bytes,
**and fails when a gate document cites an evidence file that does not exist** — the exact failure
that produced B1. Both new gates are mutation-verified: removing the CSS fix makes `gate:responsive`
fail at 360 px (and still pass at 390 px, matching real behaviour).

## 3. CI and review controls

- `.github/workflows/ci.yml` — lint, test (incl. `gate:e`), build on every push and PR to `main`.
- `.github/pull_request_template.md` — scope, verification and an explicit **Gate impact** section
  stating that verdicts belong to the Products Owner.
- `.github/CODEOWNERS` — review ownership over frozen scoring logic, the pilot manifest and flag,
  the assets, `outputs/`, the plan, and the gate scripts themselves.
- `docs/WAYS_OF_WORKING.md` — the Vibe / SDLC / PDCA lanes, written last so it documents what
  exists. Key point recorded there: the seven existing gates already **are** the SDLC, so no second
  lifecycle was added.

## 4. Gate E evidence restored

`outputs/CORE2_POSE_ACTION_GATE_E_360.png` and `_390.png` regenerated (12 cells, rows
INTJ/ISTJ/ENFP/ESFP × columns Female/Male/Neutral, on a checkerboard that proves real alpha).

The third cited file, `CORE2_ENFP_FEMALE_NORMALIZED_PENDING.png`, was an obsolete intermediate: the
normalised copy was promoted to its final path long ago. Its citation was corrected in the gate
document, with the original FAIL text preserved as a quote, and a **QA addendum** appended recording
the re-verified facts.

**The Gate E verdict was NOT changed.** `Gate E: FAIL. Release action: HOLD.` still stands verbatim
at line 111. Flipping it is the Products Owner's decision.

## Blocker status after this session

| # | Was | Now |
|---|---|---|
| B1 | Gate E stale, 3 evidence files missing | **Closed** in session 3 — evidence regenerated, citations valid, `gate:e` prevents recurrence, and the verdict is now PASS with the plan's release table reconciled |
| B2 | 360 px clip | **Closed** — fixed, verified, guarded by `gate:responsive` |
| B3 | Pilot live under HOLD | **Closed** in session 3 — the premise was "enabled while the gate says HOLD". Gate E is now PASS, so the enabled default is consistent with the gate. The flag still exists as the withdrawal mechanism |
| B4 | No PR, unreviewed | **Partly cleared** — PR #2 is open with green CI; nobody has reviewed the diff yet, and CODEOWNERS cannot force it on a self-authored PR |
| B5 | Evidence ephemeral | **Closed** — review sheets committed; live screenshots regenerate via one command (`outputs/gate-e/` is gitignored to avoid binary churn) |

## Exact next task

**Asset Gate E is PASS as of 2026-09-07** (see the session 3 addendum below). The remaining gates
are other people's, and none of them is engineering work:

1. **Front-end engineering gate** — still `NOT RUN`. Owner: Sr. Front-end Developer. The
   implementation evidence it needs now exists (PR #2, green CI, four test suites, two executable
   gates), so this is a review, not a build.
2. **UAT/release gate** — still `NOT RUN`. Owner: Products Owner. Needs all signed evidence and
   regression results.
3. **PO scope · BA behaviour · SA contract · UX/UI pose gates** — all still `NOT RUN`. These were
   never run even though the Plan phase produced their evidence; someone has to actually sign them.
4. **Review and merge PR #2.** Note that `.github/CODEOWNERS` names the PR's own author, so it
   cannot force a review on this PR — a second reviewer or branch protection on `main` is needed
   for that, and both are repo/org settings Claude cannot change.

Optional engineering follow-up, with a real cost, for the PO to weigh: adding a browser dependency
so `gate:responsive` can run in CI instead of on demand.

## Deployment status

**Still NOT allowed** — but for a different reason than before.

Gate E is no longer the blocker. The blockers now are that **six of the seven gates remain
`NOT RUN`**, and the plan's overall decision still reads `NO-GO until the pilot passes all gates`.
The Gate E decision itself says it does not authorize implementation, deployment or expansion; the
plan requires those to be authorized separately.

Do not merge to `main` and do not deploy until the Front-end engineering gate and the UAT/release
gate pass and the Products Owner changes the overall decision.

---

# Session 3 addendum — 2026-09-07 · Asset Gate E PASS

## Decision recorded

The Products Owner reviewed the regenerated 12-cell sheets and ruled **Visual, Parity and Bias =
PASS**. With the automated categories already green, all six acceptance categories now pass and
Asset Gate E is recorded **PASS**.

| Category | Verdict | Determined by |
|---|---|---|
| Technical | PASS | `npm run gate:e` — from the PNG bytes |
| Visual | PASS | Products Owner review |
| Parity | PASS | Products Owner review |
| Bias | PASS | Products Owner review |
| UX | PASS | `npm run gate:responsive` — 360 px, 390 px, desktop |
| Logic | PASS | `npm test` |

Recorded in two places, kept consistent:

- `outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md` — verdict replaced with PASS plus the category table.
  The original FAIL/HOLD text is **preserved verbatim as a quoted "superseded record"**, not
  deleted, and the note that its one recorded blocker was resolved on the exact terms it set.
- `docs/MBTI_POSE_ACTION_LIVING_CHARACTER_SYSTEM_PLAN.md` — the Asset Gate E row only, now
  `**PASS** (2026-09-07)`. One line changed; the six other gate rows and the overall decision were
  deliberately left untouched.

## Desktop gap closed before recording the verdict

The plan's UX PASS names **three** widths: "360 px, 390 px, and desktop". `gate:responsive` covered
only two, so recording a PASS would have meant claiming a category whose evidence was incomplete —
which the plan itself counts as FAIL ("Missing evidence … is FAIL; there is no partial release
pass"). Desktop (1280×800) was added first and passed: 9/9 cells across three widths and three
presentations.

Two output-accuracy defects in the gate script were fixed at the same time: the row label printed
`desktoppx`, and the success message hardcoded "360px and 390px", which would have kept printing a
stale claim as widths were added. The summary now derives the width list from the viewport table.

## What Gate E PASS does and does not authorize

**Does:** approves the Core 2 pilot template, per the plan's Act step.

**Does not:** authorize implementation, deployment, or expansion beyond the 12 approved assets. The
plan requires those separately. Six of seven gates remain `NOT RUN` and the overall decision still
reads `NO-GO until the pilot passes all gates`.

## Guard against silent drift

The human review is now load-bearing, so it is recorded as such: any future change to the assets
requires the visual/parity/bias review to be repeated. The automated gates deliberately cannot
substitute for it, and `gate:e` will fail if a future edit leaves a gate document citing evidence
that no longer exists.
