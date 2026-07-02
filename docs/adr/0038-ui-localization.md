# 0038 — UI localization (i18n foundation)

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

This lands **Phase 0–1**: the infrastructure + RTL wiring + picker, with a
**starter slice** of strings extracted (the app-shell nav + common chrome) and a
second locale (**Urdu, RTL**) proving the mechanism end-to-end. Extracting the
remaining UI strings is incremental follow-up under #208 — each screen swaps its
literals for `t()` keys with no further architecture change.

The Urdu strings are a **first pass flagged for native review**; the deliverable
here is the localization *infrastructure*, not authoritative translations, so this
carries `needs-scholar-review` for the language content.

## Consequences

- **Good:** the app can be localized incrementally; RTL is handled app-wide by one
  `dir` switch; completeness is compiler-enforced; the choice is device-local.
- **Cost:** a brief first-paint in the default locale before the saved locale
  applies (the provider reads `localStorage` after mount, like the theme did
  before its inline script). An inline pre-hydration locale script is a later
  refinement if the RTL flash matters.
- **Content vs. chrome:** deliberately does **not** touch Quran/translation text —
  those stay on their edition system.
