# ADR 0023 — Noor design system: single source of truth across web and mobile

- **Status:** Accepted
- **Date:** 2026-06-14
- **Supersedes:** partial guidance in ADR 0009 (mobile app)

## Context

The web app shipped the Noor design system — a complete palette, token set, and
primitive component library (`Btn`, `Seg`, `Icon`, `Khatam`, `Logo`) — directly
inside `apps/web/src/components/noor/`.  The mobile app carried its own separate
`Palette` type and colour constants in `apps/mobile/src/theme.tsx`.  The two
were inconsistent (different accent colours, missing tokens), had no shared
contract, and would diverge further with every feature.

The goal is **one canonical design language** that both apps consume, with the
web as the reference implementation.

## Decision

### 1 — `packages/ui` is the canonical design system

All design tokens, component primitives, and theme types live in `packages/ui`.
Neither `apps/web` nor `apps/mobile` may define their own palette colours or
reimplement a component that already exists in `packages/ui`.

### 2 — JS colour values in `packages/ui/src/themes.ts`

All eight Noor theme palettes (`obsidian`, `midnight`, `emerald`, `ocean`,
`ivory`, `sepia`, `mint`, `rose`) are defined as resolved hex/rgba values in
`packages/ui/src/themes.ts`, exporting a `Palette` interface and a `noorThemes`
record.  The CSS custom properties in `apps/web/src/app/globals.css` remain the
delivery mechanism for the web but are derived from (and must stay in sync with)
these JS values.

### 3 — Platform files for components

Each component uses the **platform file pattern** supported by Metro (React
Native) and Next.js/webpack:

```
packages/ui/src/
  Btn.tsx          ← web: <button> + CSS variables via N tokens
  Btn.native.tsx   ← mobile: <Pressable> + JS tokens via useNoorTheme()
  Seg.tsx / Seg.native.tsx
  Icon.tsx / Icon.native.tsx   (web: inline SVG, mobile: react-native-svg)
  Khatam.tsx / Khatam.native.tsx
  Logo.tsx / Logo.native.tsx
```

Metro automatically resolves `.native.tsx` over `.tsx` for React Native builds.
Next.js uses `.tsx`.  No conditional imports, no `Platform.OS` guards inside
`packages/ui`.

### 4 — `NoorThemeProvider` for native colour resolution

Web components consume colours through CSS variables — no runtime context
needed.  Native components call `useNoorTheme()` (React context provided by
`NoorThemeProvider` from `packages/ui`).

`apps/mobile/src/theme.tsx` owns the platform-specific concern (OS colour-scheme
detection via `Appearance`, AsyncStorage persistence) and wraps its children
with `NoorThemeProvider`, passing the resolved `Palette` object from
`noorThemes`.  It re-exports the `Palette` type so mobile screens that already
import from `../theme` continue to compile unchanged.

### 5 — `react-native-svg` for SVG components on mobile

`Icon.native.tsx` and `Khatam.native.tsx` use `react-native-svg` (Expo SDK 54
compatible, `~15.10.x`).  It is listed as an optional peer dependency of
`packages/ui` and a direct dependency of `apps/mobile`.

### 6 — Native files excluded from `packages/ui` web typecheck

`packages/ui/tsconfig.json` excludes `**/*.native.tsx`.  Native files are
type-checked indirectly: Metro validates them at bundle time, and the mobile's
TypeScript project validates callers against the exported (web) types from
`src/index.ts`.  The prop interfaces are kept compatible across both files.

## Consequences

- **Single source of truth:** adding a new theme means one row in `themes.ts`
  plus one `[data-theme]` block in `globals.css` — both apps update
  automatically.
- **No platform forks:** the mobile app no longer defines its own colour
  constants.  Any drift is a lint/type error.
- **Native SVG dependency:** `react-native-svg` is a native module that requires
  Expo's build system (EAS or `expo prebuild`).  It cannot run in plain Node
  tests; test files that import `Icon` or `Khatam` must mock `react-native-svg`.
- **Type discipline:** `.native.tsx` prop interfaces must remain compatible with
  the exported `.tsx` interface — callers may not use event-specific types that
  don't exist on both platforms.
- **CSS vars and JS values stay in sync manually:** there is no build step to
  generate `globals.css` from `themes.ts`.  When a colour changes, update both.
  A future ADR may introduce code-generation if drift becomes a problem.
