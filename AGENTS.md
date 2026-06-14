# AGENTS.md — working in this repo

Guidance for AI coding agents **and** human contributors. The goal: extend the
project **without polluting its architecture**. Read
[`ARCHITECTURE.md`](ARCHITECTURE.md) and the [ADRs](docs/adr/) first; this file is
the operational checklist.

## Non-negotiable rules (CI enforces #1–#2)

1. **Dependencies point inward.** `apps → packages`; `packages` never import
   `apps`; **`core` imports nothing** (no other workspace package, no framework,
   no DB, no Node built-ins, no network). `eslint-plugin-boundaries` fails the
   build on violations — **do not disable or loosen it to get around a
   violation**; restructure instead.
2. **Everything external lives behind a port.** A database, an HTTP content
   source, audio, AI — define the **interface in `core/src/ports.ts`** and put the
   **implementation in `adapters` (or `data`)**. Apps/`api` depend on the
   interface, never on a concrete vendor.
3. **`core` is pure and deterministic.** No I/O, no framework, no `Date.now()`
   inside logic — **inject the clock** (see `hifz.ts`). Everything in `core` is
   unit-tested.
4. **Never hand-edit `packages/data/datasets/`.** It is generated. Change
   `packages/data/scripts/ingest.ts` and re-run the ingest. Attribution travels
   with the data.
5. **Static unless it can't be.** Prefer build-time generation (`generateStaticParams`,
   `force-static`). A runtime serverless function is the exception; if it reads
   the datasets, add it to `outputFileTracingIncludes` in `apps/web/next.config.mjs`.
6. **An architectural change ships its ADR.** Adding a database, accounts, a new
   allowed dependency edge, a new content delivery mode, etc. — add or supersede
   an ADR in the same change.

## Where does it go?

| You're adding…                                   | Put it in                                                    |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Domain type / pure logic / structural invariant  | `packages/core`                                              |
| A new capability boundary (an interface)         | `packages/core/src/ports.ts`                                 |
| Quran text/structure handling, ingestion         | `packages/data`                                              |
| An adapter for something external (DB, HTTP, AI) | `packages/adapters` (implements a core port)                 |
| Wiring repositories / a tRPC procedure / REST    | `packages/api` (router) or `apps/web/src/app/api`            |
| Web UI                                           | `apps/web`                                                   |
| Mobile UI                                        | `apps/mobile`                                                |
| Shared, framework-light UI                       | `packages/ui`                                                |
| **Design token / colour / Noor primitive**        | `packages/ui/src/` — _never in apps_                        |
| **A translation / reciter / tafsir / hadith**    | a **JSON manifest** in `packages/data/plugins/` — _not code_ |

If an app needs data, it goes through **`api`**, not `data`/`adapters` directly.

## Don't

- ❌ Import a framework, DB driver, or Node built-in into `core`.
- ❌ Make a `packages/*` import from `apps/*`.
- ❌ Disable the boundaries lint rule (or add a blanket `eslint-disable`) to silence a violation.
- ❌ Hand-edit generated `datasets/`.
- ❌ Bundle large content (full tafsir/hadith) — add a runtime plugin instead.
- ❌ Add a database, user accounts, or server-side user data without an ADR (we are local-first — ADR 0006).
- ❌ Reach a vendor SDK directly from `api`/apps — wrap it in an adapter behind a port.
- ❌ Define palette colours, design tokens, or Noor component primitives inside an app — they live in `packages/ui` only (ADR 0023).
- ❌ Add `Platform.OS` guards or conditional imports inside `packages/ui` — use platform files (`.native.tsx`) instead.

## Noor design system (`packages/ui`) — ADR 0023

`packages/ui` is the **single source of truth** for all visual design across web
and mobile. The web app is the reference implementation; the mobile app must
follow it.

**What lives here:**

- `src/themes.ts` — all eight Noor palettes as JS objects (`Palette` interface +
  `noorThemes` record). The CSS custom properties in `apps/web/src/app/globals.css`
  must stay in sync with these values.
- `src/tokens.ts` — `N.*` CSS variable strings for web inline styles.
- `src/NoorThemeContext.tsx` — `NoorThemeProvider` + `useNoorTheme()` for native.
- `src/Btn.tsx` / `src/Btn.native.tsx` (and Seg, Icon, Khatam, Logo) — shared
  component primitives.

**Platform files pattern:**

Metro (React Native) auto-resolves `Foo.native.tsx` over `Foo.tsx`. Next.js
uses `Foo.tsx`. Never use `Platform.OS` checks or conditional imports inside
`packages/ui` — write two files.

```
packages/ui/src/
  Btn.tsx           ← web: <button> + CSS variables
  Btn.native.tsx    ← mobile: <Pressable> + useNoorTheme()
```

**`*.native.tsx` type-checking:**

`packages/ui/tsconfig.json` excludes `*.native.tsx`. Native files are
validated by Metro at bundle time. Keep the props interface compatible across
both files — callers use the exported web type.

**Adding a new theme:** add one row to `themes.ts` + one `[data-theme]` block
in `globals.css`. Both apps update automatically.

**Adding a new component:** add `Foo.tsx` (web) and `Foo.native.tsx` (mobile)
to `packages/ui/src/`, export both from `src/index.ts`, add tests.

## Commands

```bash
corepack enable && pnpm install
pnpm dev          # web dev server (http://localhost:3000)
pnpm lint         # eslint + module-boundary checks
pnpm typecheck    # tsc across every package
pnpm test         # vitest (core, data, adapters)
pnpm build        # production build
pnpm format       # prettier --write

pnpm --filter @ummahlibrary/data ingest     # regenerate the datasets
pnpm --filter @ummahlibrary/mobile dev      # Expo (open in Expo Go)
```

**Before any commit, all four must pass:** `pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm build`. CI runs them on every PR; `main` is protected.

## Conventions

- TypeScript **strict**, ESM, `type`-only imports where possible (lint enforces).
- Repositories return `Promise`s even when synchronous (the ports are async).
- Conventional Commits (`feat(core): …`, `fix(web): …`, `docs(adr): …`).
- Islamic content is **scholar-reviewed** before release; tag such PRs
  `needs-scholar-review`.
- License: **AGPL-3.0-only**. Keep source attributions with any data.
