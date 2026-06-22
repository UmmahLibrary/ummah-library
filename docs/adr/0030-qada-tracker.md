# ADR 0030 — Qaḍāʾ (missed-prayer) tracker behind a store port

- **Status:** Accepted
- **Date:** 2026-06-21

## Context

The prayer tracker ([0020](0020-prayer-tracker.md)) logs whether you prayed each
of the five daily prayers **today** (on time or late) and computes streaks over
that dated log. It does not model the other half of the habit: the **backlog of
missed prayers you owe and make up over time** (qaḍāʾ). Tracking and burning down
that backlog is a common feature in competitor apps (Pillars, Al-Azan, Namaz
Vakti) and the first item picked from the Phase 8 competitive set (#137).

This is purely the user's own habit data — like the prayer log and reading goals
([0006](0006-local-first-persistence.md)) — with no external system involved.

## Decision

**1. The maths is pure `core`.** `core/qada.ts` holds the backlog shape
(`QadaLog` = prayer → non-negative count) and immutable, deterministic helpers:
`owedFor`, `totalOwed`, `setQada`, `adjustQada`, and the `recordMissed` / `makeUp`
shorthands. Counts are clamped to non-negative integers (corrupt or fractional
stored values are coerced), and a zero count drops the entry so the log stays
sparse. Everything is unit-tested. It covers the **five obligatory prayers**;
Witr and other prayers are deferred until asked for.

**2. A separate domain from the daily log.** Qaḍāʾ is a running *balance*, not
dated entries, so it lives in its own module and **does not touch the streak
math** in `prayer-tracker.ts` — adding it cannot regress the existing tracker.
The daily log and the backlog are intentionally not auto-linked: a prayer marked
missed today does not silently increment the backlog (that would double-count and
surprise users); the user adds to the backlog explicitly.

**3. Persistence is behind a port from day one.** Unlike 0020 (which began
port-less and pre-dated the pattern), the backlog sits behind a `QadaStore`
(`read`/`write`) under the `ul.qada` key, with a `localStorage` web adapter and
an `AsyncStorage` mobile adapter — the now-standard typed-storage-port pattern
([0024](0024-local-storage-ports.md)), which the lint enforces app-wide
([0028](0028-persistence-enforcement.md)). The web feature glue emits a window
event so the tracker page re-renders on change, mirroring the prayer tracker.

## Consequences

- **Good:** a useful make-up tracker that stays **100% local** — no backend, no
  accounts, no PII. The maths is shared, testable `core`; web and mobile render
  the same numbers off the same helpers and ship together. The `ul.qada` key is
  picked up by the key-agnostic backup ([0018](0018-local-data-backup.md)) with
  no extra work, and the port is the seam for sync (#25) when it lands.
- **Scope:** five obligatory prayers only; no automatic coupling to the daily
  log; no reminders to make up qaḍāʾ (a possible later addition).
- **Limit & trigger to revisit:** the backlog is per-device like all local-first
  data — the export/import bridge (0018) covers it until accounts/sync (#25).
