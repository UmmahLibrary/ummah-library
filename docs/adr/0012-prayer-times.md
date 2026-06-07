# ADR 0012 — Prayer times: adhan behind a port, computed on demand

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

Prayer times (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) are the first module of
the Phase 6 Islamic ecosystem ([epic #27](https://github.com/UmmahLibrary/ummah-library/issues/27)).
They depend on the user's **coordinates**, the **date**, a **calculation method**
(Muslim World League, Umm al-Qura, ISNA, …) and the **madhab** (which shifts Asr).
The astronomy is well-solved by the MIT-licensed [`adhan`](https://github.com/batoulapps/adhan-js)
library, so we should not re-derive it. The open question is *where it sits*
without violating the architecture (0001: `core` is pure; external libraries sit
behind ports) or the static-first preference (0003) and local-first stance (0006).

## Decision

**1. A `PrayerTimesCalculator` port in `core`.** It takes a
`PrayerTimesQuery { coordinates, date, method, madhab }` and returns
`PrayerTimings` (six ISO-8601 instants). The method/madhab catalogues
(`CALCULATION_METHODS`, `MADHABS`) and the pure `nextPrayer(timings, now)` helper
live in `core/prayer.ts` — deterministic and unit-tested, clock injected.

**2. `adhan` lives in an adapter.** `AdhanPrayerTimes` (in `packages/adapters`)
implements the port, mapping our method ids to `adhan` presets. It is the only
place that imports `adhan`; `core` and the apps depend on the port, never the
library. Wired in `api` as `prayerTimes`.

**3. Served by a dynamic REST function, not bundled into the client.** A
`force-dynamic` `GET /api/v1/prayer-times?lat&lng&date&method&madhab` calls the
calculator. The calculation is anchored at **noon UTC** of the requested date so
the day used for the sun position is timezone-stable on UTC serverless runtimes;
absolute instants are returned and formatted in the visitor's own timezone.

**4. Local-first UI (0006).** The `/prayer-times` page asks for geolocation in the
browser; the coordinates and the method/madhab choice are stored in
`localStorage` (`ul.prayerCoords` / `ul.prayerMethod` / `ul.prayerMadhab`) and
never sent anywhere except the stateless calculation request. No account, no
tracking, no stored history.

## Consequences

- **Good:** the architecture holds — `core` stays pure, the vendor lib is
  swappable behind one port, and the feature is a thin page plus one function.
  All twelve methods and both madhabs are available immediately, with tests
  pinning a known Umm al-Qura result and the madhab's effect on Asr.
- **Cost:** prayer times need a network round-trip, so they are **not available
  offline** even though the rest of the reader is (0003). If demand warrants it,
  the same adapter could later run in a client bundle or a service worker behind
  the unchanged port — no API change required.
- **Trade-off:** anchoring on noon UTC can pick the neighbouring calendar day
  within a few hours of midnight at extreme longitudes; the effect on times is
  negligible because the solar position barely moves across that window.
- This sets the template for the rest of Phase 6 (Qibla — already available via
  `adhan` — Hijri calendar, Adhkar, Zakat): a pure core surface + a port, with any
  vendor maths in an adapter.
