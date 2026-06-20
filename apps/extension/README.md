# @ummahlibrary/extension

The Ummah Library **browser extension** (Manifest V3, Chrome + Firefox). A thin
client over the public REST API — see [ADR 0026](../../docs/adr/0026-browser-extension.md).

The popup shows:

- **Verse of the day** — deterministic per date (`core.verseOfDay`), Arabic +
  translation, deep-linking into the web reader at the exact āyah.
- **Today's Hijri date** — `core.hijri`, offline.
- **Quick sūra jump** — fetches and caches the sūra list, filters by name/number,
  opens the web reader.
- **Translation edition** — chosen from `/api/v1/editions`, remembered.
- **Themes** — all eight Noor palettes via a swatch picker (the generated
  `@ummahlibrary/ui/noor-themes.css`, ADR 0027); the choice syncs across the
  browser profile via `chrome.storage.sync`.

It reuses `@ummahlibrary/core` (logic) and `@ummahlibrary/ui` (the Noor look). It
needs **no backend**: content comes from the live API (`https://ummahlibrary.org`,
open CORS), and state stays on the device — prefs in `chrome.storage.sync` (synced
by the browser across the user's profile, no server we run), caches in
`chrome.storage.local`, falling back to `localStorage`. There are **no accounts**
and no dependency on the sync epic (#25).

## Develop

```bash
pnpm --filter @ummahlibrary/extension dev        # Vite dev server (popup as a page)
pnpm --filter @ummahlibrary/extension build      # → dist/ (the unpacked extension)
pnpm --filter @ummahlibrary/extension test       # vitest
pnpm --filter @ummahlibrary/extension typecheck
pnpm --filter @ummahlibrary/extension icons      # regenerate PNG icons from the shared SVG
```

## Load it unpacked

1. `pnpm --filter @ummahlibrary/extension build`
2. **Chrome:** `chrome://extensions` → enable *Developer mode* → *Load unpacked* →
   pick `apps/extension/dist`.
   **Firefox:** `about:debugging#/runtime/this-firefox` → *Load Temporary
   Add-on* → pick `apps/extension/dist/manifest.json`.
3. Click the toolbar icon to open the popup.

Permissions requested: `storage` only. No host permissions — the API is reached
via open CORS.
