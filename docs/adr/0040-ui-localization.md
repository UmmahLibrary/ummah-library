# 0040 — UI localization (i18n foundation)

- **Status:** Accepted
- **Date:** 2026-07-03
- **Issue:** #208

## Context

Every UI string is hardcoded English inline in JSX, and `<html lang>` is fixed to
`en`. Readers want the **interface** in their own language (Urdu, Arabic, …). This
is separate from Quran/translation _content_, which already has its own edition
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
here is the localization _infrastructure_, not authoritative translations, so this
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
- ~~**Cost:** a brief first-paint in the default locale before the saved locale
  applies… An inline pre-hydration locale script is a later refinement if the RTL
  flash matters.~~ **Resolved 2026-09-03 — the script is in.** `layout.tsx` now
  sets `<html lang>`/`<html dir>` from `ul.locale` in the same pre-paint inline
  script the theme already used, so an RTL locale no longer flips after
  hydration. The script cannot import `config.ts`, so it carries its own
  direction map; `i18n/locale-script.test.ts` fails if that map and `LOCALES`
  drift apart (same seam as the generated-theme-CSS drift test, ADR 0027).
  Message _text_ still renders in the default locale until hydration — that part
  is inherent to reading the choice from `localStorage` under SSR, and would need
  a cookie to fix.
- **Content vs. chrome:** deliberately does **not** touch Quran/translation text —
  those stay on their edition system.

## Rollout progress (amended 2026-09-03)

Phase 0–1 landed the infrastructure with a **starter slice** of ~52 keys. Taking
stock: only **3 of 174** web components consumed `t()`, so a reader who switched
to Urdu got an RTL layout wrapped around an almost entirely English app. Three
decisions came out of continuing the sweep.

**1. The sweep ratchets, enforced by a test.** The risk in a ~170-component sweep
is not the work, it's drift behind it — a file gets extracted, then a later PR
adds a hardcoded label and nobody notices until someone switches language.
`i18n/localized-files.test.ts` holds the list of files whose strings have been
extracted and parses each with the TypeScript compiler, failing on any JSX text
node or user-facing attribute (`placeholder`, `title`, `aria-label`, `alt`) given
a bare literal. Files not yet swept are simply absent, so it never blocks work on
them. Deliberate exceptions (a `⌘K` glyph, a placeholder avatar initial) sit in an
`ALLOWED` map **with a stated reason**, so each one is an argued decision rather
than a silent gap.

**2. `t()` interpolates.** The catalogue was key→string only, which is enough for
labels and nothing else. Real strings carry values — "in 5 min", "Qibla · 118°
SE" — and building those by concatenating JSX fragments bakes in English word
order: Urdu puts the time before "میں", and no amount of joining strings can
express that. `t(key, params)` fills `{name}` slots; an unmatched slot is left
verbatim so a missing parameter is visible rather than silently blank.

**3. Server components are out of scope for this mechanism.** `t()` is a client
hook, so a page that exports `metadata` (e.g. `app/settings/page.tsx`) cannot use
it. Localizing those needs a separate decision — a server-side locale source,
which means a cookie, which is a change to the local-first no-server-state
posture (ADR 0006) and deserves its own ADR. The sweep therefore covers **client
components only**; server-rendered page chrome and `metadata` stay English for now.

**Swept so far:** the app shell (`Sidebar`, `TabBar`, `TopBar`) and the Tools hub
(`app/tools/page.tsx` plus its two featured cards). The shell is the highest-value
slice because it renders on every route. The Gregorian date in `TopBar` was also
pinned to `en-GB` regardless of interface language, and now formats in the active
locale.

Urdu strings remain a first pass flagged for native review, per the original
decision.
