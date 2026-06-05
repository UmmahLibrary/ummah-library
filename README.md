# Ummah Library

An **open-source Quran platform and Islamic knowledge ecosystem** — a Quran
reader first, growing into Hifz, Tafsir, Hadith, and more, all under one roof.

Built as a community **Sadaqah Jariyah** (ongoing charity): freely usable,
freely improvable, and owned by no one. Licensed under **AGPL-3.0** so it stays
open for everyone who comes after.

> **Status: Phase 0 — Foundation.** This is the skeleton everything hangs on: a
> boundary-enforced monorepo that builds, lints, types, tests, and deploys a
> hello-world. No Quran features yet.

## Architecture

A single TypeScript monorepo (Turborepo + pnpm), structured as a modular
monolith with strict module boundaries:

```
apps/
  web/        Next.js reader (hello-world for now)
  mobile/     Expo app shell (hello-world for now)
packages/
  core/       Pure domain core — Quran model, structure utils, ports. No framework, no DB.
  data/       Versioned Quran data + the adapter that serves it through core ports.
  adapters/   Concrete adapters for external concerns (DB, AI, audio, storage).
  api/        Application layer (→ tRPC + REST/OpenAPI in Phase 2).
  ui/         Shared, framework-light UI primitives.
```

**The one rule that protects everything:** dependencies point inward.
`apps → packages` is allowed; `packages → apps` is forbidden; **`core` depends
on nothing**. See [`docs/adr/0001-modular-monolith.md`](docs/adr/0001-modular-monolith.md).

## Quick start

Requires **Node ≥ 20** and **pnpm** (via Corepack: `corepack enable`).

```bash
pnpm install      # install the workspace
pnpm dev          # run the web + mobile dev servers
pnpm lint         # eslint across the repo
pnpm typecheck    # tsc across every package
pnpm test         # vitest (core)
pnpm build        # production build of apps/web
```

The web app runs at <http://localhost:3000>.

## Tech

Next.js · Expo · tRPC (internal) · REST/OpenAPI (public) · Drizzle · SQLite /
PostgreSQL · Tanzil Quran data.

## License

[AGPL-3.0-only](LICENSE). Quran text and translations carry their own source
attributions (e.g. Tanzil CC-BY 3.0) which travel with the data — see Phase 1.

## Contributing

Newcomers welcome — start with [`CONTRIBUTING.md`](CONTRIBUTING.md) and the
`good first issue` label. Islamic content is scholar-reviewed before release.
