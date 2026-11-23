# Manual E2E QA — Round 37 (2026-11-23)

Reading Goals (daily goal, khatma, khatm journey, printed-mushaf logging) and
Reading Plans (templates, day marking, leave/switch, prayer-anchored reminder),
web first, then the same paths in the mobile source.

## Findings

### 1. Switching or leaving a plan silently wiped its progress — FIXED

- **Where:** [PlansView.tsx](../../apps/web/src/components/PlansView.tsx),
  mobile [PlansScreen.tsx](../../apps/mobile/src/screens/PlansScreen.tsx)
- **Symptom:** with "Jewels of the Quran" at 20 %, tapping any other plan card
  (or "Leave plan", or creating a custom plan) replaced it immediately — no
  warning, progress gone. One stray tap on the plan library loses weeks of a
  30/60-day plan.
- **Root cause:** there is a single active plan; `startPlan`/`clearPlan` were
  called straight from the click handlers.
- **Fix:** ask first whenever there is progress to lose (not for an untouched
  or finished plan): web `confirm()` like Collections/Backup already do; mobile
  `Alert.alert` like Collections/Settings, with new `mem.plans.dropBody`,
  `switchTo`, `leaveQ`, `dropOk` strings in all six languages.
- **Regression tests:** [PlansView.test.tsx](../../apps/web/src/components/PlansView.test.tsx)
  — Cancel keeps the plan on switch and on leave; no prompt without progress
  (3 of the 4 tests fail on the old code).

### 2. Plan card called the next day's portion "Today" after "Day done" — FIXED

- **Where:** same two files; mobile strings `mem.plans.nextLabel`/`readAhead`
- **Symptom:** after "Mark Day 1 done" the card read "Day 1 of 5 · Today:
  Sūrah 36 · Read today · ✓ Day done" — Sūrah 36 is Day 2's reading.
- **Root cause:** `computeTodayPortion` reads from the plan's cursor, which
  has already moved past today's portion; the card always labelled it "Today".
- **Fix:** when today's day is complete the card says "Next: … · Read ahead".
- **Verification:** live: "Next: Sūrah 36 · ~9 min | Read ahead | ✓ Day done".
- **Regression test:** first case in `PlansView.test.tsx`.

### 3. Daily-goal choices didn't expose which one is selected — FIXED

- **Where:** [ReadingGoalsView.tsx](../../apps/web/src/components/ReadingGoalsView.tsx)
- **Symptom:** the 2/4/8/16/20-page pills showed the selection only by colour;
  no `aria-pressed`. The khatma "+1"/"−1" had no accessible meaning.
- **Fix:** `aria-pressed` on the goal pills, `type="button"`, and "One page
  forward/back" names on the steppers.
- **Regression test:** "tells assistive tech which daily goal is selected" in
  [ReadingGoalsView.test.tsx](../../apps/web/src/components/ReadingGoalsView.test.tsx).

## Investigated, no bug found

- Reading Goals: progress ring "1 of 4 pages", week strip, khatma 30-day start
  ("Page 0/604 · 30d left · 20/day"), khatm journey "0 of 30 juz complete",
  "✓ Today is counted" after reading.
- Plan reminder: turning it on with notifications blocked still saves and says
  so; "After Maghrib" without a location asks to set one in Prayer Times; the
  reminder options are a proper radio group.
- Plan templates and durations ("Quran in a Year" = 2 pages/day ≈ 10 months,
  described as "under a year").

## Verification

- Web and mobile `tsc` clean; mobile catalogue test passes (placeholders match
  in every locale); prettier clean; touched web tests pass.

## Verdict

3 real bugs found and fixed. Clean streak: 0/3.
