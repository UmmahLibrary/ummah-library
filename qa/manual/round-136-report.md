# Manual E2E QA — Round 136 (2026-11-24)

Iteration 68/100. Area: which "day" each tracker uses — a sweep for UTC dates
(`toISOString().slice(0, 10)`) used as the reader's "today".

## Findings

### 1. Hifz streaks and the review heatmap counted UTC days, not the reader's — FIXED

- **Where:** [`core/hifz-analytics.ts`](../../packages/core/src/hifz-analytics.ts)
  (activity log, heatmap, streaks — shared by web and mobile),
  [`web lib/hifz-streak.ts`](../../apps/web/src/lib/hifz-streak.ts)
- **Symptom (from source, then tests in four timezones):** review activity was
  keyed by the UTC date. In New York a 7 pm review is "tomorrow" in UTC, so it
  lit up the next heatmap cell, and daily reviews either side of 19:00 EST could
  skip a UTC day (streak reset) or share one. In Dubai a 1 am review counted for
  the previous day. Every other tracker — prayer log, reading goals, plans — and
  the **mobile** Hifz streak already used the local day, so web and mobile
  streaks disagreed for the same reviews.
- **Fix:** keys are the reader's local calendar day; the heatmap and streak
  arithmetic still runs on UTC-midnight dates internally, so daylight saving
  can't shift it. The web streak store uses the local day like mobile.
- **Regression tests:** `core/hifz-analytics.test.ts` — "increments the
  reader's local day count…", "keys by the local calendar day, not the UTC one";
  all 10 pass under `TZ=Asia/Dubai`, `America/New_York`, `Asia/Tokyo`,
  `Pacific/Kiritimati`.

## Investigated, no bug found

The other `toISOString().slice(0,10)` uses are pure date-string arithmetic
(`consistency.ts`, `reading-goals.ts addDays`, `reading-plans.ts`) or the
ingest's "retrieved" stamp — not "today".

## Verification

core 597/597, web hifz tests 24/24, mobile 204/204; typecheck core/web/mobile;
ESLint clean.

## Verdict

One real bug (both apps), fixed.
