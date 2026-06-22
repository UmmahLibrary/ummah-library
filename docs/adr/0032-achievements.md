# ADR 0032 — Achievements / badges over existing local data

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

The Profile ("Your journey") view already showed a handful of badges, but the
unlock rules were **hardcoded inline and duplicated** across the web
(`ProfileView.tsx`) and mobile (`ProfileScreen.tsx`) — drift-prone and untested.
Muslim Pro ("Stars & Crescents") and Athan ("Hasanah" points) use a reward layer
to drive habit retention; we have all the signals (hifz, prayer, reading, names,
collections) but no shared, tested feedback layer (#142, Phase 8 / #152).

We are local-first ([0006](0006-local-first-persistence.md)): **leaderboards and
groups are out of scope** — they need accounts and server-stored user data.

## Decision

**1. A pure, declarative engine in `core`.** `core/achievements.ts` defines a
`BadgeStats` snapshot (the local signals), a declarative `BADGES` catalogue where
each badge unlocks when one `metric` meets a `target`, and `evaluateBadges` /
`unlockedIds` / `newlyUnlocked` over it. The set is **extended by adding a row**,
not by writing logic, and the whole thing is unit-tested. Stat values are coerced
to non-negative, so corrupt storage can't mis-award.

**2. Badges are derived, not stored.** They are recomputed from existing local
data on every view — there is no badge state to keep in sync. The **only** thing
persisted is which badges have been *acknowledged* (shown via the unlock toast),
behind a new `AchievementsStore` (`read`/`write`) under `ul.badges`
([0024](0024-local-storage-ports.md)/[0028](0028-persistence-enforcement.md)),
with a `localStorage` web adapter and an `AsyncStorage` mobile adapter. Picked up
by the key-agnostic backup ([0018](0018-local-data-backup.md)) for free.

**3. Both apps render from the one engine.** Web and mobile Profile views replace
their inline arrays with `evaluateBadges`, show an "N/total" count, and surface a
lightweight **in-app toast** for newly-unlocked badges (no OS `Notifier`
dependency — purely local feedback).

## Consequences

- **Good:** one tested source of truth for the badge set; no duplication or
  drift; trivially extensible; 100% local. New trackers (qaḍāʾ, ḥayḍ streaks,
  etc.) can feed `BadgeStats` and earn badges without touching the engine.
- **Scope:** the toast is in-app only (fires when the Profile view loads), not a
  push notification — honest for a no-backend app and avoids the `Notifier`
  surface. Leaderboards remain out of scope (accounts/server).
- **Limit & trigger to revisit:** acknowledged ids are per-device like all
  local-first data until the export/import bridge (0018) or sync (#25). If badges
  ever need richer rules than a single metric ≥ target, extend `Badge` (e.g. a
  predicate) — the call sites already go through `evaluateBadges`.
