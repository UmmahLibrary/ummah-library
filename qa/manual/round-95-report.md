# Manual E2E QA — Round 95 (2026-11-24)

Iteration 27/100. Area: Reading Goals — the hero, the "This week" chart, goal
pills, khatma buttons; then the same chart on mobile.

## Findings

### 1. The week chart was silent to screen readers — FIXED (web + mobile)

- **Where:** [`ReadingGoalsView.tsx`](../../apps/web/src/components/ReadingGoalsView.tsx),
  [`ReadingGoalsScreen.tsx`](../../apps/mobile/src/screens/ReadingGoalsScreen.tsx)
- **Symptom:** seven bars whose height is the only carrier of pages read (web
  had it in a hover `title`), under single-letter day labels that repeat
  (W T F S S M T). A screen reader heard "W T F S S M T" and nothing else.
- **Fix:** web — a list named "Pages read, last 7 days", each day an item named
  "Tue, Nov 24 (today): 3 pages", letters hidden from AT. Mobile — each column
  is one accessible element named with the localized date and `mem.goals.pages`.
- **Regression test:** `ReadingGoalsView.test.tsx` "names each day of the week
  chart with its date and pages".

## Investigated, no bug found

Goal pills expose `aria-pressed`; "Today is counted" and the khatma buttons
are labelled.

## Verification

ReadingGoals tests 5/5; web + mobile `tsc` clean; ESLint clean.

## Verdict

One real accessibility bug, fixed on both apps.
