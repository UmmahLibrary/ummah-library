# ADR 0014 — Hijri calendar: tabular arithmetic in `core`, with a user adjustment

- **Status:** Accepted
- **Date:** 2026-06-07

## Context

The Hijri (Islamic) calendar is the third Phase 6 module
([epic #27](https://github.com/UmmahLibrary/ummah-library/issues/27)) and the
first that the rest of the app consumes: prayer times, qibla, and the home
header all want to show *today* in Hijri.

The hard part isn't the arithmetic — it's that there is **no single correct
Hijri date**. Months begin on the sighting of the new moon, which varies by
locality; Saudi Arabia publishes the precomputed **Umm al-Qura** civil calendar;
and there are several **tabular** (purely arithmetic, 30-year cycle) calendars
that approximate it. Following the principle clarified in
[ADR 0013](0013-qibla.md), a closed-form calculation is domain logic and belongs
in `core` — but which calendar, and how honest do we have to be about its error?

## Decision

**1. The tabular civil calendar, pure in `core`.** `core/hijri.ts` implements the
standard tabular Islamic calendar (matching ICU `islamic-civil`):
`gregorianToHijri` / `hijriToGregorian` via Julian Day Number, plus
`isHijriLeapYear`, `hijriMonthLength`, the month catalogue (`HIJRI_MONTHS`, with
Arabic names) and `formatHijri`. It is pure, deterministic, and unit-tested with
reference dates cross-checked against ICU and a 1200-month Gregorian↔Hijri
round-trip. No vendor, no I/O, no port — like the qibla.

**2. A user adjustment, not a false claim of exactness.** The tabular calendar
differs from Umm al-Qura / a local sighting on roughly half of all days, almost
always by exactly one day. Rather than pretend otherwise, every conversion takes
an `adjustmentDays` offset, and the `/calendar` page exposes a **−2…+2 day**
control. The choice is stored locally (`ul.hijriAdjust`, ADR 0006) and broadcast
on a window event so every Hijri date on the page — the badge on prayer
times/qibla/home and the calendar grid — re-renders together.

**3. Local-first, static, shared.** `/calendar` is a static page with a client
calendar (month grid + Gregorian cross-reference). The shared `HijriToday` badge
renders only after mount, since "today" is device-local. The same `core` helpers
back the mobile app unchanged.

## Consequences

- **Good:** Hijri dates are available **everywhere, fully offline**, from one
  pure source of truth, with the mobile app sharing it for free. The adjustment
  lets each user match their authority without us picking a fiqh position.
- **Honest limitation:** out of the box the date can be a day off a given
  locality. The adjustment is the mitigation, and the calendar page says so in
  plain language. We do **not** assert when a month *religiously* begins (that is
  moon-sighting, not arithmetic), so this stays a calendar utility — not
  scholar-reviewed content.
- **Future trigger:** if exact Umm al-Qura dates become a requirement, add a
  generated lookup table in `packages/data` behind a small port and switch the
  web/mobile callers to it — the `HijriDate` shape and the UI stay the same. We
  deliberately do **not** do this now: it is data + ingest for a precision most
  users resolve with a ±1-day nudge.
