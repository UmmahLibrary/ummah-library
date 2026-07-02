# 0037 — Offline reciter audio (downloadable recitation)

- **Status:** Accepted
- **Date:** 2026-07-03
- **Issue:** #202

## Context

Reciter audio streams per-ayah from each reciter's `audioUrlTemplate` (everyayah,
ADR 0005); nothing is persisted. The reader caches offline (PWA) so you can
**read** without a connection but not **listen** — a gap versus apps like
Greentech that ship fully downloadable reciters. We want a reader to download a
reciter's recitation of a surah and have it play with no connection.

## Decision

Add an **`AudioStore` port** (`packages/core/src/ports.ts`) keyed by reciter +
ayah, plus a pure download **orchestration** in `core` (`downloadSurahAudio`,
`isSurahDownloaded` in `audio.ts`). The orchestration iterates a surah's ayahs
and delegates every fetch/persist to the injected store — so it stays pure and
unit-tested, and the same logic drives both platforms.

Persistence is a platform adapter behind the port:

- **Web — the Cache API.** Each ayah is fetched once and stored under a synthetic
  same-origin key (`/__audio/{reciter}/{sura}/{aya}`); playback reads it back as a
  **blob object URL**. everyayah sends `Access-Control-Allow-Origin: *`, so the
  cross-origin blob is readable and **no service worker is needed**. Implemented in
  `apps/web/src/lib/audio-store.ts`.
- **Mobile — `expo-file-system`** (follow-up, same issue): download each ayah under
  the app document dir and hand back a `file://` URI. The core port is already
  platform-agnostic and ready for it.

The player prefers a saved copy: before streaming, it asks the store for a local
URL and, when present, plays that and uses the **bundled** word timings (ADR 0036,
offline-safe) — touching no network. Downloads are managed on a `/downloads` page.

No dataset change — audio still originates from the existing reciter URLs; only a
local copy is added.

## Consequences

- **Good:** the app is **listenable offline**, completing the "usable offline"
  promise. Download is idempotent + cancellable (resumable); the manager shows
  size and allows deletion.
- **Cost:** device storage — a full surah of a 128 kbps reciter is a few MB.
  Bounded by the reader downloading explicitly, per surah, and able to delete.
- **Scope of this change:** web is implemented and verified (download → offline
  playback via Playwright offline mode). The **mobile adapter + download UI is the
  remaining follow-up** under this issue; it was deferred here because
  `expo-file-system` can't be installed/verified in the current dev environment.
- **Reuse:** the port + orchestration are shared, so the mobile adapter is a thin
  file-system mirror of the web one.
