# ADR 0026 — Browser extension: a thin client over the public REST API

- **Status:** Accepted
- **Date:** 2026-06-20

## Context

The browser extension was the last open item of the Phase 6 epic (#27, split out
to #116). We already have a public, read-only REST API (ADR 0004), a pure domain
layer (`core`), and a single design system (Noor, ADR 0023). The question was how
to add a new delivery target — a Chrome/Firefox extension — without standing up
new infrastructure or duplicating logic, and without coupling it to the
not-yet-built accounts/sync work (Phase 4, #25).

A browser extension is just another **app**: a host that renders our UI and reads
our content. It does not need its own backend. The verse-of-the-day selection
(`core.verseOfDay`), the Hijri conversion (`core.hijri`), the ayah anchor format
(`core.ayahKey`) and surah search normalisation (`core.normalizeForSearch`) are
already pure and shared; the content is already served with open CORS
(`access-control-allow-origin: *`), so a cross-origin `fetch` from the popup needs
no host permissions.

## Decision

**Add `apps/extension`: a Manifest V3 extension that is a thin client over the
deployed app.** It follows the project's existing rules rather than inventing new
ones:

- **No backend, no new port.** The popup `fetch`es the live REST API
  (`https://ummahlibrary.org/api/v1`, the apex — the `app.` host 308-redirects
  there, matching the mobile app). It reuses `@ummahlibrary/core` for all logic
  and `@ummahlibrary/ui` for the Noor look (the token CSS is now exposed as the
  `@ummahlibrary/ui/noor-tokens.css` subpath export). Boundaries are unchanged:
  an app may depend on `core`/`ui` (ADR 0001).
- **Local-first, no accounts (ADR 0006).** Small prefs (edition, Hijri
  adjustment) live in `chrome.storage.sync` — synced across the user's signed-in
  browser profile by the vendor, with **no server we operate**; fetched data
  (surah list, editions) is cached in `chrome.storage.local`. Both degrade to
  `localStorage` when `chrome.storage` is absent, so the popup also renders as a
  plain page (used for tests and preview). **This is explicitly independent of
  #25;** cross-app reconciliation (extension ↔ web/mobile) is the only thing that
  would need it, and is deferred.
- **Built with Vite.** `vite build` emits `dist/` (the unpacked extension):
  `index.html` popup with a single external ES module (no inline script, so the
  default MV3 CSP is satisfied), plus the static `public/` payload
  (`manifest.json` + icons rendered from the shared `icon.svg`). Minimal
  permissions: `storage` only.

v1 surfaces four things in the popup: **verse of the day** (deep-links into the
reader at `…/surah/{s}#{s}:{a}`), **today's Hijri date**, a **quick surah jump**,
and a **translation-edition selector**.

## Consequences

- **Good:** a third client with effectively no new code paths to maintain — logic
  and design are reused, content comes from the API that already exists, and there
  is nothing new to operate. The four gates cover it (Vite build, vitest unit +
  popup render smoke; it joins the root `vitest.workspace.ts`).
- **Cost / limits:** the popup needs the network for the daily verse and the
  surah list (the list is cached after first load; both fail soft to an offline
  message). The deployed app is a hard dependency — schema changes to
  `/api/v1` must keep the extension in mind, the same as any API consumer.
- **Theme:** the popup imports the generated `@ummahlibrary/ui/noor-themes.css`
  (ADR 0027) and offers all eight Noor themes via a swatch picker; the choice
  persists in `chrome.storage.sync` (cross-device) with a synchronous
  `localStorage` mirror applied before paint to avoid a flash.
- **Distribution:** store submission (Chrome Web Store / AMO listing, screenshots,
  privacy declarations) is operational follow-up, like the iOS app (#115); the
  build itself is reproducible via `pnpm --filter @ummahlibrary/extension build`.
