# ADR 0009 — Mobile app (Expo) sharing the monorepo

- **Status:** Accepted
- **Date:** 2026-06-06

## Context

The platform targets web **and** mobile. The mobile app should reuse the shared
domain (`core`) and the typed API (`AppRouter`, 0004) rather than fork logic, and
must build inside this pnpm monorepo.

## Decision

- `apps/mobile` is an **Expo** app that imports `@ummahlibrary/core` and reads from
  the **public REST API** (0004) — **online-first** for now; offline data
  (bundled assets or `expo-sqlite`) is deferred.
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

## Consequences

- Real code sharing across web and mobile; the same `core` and API types.
- Mobile is **online-only** until offline data lands (its own follow-up).
- An EAS build + store submission needs the maintainer's Expo/Google accounts; UI
  verification needs a device/Expo Go (CI only type-checks and bundle-builds).
