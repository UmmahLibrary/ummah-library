# ADR 0020 — Prayer tracker: a pure local prayer log, no port

- **Status:** Accepted
- **Date:** 2026-06-13

## Context

The Noor design adds a **Prayer Tracker**: log the five daily prayers (on time
or late), see today's progress, a day streak, an on-time rate, and the last
week at a glance. It is purely the user's own habit data — the same shape as
reading goals ([0006](0006-local-first-persistence.md)) and hifz
([0007](0007-hifz-spaced-repetition.md)) — with no external system involved.

The design also shows a **fasting** card (Ramaḍān / Sunnah fasts). Fasting is a
distinct domain (and has its own screen in the prototype), so it is out of scope
here — we don't ship a "Log a fast" control with nothing behind it.

## Decision

**1. The stats are pure `core`.** `core/prayer-tracker.ts` holds the log shape
(`PrayerTrackerLog` = date → `{ prayer: "ontime" | "late" }`) and clock-injected
helpers: `prayedCount`, `prayerStreak` (reusing `computeStreak` from reading
goals), `longestStreak`, `onTimeRate`, `recentDays`, and the immutable
`setPrayerStatus` / `nextPrayerStatus`. Locale-specific bits (weekday labels)
stay out of `core`. Everything is unit-tested.

**2. Persistence is local, with no port.** The log lives in `localStorage`
(`ul.prayerLog`) behind `apps/web/lib/prayer-tracker.ts`, which emits a window
event so the page re-renders on change — the established pattern for reading
goals. **No `Notifier`-style port is introduced**: a port abstracts an *external*
system (a DB, an HTTP source, the notification platform), and there is none here.
If a durable or synced store is ever needed (server accounts, or mobile parity),
it would sit behind a repository port exactly as hifz does — that is the trigger
to revisit, and an accounts-adjacent decision (#25) deliberately not taken now.

**3. One tap to log.** Each prayer cycles none → on time → late → none (on time
first, the common case). A complete day (all five logged) is what advances the
streak; the grace-day rule from reading goals keeps an in-progress today from
breaking it.

## Consequences

- **Good:** a useful habit tracker that stays **100% local** — no backend, no
  accounts, no PII. The stats are shared, testable `core`; the mobile app can
  render the same numbers off the same helpers.
- **Scope:** fasting is intentionally deferred to a future Ramaḍān/fasting
  feature; this ADR covers prayer logging only.
- **Limit & trigger to revisit:** the log is per-device (no sync), like all
  local-first data — the [0018](0018-local-data-backup.md) export/import is the
  bridge until accounts/sync are decided.
