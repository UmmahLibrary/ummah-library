# ADR 0006 — Local-first persistence (no accounts)

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

Reading the Quran, bookmarking, and tracking memorization are **personal and
private**. Requiring an account adds friction, a backend, PII to safeguard, and
breaks the offline story (0003). At this stage there is no need for cross-device
sync.

## Decision

**All user state lives on the device** (`localStorage`), with **no accounts and
no login**: bookmarks and continue-reading, Hifz progress, theme, reading mode,
font scale, chosen reciter, and selected translations.

Persistence that the domain cares about (Hifz) is still defined behind a **port**
(`HifzRepository`, 0007). The web uses a `localStorage`-backed store; a durable
**`SqliteHifzRepository`** (Node's built-in `node:sqlite`, exported from the
`@ummahlibrary/adapters/sqlite` subpath so it never reaches a web bundle) is the
**reference adapter** for an optional future server-sync or for the mobile app's
`expo-sqlite`.

## Consequences

- Zero PII, no backend to operate, works fully offline.
- State is **per-device** — no cross-device sync yet. Adding it later means
  implementing the existing port against a server store (the SQLite adapter is the
  template) plus an explicit auth decision; it does not change the app code.
