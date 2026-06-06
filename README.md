# Ummah Library

[![CI](https://github.com/UmmahLibrary/ummah-library/actions/workflows/ci.yml/badge.svg)](https://github.com/UmmahLibrary/ummah-library/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Live app](https://img.shields.io/badge/live-app.ummahlibrary.org-1f9d55.svg)](https://app.ummahlibrary.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-7057ff.svg)](CONTRIBUTING.md)
[![good first issues](https://img.shields.io/github/issues/UmmahLibrary/ummah-library/good%20first%20issue?label=good%20first%20issues&color=7057ff)](https://github.com/UmmahLibrary/ummah-library/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

An **open-source Quran platform and Islamic knowledge ecosystem** — a Quran
reader first, growing into Hifz, Tafsir, Hadith, and more, all under one roof.

> **New here?** This is a community **Sadaqah Jariyah** and contributions are
> welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and pick up a
> [good first issue](https://github.com/UmmahLibrary/ummah-library/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Built as a community **Sadaqah Jariyah** (ongoing charity): freely usable,
freely improvable, and owned by no one. Licensed under **AGPL-3.0** so it stays
open for everyone who comes after.

### 🕮 Read it now: **[app.ummahlibrary.org](https://app.ummahlibrary.org)**

Read the full Quran (Uthmani Arabic) with translations in **dozens of
languages**, installable as an app, and **fully readable offline**.

## Features

- **All 114 surahs** in Uthmani Arabic (Tanzil, CC-BY 3.0), with the Amiri font and proper RTL.
- **Three reading surfaces** — verse-by-verse, continuous reading, and a **Madani Mushaf page view** (all 604 pages).
- **A runtime catalogue of ~490 translations across ~98 languages** ([ADR 0011](docs/adr/0011-translation-catalog-runtime.md)) — grouped, searchable, toggle any combination; 6 are bundled for offline + the REST API. Urdu locales default to an Urdu translation.
- **Multiple Tafsirs** (Ibn Kathir, Muyassar, Tabari, Maarif-ul-Quran …) fetched on demand.
- **Full-text search** across the Arabic and English — instant, client-side ([`/search`](https://app.ummahlibrary.org/search)) — plus **Hadith search**.
- **Recitation audio** with multiple reciters, surah **loop/repeat**, and word-by-word highlighting; tap any word for a **word-by-word gloss**.
- **Hadith** — 6 collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Ibn Majah, Nasa'i), book by book.
- **Hifz** spaced-repetition review (SM-2) with a due-count badge.
- **Bookmarks, continue-reading, scroll memory & keyboard shortcuts** (`j`/`k`/`Space`), stored locally — no account needed.
- **Installable PWA** with offline reading — opened surahs stay available without a connection.
- **Public API** — REST + OpenAPI and a typed tRPC router (see [docs/API.md](docs/API.md)).
- **Dark, fast, static** — every surah, juzʾ and Mushaf page is prerendered.

## Architecture

A single TypeScript monorepo (Turborepo + pnpm), structured as a modular
monolith with strict, **lint-enforced** module boundaries:

```
apps/
  web/        Next.js reader + public API (live)
  mobile/     Expo app shell (Phase 3)
packages/
  core/       Pure domain — Quran model, structure utils, ports. No framework, no DB.
  data/       Ingested Quran datasets + adapters that serve them through core ports.
  api/         Application layer — repositories + tRPC router (REST mirror lives in apps/web).
  adapters/   Concrete adapters for external concerns (DB, AI, audio, storage).
  ui/         Shared, framework-light UI primitives.
```

**The one rule that protects everything:** dependencies point inward.
`apps → packages` is allowed; `packages → apps` is forbidden; **`core` depends
on nothing**. Enforced by `eslint-plugin-boundaries` in CI.

**Before contributing**, read [`ARCHITECTURE.md`](ARCHITECTURE.md) (the map +
data-flow diagrams), [`AGENTS.md`](AGENTS.md) (where things go + the do/don't
rules, for humans and AI agents), and the
[Architecture Decision Records](docs/adr/) (the _why_ behind each decision).

## Quick start

Requires **Node ≥ 20** and **pnpm** (via Corepack: `corepack enable`).

```bash
pnpm install      # install the workspace
pnpm dev          # run the dev server (http://localhost:3000)
pnpm lint         # eslint + module-boundary checks
pnpm typecheck    # tsc across every package
pnpm test         # vitest (core, data, adapters)
pnpm build        # production build
```

Regenerate the Quran datasets from source: `pnpm --filter @ummahlibrary/data ingest`.

### Mobile (Expo)

```bash
pnpm --filter @ummahlibrary/mobile dev   # then open in Expo Go (scan the QR)
```

The mobile app shares `@ummahlibrary/core` and reads from the public API. Build
for the Play Store with EAS (profiles in `apps/mobile/eas.json`):

```bash
cd apps/mobile && eas login && eas init        # one-time, links your Expo project
eas build --platform android --profile preview # internal APK
```

## Public API

Base URL: `https://app.ummahlibrary.org/api`. Full reference in
[docs/API.md](docs/API.md).

```bash
curl https://app.ummahlibrary.org/api/v1/surahs
curl https://app.ummahlibrary.org/api/v1/surahs/2
curl https://app.ummahlibrary.org/api/v1/surahs/2/translations/eng-khattab
```

## Tech

Next.js · Expo (Phase 3) · tRPC · REST/OpenAPI · Tanzil Quran data ·
`fawazahmed0/quran-api` translations.

## Contributing

Newcomers very welcome — start with [`CONTRIBUTING.md`](CONTRIBUTING.md) and the
[`good first issue`](https://github.com/UmmahLibrary/ummah-library/labels/good%20first%20issue)
label. Module boundaries are enforced automatically, so the structure guides you.
Islamic content is scholar-reviewed before release.

## License

[AGPL-3.0-only](LICENSE). Quran text and translations carry their own source
attributions (e.g. Tanzil CC-BY 3.0) which travel with the data — see
[`packages/data/ATTRIBUTION.md`](packages/data/ATTRIBUTION.md).
