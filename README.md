# Ummah Library

[![CI](https://github.com/UmmahLibrary/ummah-library/actions/workflows/ci.yml/badge.svg)](https://github.com/UmmahLibrary/ummah-library/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Live app](https://img.shields.io/badge/live-ummahlibrary.org-1f9d55.svg)](https://ummahlibrary.org)
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

### 🕮 Read it now: **[ummahlibrary.org](https://ummahlibrary.org)**

Read the full Quran (Uthmani Arabic) with translations in **dozens of
languages**, installable as an app, and **fully readable offline**.

## Features

### 📖 Read & study

- **All 114 surahs** in Uthmani Arabic (Tanzil, CC-BY 3.0), with the Amiri font and proper RTL.
- **Three reading surfaces** — verse-by-verse, continuous reading, and a **Madani Mushaf page view** (all 604 pages).
- **A runtime catalogue of ~490 translations across ~98 languages** ([ADR 0011](docs/adr/0011-translation-catalog-runtime.md)) — grouped, searchable, toggle any combination; 6 are bundled for offline + the REST API. Urdu locales default to an Urdu translation.
- **Multiple Tafsirs** (Ibn Kathir, Muyassar, Tabari, Maarif-ul-Quran …) fetched on demand.
- **Transliteration & word audio** — toggle a per-āyah Latin transliteration line, a per-word transliteration row, and **tap any Arabic word to hear just that word** recited.
- **Recitation audio** with multiple reciters, surah **loop/repeat**, and word-by-word highlighting; tap any word for a **word-by-word gloss**.
- **Full-text search** across the Arabic and English — instant, client-side ([`/search`](https://ummahlibrary.org/search), [ADR 0021](docs/adr/0021-global-search.md)) — plus **Hadith search**.
- **Hadith** — 6 collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Ibn Majah, Nasa'i), book by book, searched on-device ([ADR 0022](docs/adr/0022-hadith-ingested-search.md)).
- **99 Names of Allah** — Asmāʾ al-Ḥusná with transliteration, meaning and Quranic references; mark the ones you’ve learned.

### 🧠 Memorize & build a habit

- **Hifz** spaced-repetition review (SM-2) with a due-count badge ([ADR 0007](docs/adr/0007-hifz-spaced-repetition.md)).
- **Reading goals** — a daily page goal, a reading **streak**, and a **khatma planner** that paces you to finish by a date.
- **Reading plans** — start a curated plan (juzʾ-a-day, a month, finish-by-a-date …) and the scheduler paces you; progress stays on your device ([ADR 0025](docs/adr/0025-reading-plans.md)).
- **Achievements** — milestone badges derived from your own reading, memorization and worship activity, unlocked locally ([ADR 0032](docs/adr/0032-achievements.md)).

### 🕌 Worship & tracking

- **Prayer times** for your location — six prayers, multiple calculation methods and both madhabs, with a live next-prayer countdown ([ADR 0012](docs/adr/0012-prayer-times.md)); coordinates stay on your device. Optional **per-prayer reminders** ([ADR 0019](docs/adr/0019-prayer-reminders.md)).
- **Prayer tracker** — log the five daily prayers (on time / late), keep a **qaḍāʾ (missed-prayer) backlog**, and pause tracking for **ḥayḍ** ([ADR 0020](docs/adr/0020-prayer-tracker.md), [0030](docs/adr/0030-qada-tracker.md), [0031](docs/adr/0031-haid-pause.md)).
- **Ramadan** companion — a fasting tracker with **make-up (qaḍāʾ) fasts** automatically derived from any ḥayḍ pause that overlaps Ramaḍān ([ADR 0034](docs/adr/0034-fasting-qada.md)).
- **Qibla** direction to the Kaaba with a live compass — pure, offline, and computed on your device ([ADR 0013](docs/adr/0013-qibla.md)).
- **Hijri calendar** with a Gregorian cross-reference and a ±day adjustment to match your local sighting; today's Hijri date shows across the app ([ADR 0014](docs/adr/0014-hijri-calendar.md)).
- **Zakat calculator** for monetary wealth — the agreed Sunni method (2.5% above the niṣāb) with a gold/silver threshold toggle; an educational estimate computed entirely on your device ([ADR 0015](docs/adr/0015-zakat.md)).
- **Adhkar** — the morning & evening remembrances from Ḥiṣn al-Muslim, with Arabic, transliteration, translation, graded sources and a tap counter that resets daily; works offline ([ADR 0016](docs/adr/0016-adhkar.md)). Optional **reminders** nudge you after Fajr and ʿAṣr, derived from your prayer times ([ADR 0017](docs/adr/0017-adhkar-reminders.md)).
- **Duʿās** — a browsable collection of supplications with Arabic, transliteration and translation.
- **Tasbih counter** — a simple digital counter for your dhikr, with presets and round tracking.

### 🔒 Private, portable & yours

- **No account, no tracking, local-first** — bookmarks, continue-reading, scroll memory, collections & notes, and every tracker live on your device ([ADR 0006](docs/adr/0006-local-first-persistence.md), [0024](docs/adr/0024-local-storage-ports.md)). Keyboard shortcuts (`j`/`k`/`Space`).
- **Optional end-to-end-encrypted sync** — bring your data to another device with a recovery phrase. Opt-in, **zero-PII**, the server only ever sees opaque encrypted blobs ([ADR 0033](docs/adr/0033-account-sync.md)).
- **Share an ayah as an image** — render any verse to a clean image (Arabic + translation) right in the browser, no upload.
- **Export & import your data** — back up to a file and restore on another device, with no account or server ([ADR 0018](docs/adr/0018-local-data-backup.md)).
- **Eight Noor themes** — four dark, four light — from one shared design system across web and mobile ([ADR 0023](docs/adr/0023-noor-design-system.md), [0027](docs/adr/0027-generated-theme-css.md)).

### 📱 Everywhere

- **Installable PWA** with offline reading — opened surahs stay available without a connection.
- **Mobile app** (Expo / React Native) — the full reader and tools, with OS-level reminders that fire even when the app is closed ([ADR 0009](docs/adr/0009-mobile-app.md), [0029](docs/adr/0029-mobile-notifier.md)).
- **Browser extension** (MV3) — a quick popup reader over the public API ([ADR 0026](docs/adr/0026-browser-extension.md)).
- **Public API** — REST + OpenAPI and a typed tRPC router (see [docs/API.md](docs/API.md)).
- **Fast & static** — every surah, juzʾ and Mushaf page is prerendered ([ADR 0003](docs/adr/0003-static-first-delivery.md)).

## Architecture

A single TypeScript monorepo (Turborepo + pnpm), structured as a modular
monolith with strict, **lint-enforced** module boundaries:

```
apps/
  web/        Next.js reader + public API (live)
  mobile/     Expo / React Native app — full reader + tools (Android; iOS build-ready)
  extension/  MV3 browser extension — popup over the public API (ADR 0026)
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

Base URL: `https://ummahlibrary.org/api`. Full reference in
[docs/API.md](docs/API.md).

```bash
curl https://ummahlibrary.org/api/v1/surahs
curl https://ummahlibrary.org/api/v1/surahs/2
curl https://ummahlibrary.org/api/v1/surahs/2/translations/eng-khattab
```

## Tech

Next.js · Expo / React Native · tRPC · REST/OpenAPI · `adhan` prayer times ·
AsyncStorage (mobile local-first state) · WebCrypto (E2EE sync) · Tanzil Quran
data · `fawazahmed0/quran-api` translations.

## Contributing

Newcomers very welcome — start with [`CONTRIBUTING.md`](CONTRIBUTING.md) and the
[`good first issue`](https://github.com/UmmahLibrary/ummah-library/labels/good%20first%20issue)
label. Module boundaries are enforced automatically, so the structure guides you.
Islamic content uses established, attributed sources (Tanzil, Ḥiṣn al-Muslim, …);
corrections and scholarly review are warmly welcomed —
[open an issue](https://github.com/UmmahLibrary/ummah-library/issues/new/choose).

## License

[AGPL-3.0-only](LICENSE). Every external source — bundled or fetched at runtime —
is credited in [`ATTRIBUTION.md`](ATTRIBUTION.md), with the per-dataset notices in
[`packages/data/ATTRIBUTION.md`](packages/data/ATTRIBUTION.md). These attributions
(e.g. Tanzil CC-BY 3.0) travel with the data.
