# 0040 — UI localization (i18n foundation)

- **Status:** Accepted
- **Date:** 2026-07-03
- **Issue:** #208

## Context

Every UI string is hardcoded English inline in JSX, and `<html lang>` is fixed to
`en`. Readers want the **interface** in their own language (Urdu, Arabic, …). This
is separate from Quran/translation *content*, which already has its own edition
system — here we localize only the app's own chrome.

## Decision

A small **in-house i18n**, no new dependency:

- `apps/web/src/i18n/config.ts` — the locale list, each with a text `dir`.
- `apps/web/src/i18n/messages.ts` — English is the source of truth and defines the
  key set (`MessageKey`); every other locale is a `Record<MessageKey, string>` the
  compiler forces to stay complete (a missing key won't build).
- `apps/web/src/i18n/I18nProvider.tsx` — a client provider holding the active
  locale (persisted in `localStorage` under `ul.locale`, local-first), a `t()`
  lookup with an English fallback, and an effect that drives `<html lang>` +
  `<html dir>` so an **RTL** locale mirrors the whole layout.
- `LanguagePicker` on Settings switches the locale.

Chose an in-house catalogue over a library (next-intl / i18next): the need is a
typed key→string map + a direction flag, so a dependency and its message-loading
machinery aren't worth it; the typed catalogue gives compile-time completeness
for free and keeps the bundle lean.

## Scope of this change (phased)

This lands **Phase 0–1** on web: the infrastructure + RTL wiring + picker, with a
**starter slice** of strings extracted (the app-shell nav + common chrome) and a
second locale (**Urdu, RTL**) proving the mechanism end-to-end. Extracting the
remaining UI strings is incremental follow-up under #208 — each screen swaps its
literals for `t()` keys with no further architecture change.

The Urdu strings are a **first pass flagged for native review**; the deliverable
here is the localization *infrastructure*, not authoritative translations, so this
carries `needs-scholar-review` for the language content.

**Phase 4 (mobile + extension parity)** is also landed: each platform gets its
own `en`/`ur` catalogue and runtime, following the pattern already established
for its persistence layer rather than a shared package (a `packages/i18n` was an
open question in the original issue; deferred rather than decided here — the
duplication mirrors how reciter/plugin manifests are already mirrored into
`apps/mobile/src/plugins.ts`, per that file's own comment).

- **`apps/mobile/src/i18n/`** — `config.ts`/`messages.ts`/`I18nProvider.tsx`
  (React context, mirrors `apps/mobile/src/theme.tsx`) /`locale-store.ts`
  (AsyncStorage under `ul.locale`, same key the web app uses). Starter slice:
  the bottom tab bar labels + the Settings language section. Deliberately does
  **not** call `I18nManager.forceRTL` — that needs a full app restart and a
  reload mechanism (`expo-updates`) this app doesn't yet depend on, so native
  RTL layout mirroring is left as a follow-up rather than shipped unverified (no
  device/simulator was available to verify it in this change). `localeDir()` is
  still exposed for the existing per-element `writingDirection: "rtl"` pattern
  already used for Arabic text.
- **`apps/extension/src/lib/locale.ts` + `locale-store.ts` + `messages.ts`** —
  collapsed into the extension's flat `lib/` layout and its existing
  sync-mirror-plus-`chrome.storage.sync` split (mirrors `theme.ts`/
  `theme-store.ts`), rather than a Context provider — the popup's whole
  component tree is small enough that `theme`/`locale` are drilled as props, the
  same shape the app already uses for its theme. Starter slice: the popup's own
  chrome (verse-of-day label, sūra search label, theme label, footer links) plus
  a language picker next to the existing theme picker.

## Consequences

- **Good:** the app can be localized incrementally; RTL is handled app-wide by one
  `dir` switch; completeness is compiler-enforced; the choice is device-local.
- **Cost:** a brief first-paint in the default locale before the saved locale
  applies (the provider reads `localStorage` after mount, like the theme did
  before its inline script). An inline pre-hydration locale script is a later
  refinement if the RTL flash matters.
- **Content vs. chrome:** deliberately does **not** touch Quran/translation text —
  those stay on their edition system.
