# ADR 0031 — Ḥayḍ (menstruation) pause for prayer tracking

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

The prayer tracker ([0020](0020-prayer-tracker.md)) rewards a streak of complete
days and shows a "missed" history. For roughly half the user base this is
incorrect during menstruation (ḥayḍ): a woman does not pray during her period,
and — per fiqh — those prayers are **not** made up. Without a pause, the tracker
punishes a religiously-correct gap as a broken streak and a wall of "missed"
days. Pillars and Athan both ship a menstrual pause that preserves the streak;
it is the first parity item from the Phase 8 set (#138) and a sibling of the
qaḍāʾ tracker ([0030](0030-qada-tracker.md)).

This is purely the user's own habit data, like the prayer log and the backlog
([0006](0006-local-first-persistence.md)) — no external system involved.

## Decision

**1. The maths is pure `core`.** `core/haid.ts` holds the pause shape
(`HaidLog` = a list of `{ start, end? }` periods; an absent `end` is an ongoing
pause) and immutable, deterministic helpers: `isPaused`, `currentPeriod`,
`periodLength`, `startPause` / `endPause` / `togglePauseToday`, and the
pause-aware streak functions `prayerStreakWithPause` and
`longestPrayerStreakWithPause`. The log holds at most one open period and never
overlaps. Everything is unit-tested.

**2. Pauses are transparent to the streak, not breaks.** The streak walk treats
a paused day as neither extending nor breaking the run, so an active day before
the pause connects to an active day after it. Paused days are also excluded from
the "missed" history (rendered as *Paused*, a dashed cell) and naturally drop out
of the on-time rate (they hold no logged prayers). Crucially, paused prayers are
**not** added to the qaḍāʾ backlog ([0030](0030-qada-tracker.md)) — menstrual
prayers are not made up.

**3. A separate domain, behind its own port.** Like the qaḍāʾ work, the pause is
its own module and **does not touch `prayer-tracker.ts`** — the existing streak
math is untouched and the UIs opt in by calling the pause-aware functions. It is
persisted behind a `HaidStore` (`read`/`write`) under `ul.haid`, with a
`localStorage` web adapter and an `AsyncStorage` mobile adapter
([0024](0024-local-storage-ports.md), enforced by [0028](0028-persistence-enforcement.md)).
The web feature glue emits a window event so the tracker page re-renders.

## Consequences

- **Good:** a correctness fix that keeps the tracker honest for menstruating
  users, 100% local — no backend, no accounts, no PII. The `ul.haid` key is
  picked up by the key-agnostic backup ([0018](0018-local-data-backup.md)) for
  free, and the port is the seam for sync (#25).
- **Scope / deferred:** this ships the **prayer** side of #138. Flagging *fasts*
  missed during a pause as qaḍāʾ is **not** included: the Ramaḍān tracker is
  day-number indexed (`Record<number, true>`), not date-based, so mapping a
  Gregorian pause range to specific fasts to make up needs a date-based fasting
  tracker that does not exist yet. The issue itself notes this dependency; it is
  tracked as a follow-up.
- **Limit & trigger to revisit:** per-device like all local-first data until the
  export/import bridge (0018) or accounts/sync (#25). When a date-based fasting
  tracker lands, wire the pause range into fast make-up.
