# Manual E2E QA — Round 125 (2026-11-24)

Iteration 57/100. Area: prayer times at high latitude — the API across the
high-latitude rules (Bergen 60°N, Tromsø 69.6°N, Svalbard 78°N, near the South
Pole), then the Prayer Times page set to Tromsø.

## Findings

### 1. In polar regions the page printed an Asr before sunrise — FIXED

- **Where:** [`adapters/prayer-times.ts`](../../packages/adapters/src/prayer-times.ts),
  new [`core` `withoutImpossibleTimes`](../../packages/core/src/prayer.ts)
- **Symptom:** Tromsø, 24 Nov (two hours of daylight): Sunrise 10:32, Dhuhr
  11:32, **Asr 08:32**, Maghrib 12:28; Monday's Asr **01:14 AM**. The Asr shadow
  length is never reached that day, and the `adhan` library returns a valid
  but impossible instant instead of "no time" (the existing guard only caught
  *invalid* Dates).
- **Fix:** a pure core guard, anchored on Dhuhr (solar noon always exists):
  Fajr/Sunrise must precede it, Asr/Maghrib/Isha follow it, Asr < Maghrib <
  Isha; anything out of order becomes "" and renders "—" like an uncomputable
  time. Applied in the adapter, so web, mobile and the public API all get it.
- **Verification:** `GET /api/v1/prayer-times?lat=69.65&lng=18.96&date=2026-11-24`
  now returns `asr: ""` with the other times unchanged. (The open page kept
  showing its HTTP-cached copy for the hour, as `max-age=3600` intends.)
- **Regression test:** `core/prayer.test.ts` "blanks an Asr that falls before
  sunrise (Tromsø, late November)" and "leaves an ordinary day untouched".

## Investigated, no bug found

- Rule ids are case-sensitive (`SeventhOfTheNight`); an unknown id falls back to
  "none", as documented in the spec.
- Midnight-sun days (Tromsø in June) correctly return no Fajr/Sunrise/Maghrib/Isha
  under every rule — there is no sunset to anchor them.

## Verification

core 26/26 prayer tests, adapters 42/42; typecheck core + adapters; ESLint clean.

## Verdict

One real correctness bug, fixed for every client.
