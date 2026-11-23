# Manual E2E QA — Round 35 (2026-11-23)

Settings (comfort controls, themes, modes), Easy mode and Kids mode, still in
the Arabic interface. Also an accessibility-name sweep of Settings and the shell.

## Findings

### 1. Arabic/Urdu pages paint left-to-right, then mirror — FIXED

- **Where:** [layout.tsx](../../apps/web/src/app/layout.tsx), [locale-store.ts](../../apps/web/src/i18n/locale-store.ts)
- **Symptom:** every full page load in Arabic first painted the whole layout
  left-to-right (search on the left, sidebar on the right, English date), then
  flipped once React hydrated. Clearly visible on the Easy home.
- **Root cause:** the pre-paint bootstrap in the layout restores theme and
  comfort settings, but `lang`/`dir` were only set by `I18nProvider` in an
  effect after hydration; the static HTML is `lang="en"`.
- **Fix:** `LOCALE_BOOTSTRAP` (built from `LOCALES`, same pattern as
  `COMFORT_BOOTSTRAP`) sets `lang`/`dir` from `ul.locale` before first paint.
  Text still swaps on hydration (static pages), but the layout no longer jumps.
- **Verification:** the served HTML for `/qibla`, run with app scripts stripped
  (no React), ends up `dir="rtl" lang="ar"`.
- **Regression test:** [locale-store.test.ts](../../apps/web/src/i18n/locale-store.test.ts).

### 2. Easy mode's "all surahs in a big list" was the dense standard grid — FIXED

- **Where:** [NoorHomePage.tsx](../../apps/web/src/components/NoorHomePage.tsx)
- **Symptom:** Easy home tile "Choose a surah — all 114 in a big list" opened
  `/quran` with eight feature chips, Surah/Juzʾ/Revelation tabs and a
  three-column grid of small cards — the opposite of Easy mode's promise.
- **Fix:** in Easy mode the Quran index hides the chips and tabs and shows one
  full-width column.
- **Verification:** live: single big list in Easy mode; standard mode unchanged.
- **Regression test:** "NoorHomePage in Easy mode" in
  [NoorHomePage.test.tsx](../../apps/web/src/components/NoorHomePage.test.tsx)
  (fails on the old code).

### 3. Shell controls had English accessible names in other languages — FIXED

- **Where:** [Sidebar.tsx](../../apps/web/src/components/shell/Sidebar.tsx), [ThemeToggle.tsx](../../apps/web/src/components/ThemeToggle.tsx)
- **Symptom:** screen readers heard "القرآن: show 8" and "Switch to light
  theme" in the Arabic interface.
- **Fix:** `shell.showSection`/`hideSection`/`toLight`/`toDark` in all six
  catalogues.
- **Verification:** live: "القرآن: إظهار ٨", "التبديل إلى المظهر الفاتح".
- **Regression test:** Arabic-label case in
  [Sidebar.test.tsx](../../apps/web/src/components/shell/Sidebar.test.tsx).

### 4. Kids surah pages had no page title — FIXED

- **Where:** [kids/[number]/page.tsx](../../apps/web/src/app/kids/[number]/page.tsx)
- **Symptom:** the tab read just "Ummah Library" on `/kids/1`.
- **Fix:** `generateMetadata` → "For children · Al-Faatiha" (content-named,
  like `/listen/[n]`), with a canonical URL.
- **Verification:** served `<title>For children · Al-Faatiha · Ummah Library</title>`.

## Investigated, no bug found

- Arabic font stepper clamps at 70 %–240 % with the end buttons disabled; steps
  are 10 %; translation stepper likewise.
- Theme cards expose `aria-pressed`; script choice is a radio group; every
  comfort option is a labelled `role="switch"`. No unnamed controls in Settings.
- Easy mode: big Back works; "hold to leave" cancels on early release ("واصل
  الضغط…" → label restored) and exits after 2 s; keyboard Enter/Space hold is
  supported.
- Kids mode: Home redirects to `/kids`; curated short-surah list; tapping a
  word fetches timings and highlights the word.
- The Sync/backup section of Settings is still English — expected, outside the
  wave-1 catalogue (`messages.ts` says so).

## Verification

- Web `tsc --noEmit` clean; prettier clean on changed files; new and touched
  tests pass (i18n, shell, ThemeToggle, NoorHomePage).

## Verdict

4 real bugs found and fixed. Clean streak: 0/3.
