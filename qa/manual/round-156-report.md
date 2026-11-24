# Manual E2E QA — Round 156 (2026-11-24)

Iteration 88/100. Area: every `role="dialog"` — modality, name, and whether a
screen reader learns that it opened.

## Findings

### 1. The word-by-word meaning popover was silent to screen readers — FIXED

- **Where:** [`WordByWord.tsx`](../../apps/web/src/components/WordByWord.tsx)
- **Symptom:** tapping a word (with word-by-word on) shows its transliteration
  and meaning in a `role="dialog"` that never receives focus — so a screen
  reader user who activated a word heard nothing at all.
- **Fix:** the popover is a polite, atomic live `role="status"` named "Word
  meaning": its content is spoken when it appears, and it still never steals focus.
- **Regression test:** new `WordByWord.test.tsx` "announces the tapped word's
  meaning as a live status".

## Investigated, no bug found

Go to, first-run setup and Manage translations are `aria-modal` dialogs named
by a heading or label; the Save panel is a named, non-modal inline dialog.
(Words themselves aren't keyboard-focusable — hundreds per page; the āyah
actions and the reader's j/k navigation remain the keyboard route. Noted, not
changed.)

## Verification

Test passes; ESLint clean.

## Verdict

One real accessibility bug, fixed.
