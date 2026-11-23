# Manual E2E QA — Round 65 (2026-11-23)

Keyboard checks on a fresh production build: the round-64 Space fix on the
Juzʾ reader, Ctrl+K on Today, and a Hifz review done entirely from the
keyboard.

## Findings

### 1. Hifz review lost focus on Reveal and after grading — FIXED

- **Where:** [HifzReview.tsx](../../apps/web/src/components/HifzReview.tsx)
- **Symptom:** Enter on "Reveal āyah" replaced the button with the āyah text
  and focus fell to `<body>`; grading replaced the rating buttons with the next
  card, dropping focus again. A screen-reader user wasn't taken to the revealed
  āyah, and the rating buttons had no group label.
- **Fix:** after the reader acts (never on first load), focus moves to the
  revealed āyah (`tabIndex=-1`) and, after grading, to the next card's Reveal
  button; the ratings are a `role="group"` labelled "How well did you remember
  it?".
- **Regression test:** "moves focus to the revealed āyah, then to the next
  card's Reveal button" in [HifzReview.test.tsx](../../apps/web/src/components/HifzReview.test.tsx)
  (fails on the old code).

## Investigated, no bug found

- **Space on the Juzʾ reader** (round 64 fix, production build): with "Loop"
  focused, Space toggled Loop (`aria-pressed` false → true) and did not start
  the recitation.
- **Ctrl+K on Today** focuses the top-bar search box.

## Verification

- Web `tsc` clean; eslint clean; Hifz review tests pass.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
