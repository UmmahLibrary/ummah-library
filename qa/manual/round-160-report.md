# Manual E2E QA — Round 160 (2026-11-24)

Iteration 92/100. Area: the mobile counterpart of rounds 157/159 — feedback
after copying an āyah.

## Findings

### 1. Mobile "Copied" was a visual bubble only — FIXED

- **Where:** [`AyahView.tsx`](../../apps/mobile/src/components/AyahView.tsx)
- **Symptom (from source):** Copy verse shows a 2-second bubble with
  `pointerEvents="none"` and no live region — TalkBack/VoiceOver users got no
  confirmation (the app has no other `announceForAccessibility` call).
- **Fix:** `AccessibilityInfo.announceForAccessibility(t("rd.copied"))` right
  after the copy — the existing translated string, so no new copy for six
  languages.

## Verification

mobile `tsc`, ESLint clean (device spot check pending, as in rounds 117/158).

## Verdict

One real accessibility bug, fixed.
