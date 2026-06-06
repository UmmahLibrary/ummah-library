# ADR 0007 — Hifz scheduling: SM-2 in core behind a port

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

Hifz (memorization) needs a spaced-repetition scheduler. It must run identically
on web, mobile, and any server; be **deterministic and fully testable**; and not
drag a storage choice into the scheduling logic.

## Decision

- The scheduler is a **pure SM-2 implementation in `packages/core`**
  (`hifz.ts`): `createCard`, `review`/`reviewByRating`, `isDue`. **The clock is
  always injected** (every function takes `now`), so it is deterministic and unit
  tested across interval progression, lapses, and the EF ≥ 1.3 floor — no I/O.
- **Persistence is a separate concern** behind the `HifzRepository` port. Adapters
  implement it: in-memory (reference/tests), `localStorage` (web, 0006), and
  `node:sqlite` (durable reference).

## Consequences

- The algorithm is reusable everywhere and trivially testable.
- The storage backend is swappable without touching scheduling.
- Choosing a different algorithm later (e.g. FSRS) is a `core` change behind the
  same surface; the rest of the app is unaffected.
