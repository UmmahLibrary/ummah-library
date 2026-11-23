# Manual E2E QA — Round 43 (2026-11-23)

Prayer features with a real location, on a device whose clock is set to Dubai:
Prayer Times (geolocation mocked to Makkah), Ramadan, Qibla, and the Prayer
hub card (location London).

## Findings

### 1. Prayer hub card named the device's city, not the location's — FIXED

- **Where:** [ToolsPrayerCard.tsx](../../apps/web/src/components/ToolsPrayerCard.tsx)
- **Symptom:** with the saved location in London, `/prayer` read "Isha 05:54
  PM · in 1h 47m · **Dubai**" — correct London times labelled with the
  device's timezone city.
- **Root cause:** the label came from
  `Intl.DateTimeFormat().resolvedOptions().timeZone` (the device), while the
  times are (correctly, since an earlier round) formatted in the location's
  zone via `timeZoneFor(coords)`.
- **Fix:** the label uses `timeZoneFor(coords)` too, falling back to the
  device zone only when there's no saved location.
- **Verification:** live: "in 1h 46m · London".
- **Regression test:** [ToolsPrayerCard.test.tsx](../../apps/web/src/components/ToolsPrayerCard.test.tsx)
  (fails on the old code when the machine isn't on London time).

## Investigated, no bug found

- Prayer Times for Makkah on a Dubai-clock device: Fajr 05:19, Dhuhr 12:08,
  Maghrib 17:37, Isha 18:51 (Muslim World League) shown in Makkah time; next
  prayer "Fajr in 10h 13m" at 19:05 Makkah time — correct. Weekly table, Imsāk,
  Islamic midnight and last third render.
- Qibla: London → 119° SE (correct great-circle bearing); at the Kaʿbah's own
  coordinates it shows 0° N (degenerate, harmless).
- Ramadan page outside Ramaḍān shows the Hijri date, "—" for the day, and keeps
  the ifṭār countdown year-round on web and mobile alike — consistent design
  (useful for voluntary fasts), not a bug.

## Verification

- Web `tsc` clean; prettier clean; new test passes.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
