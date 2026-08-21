# Manual E2E QA — Round 1 (2026-08-21)

This is the first round under the repeatable QA loop, continuing on from two prior
ad-hoc passes ([`WEB_QA_REPORT.md`](../../WEB_QA_REPORT.md), [`WEB_QA_LIVE_BROWSER_REPORT.md`](../../WEB_QA_LIVE_BROWSER_REPORT.md))
whose combined 10 findings are already fixed and shipped (commits `5820d26`…`9341e3d`
on this branch). This round covered areas neither prior pass exercised deeply:
**offline audio downloads** (`/downloads`), **collections/notes** (`/collections`,
`/bookmarks`), **Duʿās**, and **Settings → Sync + backup**.

## Findings

### 1. Dev-mode service-worker cleanup wiped the unrelated offline-audio-downloads cache — FIXED

- **Where:** [apps/web/src/components/ServiceWorkerRegister.tsx](../../apps/web/src/components/ServiceWorkerRegister.tsx)
- **Symptom:** Downloaded a surah's audio for offline listening (`/surah/112` →
  "Download for offline listening" → completes → "Saved for offline listening").
  Navigated to another page and back — the download was gone; `/downloads` reported
  "Nothing downloaded yet" even though the ayah cache had genuinely finished. Reproduced
  repeatedly and deterministically: **any** full page navigation in the dev server wiped
  every offline audio download, whether complete or mid-download.
- **Root cause:** in dev mode, `ServiceWorkerRegister` unregisters any service worker
  and — per its own comment — "drop[s] its caches so dev always serves fresh" by
  running `caches.keys().then(keys => keys.forEach(k => caches.delete(k)))`. `caches.keys()`
  returns **every** Cache Storage bucket for the origin, not just the service worker's
  own (`ul-static-*`/`ul-pages-*` from `apps/web/public/sw.js`). This indiscriminately
  deleted `ul-audio-v1` too — the completely unrelated bucket
  [`apps/web/src/lib/audio-store.ts`](../../apps/web/src/lib/audio-store.ts) uses for
  the offline-downloads feature — on every mount of the root layout, i.e. every full
  navigation.
- **Fix:** scope the dev-mode cleanup to the caches the service worker actually owns
  (`ul-static-` / `ul-pages-` prefixes), leaving `ul-audio-*` and any other Cache API
  consumer untouched.
- **Verification:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (408/408), `pnpm build`
  all clean. Live re-check: downloaded a surah, did five full navigations in a row
  (home → settings → downloads → surah → downloads), confirmed the download survived
  every one and the delete button still worked correctly.
- **Regression test:** [apps/web/src/components/ServiceWorkerRegister.test.tsx](../../apps/web/src/components/ServiceWorkerRegister.test.tsx) —
  stubs `caches`/`navigator.serviceWorker`, renders the component, and asserts the
  dev-mode cleanup deletes `ul-static-v1`/`ul-pages-v1` but never `ul-audio-v1`.
  Confirmed it fails on the pre-fix code (deletes all three) and passes after.

## Investigated, no bug found

- **Downloads — resume behavior:** interrupting a large surah's download mid-way
  (navigating off `/surah/2` at 48/286 āyāt) and re-downloading correctly resumed from
  the gap rather than restarting — `downloadSurahAudio`'s per-ayah idempotency
  (`packages/core/src/audio.ts`) works as designed.
- **Collections/Bookmarks:** create a named collection, add a note, rename the
  collection, remove an ayah, delete an empty collection — all persisted correctly
  across reloads. The apparent "collection named `1`" in a page-text dump was just an
  adjacent item-count badge, not the name; confirmed via the DOM the input held the
  typed name correctly. "Delete collection" and "Turn off sync" both appeared to no-op
  on click — both are correctly gated behind a native `window.confirm()`, which this
  session's browser automation auto-dismisses; not an app bug.
- **Settings → Sync:** generated a recovery phrase, turned sync on, ran "Sync now" —
  hits the app's own same-origin `/api/sync` (no third-party relay), reports "Up to
  date" with no errors.
- **A misleading self-inflicted false alarm, noted for the record:** running
  `pnpm build` while the dev server (`pnpm dev`, same `.next` directory) was live
  corrupted the dev server's webpack output (`Cannot find module './7303.js'`),
  producing 500s and a blank `/downloads` page that looked like a second bug. This was
  purely from running a production build against the same `.next` output the dev
  server was using concurrently — not reproducible from a clean `pnpm dev` alone.
  Resolved by deleting `apps/web/.next` and restarting the dev server; not run
  concurrently with the dev server again for the rest of this round.

## Verification

- `pnpm lint` — 0 errors (12 pre-existing warnings, unrelated to this round).
- `pnpm typecheck` — clean across all packages.
- `pnpm test` — 408/408 passed (92 files), including the new regression test.
- `pnpm build` — clean production build.
- Live re-verification in the browser dev server for both the fix and the "no bug
  found" items above.

## Verdict

One real, reproducible bug found and fixed this round (the dev-mode cache wipe
destroying offline audio downloads), with a regression test locking it in. Continuing
to round 2.
