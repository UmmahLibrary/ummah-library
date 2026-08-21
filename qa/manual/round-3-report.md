# Manual E2E QA — Round 3 (2026-08-21)

Areas covered this round: Search + Hadith filters, Tafsir editions, 99 Names →
Profile aggregation (round 2, folded in below), Reading Plans (start/mark-day/leave),
Ramadan worship checklist, and the Hijri Calendar page together with the two other
widgets that depend on its sighting-adjustment setting.

## Findings

### 1. Hijri sighting-adjustment change didn't propagate to two dependent widgets — FIXED

- **Where:** [apps/web/src/components/SunnahFastReminderToggle.tsx](../../apps/web/src/components/SunnahFastReminderToggle.tsx),
  [apps/web/src/components/FastingQadaTracker.tsx](../../apps/web/src/components/FastingQadaTracker.tsx)
- **Symptom:** On `/calendar`, the "Date adjustment" control (±2 days, to nudge the
  tabular Hijri calendar to match a local moon sighting) sits directly above a
  "Sunnah fasting → Upcoming fasts" list on the **same page**. Changing the
  adjustment updated the calendar grid and its "Observances this month" panel
  immediately, but the white-day (Ayyām al-Bīḍ) dates in "Upcoming fasts" right below
  it stayed stale until a full page reload — a live, same-page inconsistency between
  two widgets showing the same underlying setting.
- **Root cause:** [apps/web/src/lib/hijri.ts](../../apps/web/src/lib/hijri.ts)'s
  `writeHijriAdjust()` already broadcasts a `HIJRI_ADJUST_KEY` `CustomEvent` on write —
  by design, per its own doc comment ("broadcast so every on-page Hijri date re-renders
  together") — and two consumers (`HijriToday.tsx`, `shell/TopBar.tsx`) correctly
  subscribe to it. `SunnahFastReminderToggle` and `FastingQadaTracker` both instead
  called `readHijriAdjust()` once in a mount-only `useEffect([])` and never listened
  for the broadcast, so their `adjust` state only ever reflected whatever was in
  `localStorage` at mount time. `FastingQadaTracker` (on `/tracker`) uses the same
  value to compute Ramaḍān make-up fasts owed, so it carried the identical latent bug,
  just not visibly, since it isn't mounted alongside `HijriCalendar` on any page today.
- **Fix:** both components now subscribe to `HIJRI_ADJUST_KEY` the same way
  `HijriToday.tsx` does, updating `adjust` (and therefore their derived
  `upcomingSunnahFasts`/`fastingQadaOwed` results) the instant the setting changes
  anywhere on the page.
- **Verification:** `pnpm lint` (0 errors), `pnpm typecheck` (clean), `pnpm test`
  (410/410, includes the two new tests), `pnpm build` (clean, run with the dev server
  stopped to avoid the `.next`-corruption artifact noted in round 1). Live re-check on
  `/calendar`: with the adjustment at 0, "Upcoming fasts" showed white days
  Aug 27/28/29; clicking **+2** immediately (no reload) shifted them to
  Aug 25/26/27, matching the "Observances this month" panel's shift.
- **Regression tests:**
  [apps/web/src/components/SunnahFastReminderToggle.test.tsx](../../apps/web/src/components/SunnahFastReminderToggle.test.tsx) —
  renders the component, calls `writeHijriAdjust(2)`, asserts the rendered
  "Upcoming fasts" content actually changes.
  [apps/web/src/components/FastingQadaTracker.test.tsx](../../apps/web/src/components/FastingQadaTracker.test.tsx) —
  adds a case with a ḥayḍ pause on Ramaḍān's last day (owed = 1 at adjust 0), then
  `writeHijriAdjust(2)` pushes that date past month-end so owed correctly drops to 0.
  Both tests confirmed to fail against the pre-fix components (identical output
  before/after the broadcast) and pass after.

## Investigated, no bug found

- **Search / Hadith filters:** "mercy" → 60 Quran results; hadith "intentions" → 34,
  narrowed to Muslim → 2, narrowed further to Ḍaʿīf → 0 with the correct empty state.
  Book + grade filters compose as an AND correctly.
- **Tafsir edition switching:** correctly re-fetches and renders the selected
  commentary for the current ayah.
- **99 Names → Profile:** marking 2 non-adjacent names shows "2/99" consistently on
  both `/names` and `/profile`.
- **Reading Plans:** starting "Jewels of the Quran" (5 days), marking Day 1 done
  (0% → 20%, "✓ Day done"), and "Leave plan" (native-`confirm`-gated) all worked
  correctly. The "Today" portion preview advancing to the *next* day's reading
  (Sūrah 36) immediately after marking Day 1 done, while the header still correctly
  read "Day 1 of 5" — traced to `computeTodayPortion` in
  `packages/core/src/reading-plans.ts`, which intentionally computes "what's next from
  the reading cursor," not "today's calendar-scheduled portion." A deliberate look-ahead
  preview, not a bug — the day counter itself stays calendar-accurate.
- **Ramadan page:** marking a "Suhūr" worship item correctly moved the daily counter
  0/4 → 1/4.
- **Hijri Calendar month navigation (`‹`/`›`):** advancing a month correctly showed the
  next month's actual length (29 vs. 30 days) and its own observances.
- **Qada rapid-click race (previously fixed, `55adba5`):** re-verified — 3 rapid clicks
  on "Record a missed Fajr" correctly recorded `{ fajr: 3 }`.
- **A tooling note, not an app issue:** partway through round 2 the Browser pane's
  `computer` (click/screenshot) actions began timing out (`document.hidden === true` —
  a display-attachment state of the automation session). Worked around for the rest of
  this round by dispatching real DOM events via `javascript_tool` (including
  temporarily stubbing `window.confirm` to get past native confirmation dialogs the
  same way a user clicking "OK" would) — all interactions and their results were still
  exercised against the real running app, just not via simulated mouse coordinates.

## Verification

- `pnpm lint` — 0 errors.
- `pnpm typecheck` — clean across all packages.
- `pnpm test` — 410/410 passed (93 files).
- `pnpm build` — clean (run with the dev server stopped, per the round 1 lesson about
  `.next` corruption from running dev + build concurrently).
- Live re-verification of the fix in the dev server, described above.

## Verdict

One real bug found and fixed this round (the Hijri-adjustment broadcast gap, affecting
two components), with regression tests for both. Round 1 of the 3-in-a-row clean streak
does not apply here since this round had a finding — restarting the clean-streak count
at zero. Continuing to round 4.
