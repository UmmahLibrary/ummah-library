# ADR 0009 — Mobile app (Expo) sharing the monorepo

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

The platform targets web **and** mobile. The mobile app should reuse the shared
domain (`core`) and the typed API (`AppRouter`, 0004) rather than fork logic, and
must build inside this pnpm monorepo.

## Decision

- `apps/mobile` is an **Expo** app (SDK 54) that imports `@ummahlibrary/core` and
  reads from the **public REST API** (0004) — **online-first** for now; offline
  data (bundled assets or `expo-sqlite`) is deferred. We track the **latest Expo
  SDK** so the published Expo Go can run the project during development.
- **Metro monorepo config** (`metro.config.js`) is the load-bearing part:
  - `watchFolders` = workspace root, `nodeModulesPaths` = app + root.
  - **Hierarchical lookup stays ON.** Expo's npm/yarn guide says to disable it,
    but pnpm's isolated store needs each package to resolve its deps from its own
    `.pnpm/<pkg>/node_modules` — disabling it breaks `expo-modules-core`
    resolution.
  - `@babel/runtime` is added as a **direct dependency** (pnpm doesn't hoist it
    where Metro looks).
- Build/submit use **EAS** (`apps/mobile/eas.json`); the bundle is verified with
  `expo export`.
- **Recitation audio** uses `expo-audio` (SDK 54 replaced the removed `expo-av`),
  playing per-ayah MP3s. The URL is built with the pure `reciterAudioUrl` helper
  from `core`; because mobile may not depend on `data`, the reciter **manifest**
  (currently a single reciter,
  Alafasy) is carried as a constant in the app mirroring
  `packages/data/plugins/reciters/`. When a second reciter is needed, expose the
  reciter list via the public REST API (like `/editions`) rather than growing the
  constant.
- **Brand assets** (launcher icon, Android adaptive foreground, splash) are
  generated from one vector mark by `scripts/gen-assets.mjs` (`pnpm assets`) so
  they stay reproducible rather than hand-edited binaries.
- **Feature parity with the web reader.** Navigation is **React Navigation**
  (bottom tabs Read / Hifz / Hadith / Settings + a native stack for surah and
  juzʾ). The app reaches parity: multiple translations with a grouped, searchable
  **manager**; the three reading modes (verse-by-verse / Arabic / single
  translation); per-ayah **tafsir**; **word-by-word** audio highlighting (quran.com
  segment timings paired with quran.com audio, falling back to the reciter MP3);
  **Hifz** marking + SM-2 review; **bookmarks** and **continue reading**; a **juzʾ**
  reader; a **hadith** browser; **light/dark** theme; and **font scale**.
- **Local-first state via AsyncStorage.** Mobile has no `localStorage`, so
  `@react-native-async-storage/async-storage` backs the same `ul.*` keys the web
  uses (ADR 0006); all reader logic — translation grouping, the single-translation
  resolver, SM-2 — is the shared pure `core`. Tafsir editions and hadith
  collections are carried as app constants (like the reciter) until a list endpoint
  exists.

## Consequences

- Real code sharing across web and mobile; the same `core` and API types, and the
  same local-first `ul.*` state model.
- Mobile is **online-only** until offline data lands (its own follow-up); text,
  translations, tafsir, hadith, and audio all stream from the API/CDNs.
- An EAS build + store submission needs the maintainer's Expo/Google accounts; UI
  verification needs a device/Expo Go (CI only type-checks and bundle-builds), so
  the full feature set still needs a device pass before release.
