## What changed

<!-- One or two sentences. What does this PR do, and why? -->

## Scope

- [ ] Scoring, questions, challenge selection, profile/consent and result logic are **unchanged**
      (or the change is described below and approved by the Products Owner)
- [ ] No new character assets. The Core 2 pilot stays at 12 (no expansion toward 27 or 432)
- [ ] Wing and A/T behaviour unchanged
- [ ] The existing neutral fallback still works for ambiguous results

<!-- If any box above is unchecked, explain here and name the approver. -->

## Verification

- [ ] `npm test` passes (scoring, resolver, Core 2 pilot, Asset Gate E)
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] For any UI or CSS change: `npm run gate:responsive` passes at 360 px and 390 px

<!-- Paste the relevant output, or say which checks you ran. -->

## Gate impact

- [ ] This PR does **not** change a gate verdict
- [ ] This PR changes a gate verdict — the Products Owner has approved it, named here:

<!-- Gate verdicts (Asset Gate E, UAT/release, overall GO/NO-GO) belong to the Products Owner.
     Engineering may produce and regenerate evidence, but must not flip a verdict. -->

## Release control

- [ ] `NEXT_PUBLIC_LIVING_CHARACTER_PILOT` behaviour is unchanged by this PR
