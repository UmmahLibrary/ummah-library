# Manual E2E QA — Round 55 (2026-11-23)

Rebuilt production and re-ran every automated sweep (one `h1` and a `main`
per page, contrast, overflow, console errors) across all eight themes.

## Findings

### 1. Light themes: `accentHi` text below 4.5:1 — FIXED

- **Where:** [themes.ts](../../packages/ui/src/themes.ts) (+ regenerated CSS)
- **Symptom:** Arabic surah names on `/quran` (19px) were 3.6:1 in Ivory,
  Sepia, Mint and Rose.
- **Root cause:** round 39 held `accentHi` to the 3:1 large-text level, but it
  is used as text at body size in 11 places (surah names, search and hadith
  highlights).
- **Fix:** light-theme `accentHi` darkened to ≥4.5:1 on every surface; the
  theme test now requires 4.5:1 for it.

### 2. Text on solid accent fills fell below 4.5:1 (a round-39 regression in Ivory; pre-existing elsewhere) — FIXED

- **Where:** [themes.ts](../../packages/ui/src/themes.ts) (+ regenerated CSS)
- **Symptom:** the selected tab of the Surah/Juzʾ/Revelation switch on `/quran`
  read 3.0:1 in Ivory and 2.7:1 in Sepia. Checking `ink` (the text colour on
  accent surfaces) against `accent` and both gradient stops: Ivory 3.0 (after
  round 39; 4.8 on `main`), Sepia 2.7 (4.1 on `main`), and the Mint and Rose
  gradients' top stops 2.4 and 3.1 already on `main` — so their gold/teal/rose
  buttons were under 4.5:1 before this loop too.
- **Root cause:** one `accent` can't be both dark enough to read as text on
  white and light enough to sit under Ivory/Sepia's dark `ink`.
- **Fix:** one rule for all four light themes, as Mint and Rose already
  intended: accent surfaces are deep with light text. Ivory/Sepia `ink` is now
  cream and their gradients are deep gold; Mint/Rose gradient tops darkened a
  little. Dark themes are unchanged. Every `ink` usage was checked to sit on an
  accent surface (web and mobile).
- **Verification:** production rebuild; contrast sweep of `/`, `/quran`,
  `/settings`, `/plans`, `/goals`, `/hifz`, `/search` in Ivory, Sepia, Mint,
  Rose and Obsidian — 0 failures.
- **Regression test:** [themes.test.ts](../../packages/ui/src/themes.test.ts) —
  `ink` ≥4.5:1 on the accent and both gradient stops for every theme (8
  failures on the previous palette).
- **Note for review:** visible change — in Ivory and Sepia, gold buttons and
  the selected tab are now a deep bronze with cream text instead of light gold
  with dark text.

## Investigated, no bug found

- All 41 production routes: exactly one `<h1>`, a `<main>` (except the 404,
  by design), no horizontal overflow, no console errors.

## Verification

- `packages/ui` 87 tests pass (incl. the CSS drift test); production build OK.

## Verdict

2 real bugs found and fixed. Clean streak: 0/3.
