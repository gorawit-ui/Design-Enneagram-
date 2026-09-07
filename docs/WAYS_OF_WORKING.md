# Ways of working — Vibe, SDLC and PDCA

**Status:** active · **Last updated:** 2026-09-07

This describes how work actually runs in this repository. It was written after the tooling it
refers to existed, so every command below is real and runnable today.

The three ideas are **not alternatives**. They sit at different altitudes and compose:

| | Scope | Cadence |
|---|---|---|
| **SDLC** | one release | linear, front to back |
| **PDCA** | one increment | a loop inside every stage |
| **Vibe** | one task | how you actually type |

---

## 1. SDLC — we already have one

`docs/MBTI_POSE_ACTION_LIVING_CHARACTER_SYSTEM_PLAN.md` defines seven gates. Those gates *are* the
SDLC; they were simply never named as one. Do not add a second lifecycle on top — that produces
documents describing documents, which is how the Gate E record drifted out of date.

| SDLC stage | Existing gate | Owner |
|---|---|---|
| Requirement | PO scope gate | Products Owner |
| Analysis | BA behaviour gate | Business Analyst |
| Design | SA contract gate · UX/UI pose gate | System Analyst · UX/UI |
| Build | Front-end engineering gate | Front-end |
| Test | Asset Gate E · test suites | Design/QA/HR-Privacy |
| Release | UAT/release gate | Products Owner |

**Gate verdicts belong to the Products Owner.** Engineering may produce, regenerate and re-verify
evidence, and must fix defects the evidence exposes — but must never flip a verdict. This split is
enforced socially by `.github/CODEOWNERS` and by the "Gate impact" section of the PR template.

## 2. PDCA — the loop inside each stage

- **Plan** — write down what "done" means before starting.
- **Do** — build it.
- **Check** — run the executable gates below, then the human review that is left over.
- **Act** — PASS approves and moves on; FAIL revises only the failed item; HOLD preserves the
  existing fallback and blocks expansion.

## 3. Vibe — allowed, in its own lane

Vibe coding means exploring by probing rather than by planning: try, measure, re-hypothesise. It is
the fastest way to root-cause something nobody understands yet, and it found the 360 px clip.

It is safe **only because the guardrails are executable.** The rule is not "be careful"; it is
"the tests will stop you".

**Lane A — Vibe (no gate)**
- For: spikes, prototypes, root-cause hunts, throwaway measurement harnesses.
- Must not touch: `app/lib/scoring.ts`, `assessment-data.ts`, `profile-contract.ts`,
  the approved asset manifest, or anything under `public/character-assets/`.
- Ends with a written finding plus a test that captures it. A finding with no test does not
  graduate.

**Lane B — SDLC (gated)**
- Everything that ships. Uses the gates in section 1 and the PR template.

Work moves A → B, never the reverse. If a vibe session starts touching Lane B files, stop and
re-enter through Lane B.

---

## What is executable today

Run by `npm test`, and by CI on every push (`.github/workflows/ci.yml`):

| Command | Proves |
|---|---|
| `npm run test:scoring` | profile contract, scoring fixtures, confidence boundaries, wing adjacency, challenge routing, the 20-question cap |
| `npm run test:pilot` | the 12 approved cells against literal paths, scope guard against 27/432 expansion, presentation parity, the full fallback matrix, Wing/A-T isolation, the release-flag boundary |
| `npm run gate:e` | Asset Gate E technical criterion from the PNG bytes — canvas, RGBA, genuine alpha, transparent corners, size budget — **and that no gate document cites an evidence file that is missing** |
| `npm run lint` · `npm run build` | lint and a production build including the TypeScript check |

Run on demand, because it needs a built app, a server and a browser:

```bash
npm run build && npm run start -- --port 3000 &
BASE_URL=http://127.0.0.1:3000 npm run gate:responsive   # 360px + 390px, all three presentations
npm run gate:sheets                                       # regenerate the Gate E review sheets
```

`gate:responsive` is **required before changing any gate verdict that involves UI**, and the PR
template asks for it on every UI or CSS change. It is not in CI because that would mean carrying a
browser dependency; whether to add one is a Products Owner call with a real cost attached.

## What is still human judgement

Not automated, and deliberately so: **visual quality, Female/Male/Neutral parity, and bias review.**
`npm run gate:sheets` regenerates the 12-cell review sheets so a person can make that call from
current assets rather than from memory.

## Release control

The Core 2 pilot is behind `NEXT_PUBLIC_LIVING_CHARACTER_PILOT`. Setting it to `off` and rebuilding
withdraws the pilot and restores the neutral fallback, with no code change and no effect on scoring.
Default is enabled.

## The rule that matters most

**If a rule matters, make it executable.** Every blocker this project has hit came from a rule that
lived only in prose: a gate record that went stale, evidence files that vanished, a responsive
criterion nobody could run. The rules that never broke — scoring isolation, the 12-asset scope
guard — were the ones a script could check. Prefer one more assertion over one more paragraph.
