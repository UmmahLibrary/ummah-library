# ADR 0034 — Fasting qaḍāʾ derived from the ḥayḍ pause

- **Status:** Accepted
- **Date:** 2026-06-26

## Context

The ḥayḍ pause ([0031](0031-haid-pause.md)) shipped the **prayer** side of #138:
paused days don't break the streak and aren't owed as prayer qaḍāʾ (menstrual
prayers are not made up). The **fasting** side was explicitly deferred — and
[0031](0031-haid-pause.md) closes by naming the blocker: "When a date-based
fasting tracker lands, wire the pause range into fast make-up." That follow-up is
#155.

Per fiqh the asymmetry is the whole point: the Ramaḍān fast-days a woman misses
during ḥayḍ **are** made up later (ṣawm qaḍāʾ), even though the prayers are not.
The existing Ramaḍān tracker is **day-number indexed** (`Record<number, true>`
for fasts 1–30 of the current Ramaḍān), so it cannot answer "which dated fasts do
I owe from a Gregorian pause range." We need a date-aware accounting that joins
the pause ranges against Ramaḍān.

Like the pause and the prayer backlog ([0006](0006-local-first-persistence.md)),
this is purely the user's own habit data — no external system.

## Decision

**1. Owed is derived, not stored.** `core/fasting-qada.ts` computes the fasts
owed from the existing `HaidLog` ∩ Ramaḍān: `ramadanPauseDays` walks each pause
period (bounding an open period to the injected "today") and keeps the Gregorian
days whose tabular Hijri month is Ramaḍān (month 9), de-duplicated via a `Set`.
`fastingQadaOwed` is just its length. The Hijri conversion ([0014](0014-hijri-calendar.md))
takes the same user `adjustmentDays` offset the rest of the app uses, so the
±1-day sighting preference is honoured. Pure, deterministic, clock-injected,
unit-tested.

**2. Only the made-up count is persisted.** The single piece of state is
`FastingQadaLog = { madeUp: number }` — how many of the owed fasts have been
completed. `fastingQadaRemaining` = owed − made-up (clamped), and
`adjustFastingMadeUp` ticks it within `[0, owed]`. Because owed is recomputed
from the live pause log, deleting or extending a pause re-derives the total
without migration.

**3. A separate domain behind its own port.** It does **not** touch
`haid.ts`, `qada.ts`, or the day-indexed Ramaḍān tracker. It is persisted behind
a `FastingQadaStore` (`read`/`write`) under `ul.fastingQada`, with a
`localStorage` web adapter and an `AsyncStorage` mobile adapter
([0024](0024-local-storage-ports.md), enforced by [0028](0028-persistence-enforcement.md)).
The web glue emits a window event so the tracker page re-renders; the mobile
screen holds it in component state. Both surface a make-up counter next to the
prayer qaḍāʾ tracker ([0030](0030-qada-tracker.md)).

## Consequences

- **Good:** completes #138's deferred fasting item and closes #155. Fully local —
  no backend, accounts, or PII. `ul.fastingQada` rides the key-agnostic backup
  ([0018](0018-local-data-backup.md)) for free, and the port is the seam for sync.
- **Deliberately excluded:** the counter only covers fasts missed to a **ḥayḍ
  pause in Ramaḍān**. Qaḍāʾ from other causes (travel, illness) is not modelled
  here; it can be a later manual-entry addition without changing this port. Like
  the other logs/counters, `ul.fastingQada` is **not** in `MANAGED_KEYS` — it
  awaits the v2 element-level merge ([0033](0033-account-sync.md)).
- **Limit & trigger to revisit:** tabular Hijri can differ from a local sighting
  by ±1 day (mitigated by the shared `hijriAdjust`); revisit if we adopt a
  sighting-based calendar. Per-device until the export bridge (0018) or sync (#25).
