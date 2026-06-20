# ADR 0027 — Theme CSS is generated from a single token source

- **Status:** Accepted
- **Date:** 2026-06-20
- **Amends:** [ADR 0023](0023-noor-design-system.md)

## Context

ADR 0023 made `packages/ui` the single source of truth for Noor design and named
`themes.ts` (the `noorThemes` palette objects) the authoritative values. In
practice it wasn't single-source: the web kept a **hand-maintained copy** of
every palette as `[data-theme]` blocks in `apps/web/src/app/globals.css`, and ADR
0023 instructed contributors to keep the two "in sync" by hand.

Two problems followed. First, manual sync is a standing hazard — nothing stops
the CSS drifting from `themes.ts`. Second, it had **already drifted**: the CSS
exposed tokens the `Palette` type didn't have (`--noor-bg2`, `--noor-card-hi`,
`--noor-gold-dim`, per-theme `color-scheme`), so neither file was truly the
source. Adding a third client (the browser extension, #116) that also needs the
palette as CSS made hand-maintaining a per-app copy untenable.

## Decision

**One source, generated outputs — the same discipline as `datasets/` (rule #4).**

- **`packages/ui/src/themes.ts` is the only place palette values are authored.**
  `Palette` was extended to hold the complete token set (`bg2`, `cardHi`,
  `accentDim`, `scheme`); `error` stays (native-only, no CSS var).
- **The CSS is generated, never hand-edited.** `theme-css.ts` renders the
  custom-property stylesheets from `noorThemes` via one token-name map (so CSS var
  names and palette keys can't diverge). `scripts/build-theme-css.ts`
  (`pnpm --filter @ummahlibrary/ui build:themes`) writes two committed files:
  - `noor-themes.css` — `:root` default + every `[data-theme]` block (and the
    legacy `light` alias) — consumed by the web and the extension.
  - `noor-tokens.css` — obsidian `:root` only — the design-sync entry + a
    standalone fallback.
- **The web stops owning palette CSS.** `apps/web` imports
  `@ummahlibrary/ui/noor-themes.css` in `layout.tsx`; `globals.css` keeps only
  web-only, non-themed tokens (next/font font vars, the field pattern, legacy
  aliases). Mobile is unchanged — it still reads the `noorThemes` JS objects via
  `useNoorTheme()`.
- **Drift fails CI.** `theme-css.test.ts` asserts the committed `.css` equals
  fresh generator output, so a stale checkout breaks the build instead of shipping
  a mismatch.

The split by platform is *delivery*, not *source*: DOM hosts (web, extension) get
CSS custom properties (so theming applies before paint, statically); React Native
reads the JS objects. Both derive from `themes.ts`.

## Consequences

- **Good:** genuinely one source of truth, machine-enforced; adding/altering a
  theme is a `themes.ts` edit + `build:themes`; every client (web, extension,
  native) recolours from the same values; no more "keep globals.css in sync" rule.
- **Cost:** a codegen step and two committed generated files (treated like
  `datasets/` — never hand-edited). Changing a colour now requires re-running the
  generator, which the drift test enforces.
- **No visual change:** the generated values are identical to the previous
  hand-written CSS (verified token-by-token); only their authored location moved.
- **Migration note:** ADR 0023's "add a matching `[data-theme]` block in
  globals.css" instruction is superseded by "edit `themes.ts` and run
  `build:themes`."
