# Design-sync notes — @ummahlibrary/ui

## Repo quirks

- **No dist/** — `packages/ui` exports directly from `src/index.ts`. The converter requires `--entry packages/ui/src/index.ts` to avoid looking for a self-link in `node_modules/@ummahlibrary/ui` (which doesn't exist in this monorepo). This is already saved in `config.json` as `"entry": "src/index.ts"`.

- **No Storybook** — `shape: "package"`. All 5 component previews are user-owned in `.design-sync/previews/`. Grades are in `.design-sync/.cache/review/<Name>.grade.json`.

- **CSS vars need a dark host** — Noor components use `var(--noor-*)` inline styles and assume the Obsidian dark background (`#0a0b0f`). All preview wrappers use a dark container. If you author new previews, always wrap in `<div style={{ background: "#0a0b0f", ... }}>`.

- **`cssEntry`** — points to `packages/ui/src/noor-tokens.css`, a standalone `:root { --noor-* }` file extracted from `apps/web/src/app/globals.css`. It was created specifically for this converter (the full globals.css is outside the package boundary). Keep it in sync with the Obsidian theme values in `packages/ui/src/themes.ts`.

- **pnpm monorepo** — React peer dep lives in `packages/ui/node_modules`. Pass `--node-modules packages/ui/node_modules` to all converter commands.

- **Playwright** — installed at `.ds-sync/node_modules/playwright`. Chromium binaries are at `C:/Users/codewithrashid/AppData/Local/ms-playwright`. Set `PLAYWRIGHT_BROWSERS_PATH` before running build/validate.

- **Run from repo root** — all converter commands must be run from `C:\...\ummah-library`, not from `packages/ui`. The preview overrides are in `.design-sync/previews/` relative to the root.

## Re-sync command

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "C:/Users/codewithrashid/AppData/Local/ms-playwright"
node .ds-sync/package-build.mjs --pkg packages/ui --entry packages/ui/src/index.ts --config .design-sync/config.json --out ds-bundle --node-modules packages/ui/node_modules
node .ds-sync/package-validate.mjs ds-bundle
```

## Known warnings (resolved)

- `[GRID_OVERFLOW]` on Btn and Khatam — fixed with `"cardMode": "column"` in `config.json` overrides.

## Re-sync risks

- Adding a new component to `packages/ui/src/` and `src/index.ts` → add a preview in `.design-sync/previews/<Name>.tsx` and grade it before re-syncing.
- Changing Obsidian token values in `themes.ts` → update `src/noor-tokens.css` to match and rebuild.
- Changing the `Btn`/`Seg`/`Icon`/`Khatam`/`Logo` prop API → update the preview file to match the new API before rebuilding.
