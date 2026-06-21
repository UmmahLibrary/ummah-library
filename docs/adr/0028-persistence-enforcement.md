# ADR 0028 — Persistence behind store adapters is lint-enforced

- **Status:** Accepted
- **Date:** 2026-06-21
- **Amends:** [ADR 0024](0024-local-storage-ports.md), [ADR 0001](0001-modular-monolith.md)

## Context

ADR 0024 established the pattern: on-device state lives behind a Store **port**,
with a per-platform adapter (`localStorage` on web, `AsyncStorage` on mobile,
`chrome.storage` in the extension), so a future synced adapter (#25) can replace
the storage without touching feature logic. ADR 0001 makes `core` pure and
points dependencies inward.

Both were **convention only**. In practice the pattern was about half-adopted on
web: ~30 feature files (and the reminder feature, which blocked sharing its
scheduling logic with mobile — see the reminder-orchestration work) read and
wrote `localStorage`/`sessionStorage` **directly**. `eslint-plugin-boundaries`
caught cross-package *imports* but could not see global usage, nondeterminism, or
raw storage, so nothing stopped a new direct-storage write from landing.

## Decision

**Encode the invariants as ESLint rules so they fail the build, and migrate every
existing violation so the rules can ship with no allowlist.**

Two checks in `eslint.config.mjs` (the same engine as the boundaries rule):

- **Check A — `core` purity** (`packages/core/src/**`): `no-restricted-globals`
  (no `window`/`document`/`localStorage`/`fetch`/`process`/…), `no-restricted-syntax`
  (no `Date.now()`/`Math.random()` — inject the clock, see `hifz.ts`), and
  `no-restricted-imports` (no Node built-ins). A bare `new Date()` **default
  parameter** stays allowed (the injected-clock idiom). Codifies ADR 0001 #1/#3.
- **Check B — persistence behind a port** (`apps/**`): `no-restricted-globals`
  for `localStorage`/`sessionStorage`/`indexedDB` and `no-restricted-imports` for
  `@react-native-async-storage/async-storage`. The **only** sanctioned raw-storage
  homes are the adapter files: `*-store.ts`, `*-provider.ts`, the web
  `web-notifier.ts`, and each app's `storage.ts`. **No legacy allowlist** — every
  feature was migrated first.

To make Check B shippable, all web feature storage was moved behind adapters
(reminders, prayer settings, theme, reader prefs, asma, hifz-streak, ramadan,
hijri, search history, zakat, adhkar) plus a `backup-store` (the one place that
enumerates the whole `ul.*` key-space) and the extension's theme mirror. Reader
state that is read before paint (theme, reader prefs, scroll) uses **synchronous**
adapters — an async port can't serve a pre-paint read; the FOUC inline script in
`app/layout.tsx` reads `localStorage` as a string and is not feature code.

## Consequences

- A new direct `localStorage`/`AsyncStorage` use in feature code now **fails CI**;
  the fix is to add (or route through) a Store adapter, never to relax the rule.
- The reminder orchestration is now platform-neutral in `core`, unblocking the
  native `ExpoNotifier` (#71).
- The synced-storage adapter (#25), when it lands, swaps the adapter files only.
- Adding a genuinely new storage adapter means a `*-store.ts` / `*-provider.ts` /
  `storage.ts` file (already carved out) — not a feature-code exception.
