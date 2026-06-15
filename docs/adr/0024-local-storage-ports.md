# ADR 0024 — Typed storage ports for local-first state

- **Status:** Accepted
- **Date:** 2026-06-15

## Context

Local-first state (ADR 0006) — reading plans, goals/streaks, bookmarks, notes,
tasbih, the prayer tracker — is read and written by touching `localStorage`
(web) or `AsyncStorage` (mobile) **directly** in each app's glue. The pure logic
lives in `core`, but the persistence boundary is implicit and duplicated per
platform.

Cross-device **sync** is now on the roadmap (Phase 4, #25). It will add a
backend implementation of persistence, and we don't want to rewrite every
feature's reads and writes when it lands. Hifz already anticipates this: its
state sits behind `HifzRepository` (ADR 0007), so a SQLite/Postgres adapter can
replace the local one without touching the SM-2 logic or the UI. The local-data
backup (ADR 0018) is the manual substitute today and is deliberately
key-agnostic.

## Decision

**Persist each local-first feature behind its own typed port in `core`** — the
same shape as `HifzRepository`: a `PlanStore` (`read`/`write`/`clear`), then a
`ReadingGoalsStore`, a `BookmarksStore`, and so on. Each port has a **web
adapter** (`localStorage`) and a **mobile adapter** (`AsyncStorage`) in the app
layer; feature glue and UI depend only on the port. Values stay under the same
`ul.*` keys, so the backup (ADR 0018) keeps working unchanged.

We chose **typed per-feature ports over a single generic key-value store**: it
matches the `HifzRepository` precedent, gives each feature an explicit,
type-checked contract (no string keys or `JSON.parse` casts at the call sites),
and reads clearly. When sync lands (#25), the per-platform adapters will share
**one** synced engine underneath, so there is a single sync seam without a
bespoke sync implementation per feature.

This is the **seam** for #25: swapping local persistence for synced persistence
becomes "provide a different adapter," with zero changes to feature logic or UI.

## Consequences

- **Good:** every feature's persistence is explicit, typed and swappable; the
  future sync work (#25) is an adapter, not a rewrite; tests inject an in-memory
  fake instead of stubbing `localStorage`; web and mobile share one contract
  instead of two drifting glue files.
- **Cost:** more surface than direct storage — one port plus two small adapters
  per feature. Mitigated by keeping adapters tiny and migrating one feature per
  PR (#73 tracks the rollout; #61 — reading plans — is the first).
- **Async reads:** the ports return `Promise`s (web `localStorage` is sync, but
  the contract is uniform), so a couple of web call sites that read
  synchronously today become `await`/`.then` — already the norm on mobile.
- **Backup unchanged:** values still live under `ul.*` and the backup stays
  key-agnostic (ADR 0018); a port does not impose a per-key schema.
- **Scope:** this records the *pattern*; the actual sync backend (accounts,
  server, conflict resolution) remains the Phase 4 decision in #25.
