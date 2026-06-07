# ADR 0013 — Qibla: a pure great-circle bearing in `core`, no port

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

The qibla — the direction of the Kaaba in Makkah from the user's location — is
the second Phase 6 module ([epic #27](https://github.com/UmmahLibrary/ummah-library/issues/27)),
a natural companion to prayer times ([ADR 0012](0012-prayer-times.md)). ADR 0012
noted the qibla was "already available via `adhan`" and implied it would follow
the same template: a port in `core`, the maths in an adapter behind it.

On building it, that turned out to be the wrong shape. Prayer times need
`adhan` because they are an **astronomy problem** — sun position over a date, at a
location, under a calculation convention. The qibla is not: it is the **initial
great-circle bearing** from a point to a fixed point (21.4225°N, 39.8262°E), a
closed-form trig expression with no time, no convention, and no external data.

## Decision

**The qibla lives entirely in `core` as pure arithmetic — no port, no adapter,
no API route.** `core/qibla.ts` exports `KAABA`, `qiblaDirection(from)` (degrees
clockwise from true north) and `compassPoint(bearing)`. It is unit-tested
directly, with reference bearings cross-checked against `adhan`'s `Qibla()` (they
agree to ~4 decimal places).

The `/qibla` page is a thin **client** component: it reuses the location already
stored by prayer times (`ul.prayerCoords`), computes the bearing with the `core`
helper in the browser, and — where the device exposes orientation — renders a
**live compass** (iOS `webkitCompassHeading` or absolute `deviceorientation`),
falling back to a static bearing readout otherwise. No network round-trip.

## Consequences

- **Good:** the qibla is fully **offline** and static — unlike prayer times, it
  needs no serverless function, because there is nothing to compute server-side.
  One fewer adapter, one fewer route, and the logic is shared verbatim with the
  mobile app through `core`.
- **Principle clarified:** "everything external sits behind a port" (0001) is
  about *external* concerns — I/O, vendors, the clock. A closed-form calculation
  is **domain logic** and belongs in `core` directly. We do not add a port just
  to mirror a sibling feature; we add one when something genuinely external needs
  isolating. This corrects the expectation set in ADR 0012.
- **Cost:** the live compass depends on device orientation sensors and their
  browser quirks (iOS permission gating, inconsistent `alpha` framing); the
  bearing itself is always correct, so the page degrades to a numeric readout
  when no reliable heading is available.
