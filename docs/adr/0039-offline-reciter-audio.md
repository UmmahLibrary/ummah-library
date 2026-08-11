# 0039 — Offline reciter audio (downloadable recitation)

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
- **Mobile — `expo-file-system`.** Each ayah downloads to
  `<document dir>/ul-audio/{reciter}/{sura}/{aya}.mp3` (`File.downloadFileAsync`)
  and hands back a `file://` URI. Persistent app-document storage, not the
  OS-reclaimable cache dir `offlineCache.ts` uses for disposable content — a
  download is a deliberate user action, so it survives storage pressure the same
  way a user photo would. Implemented in `apps/mobile/src/audio/audio-store.ts`.

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
  playback via Playwright offline mode). Mobile is implemented — the
  `expo-file-system` adapter, a download button in the surah/juzʾ audio bar, a
  `/Downloads` screen under Tools, and the player preferring a saved file over
  streaming — verified by `tsc`/lint/the adapter's unit test suite; not yet
  exercised on a physical device or simulator (none available in this dev
  environment), so a manual airplane-mode pass is recommended before release.
- **Reuse:** the port + orchestration are shared — the mobile adapter (~80 lines)
  is a thin file-system mirror of the web one, and both call the same
  `downloadSurahAudio`/`isSurahDownloaded` in `core`.
