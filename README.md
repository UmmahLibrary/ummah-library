# Ummah Library

An **open-source Quran platform and Islamic knowledge ecosystem** — a Quran
reader first, growing into Hifz, Tafsir, Hadith, and more, all under one roof.

Built as a community **Sadaqah Jariyah** (ongoing charity): freely usable,
freely improvable, and owned by no one. Licensed under **AGPL-3.0** so it stays
open for everyone who comes after.

### 🕮 Read it now: **[app.ummahlibrary.org](https://app.ummahlibrary.org)**

Read the full Quran (Uthmani Arabic) with translations in **4 languages**,
installable as an app, and **fully readable offline**.

## Features

- **All 114 surahs** in Uthmani Arabic (Tanzil, CC-BY 3.0), with the Amiri font and proper RTL.
- **6 translations across 4 languages** — English (The Clear Quran), Urdu ×4, Bengali — toggle any combination.
- **Bookmarks & continue-reading**, stored locally (no account needed).
- **Installable PWA** with offline reading — opened surahs stay available without a connection.
- **Public API** — REST + OpenAPI and a typed tRPC router (see [docs/API.md](docs/API.md)).
- **Dark, fast, static** — every surah is prerendered.

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
on nothing**. Enforced by `eslint-plugin-boundaries` in CI. See
[`docs/adr/0001-modular-monolith.md`](docs/adr/0001-modular-monolith.md).

## Quick start

Requires **Node ≥ 20** and **pnpm** (via Corepack: `corepack enable`).

```bash
pnpm install      # install the workspace
pnpm dev          # run the dev server (http://localhost:3000)
pnpm lint         # eslint + module-boundary checks
pnpm typecheck    # tsc across every package
pnpm test         # vitest (core + data)
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
