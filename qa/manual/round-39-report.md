# Manual E2E QA — Round 39 (2026-11-23)

Phone width (375 × 812) in English and Arabic, pre-paint direction on a real
load, and a WCAG text-contrast scan across the eight Noor themes.

## Findings

### 1. Label colours below 4.5:1 in every theme — FIXED

- **Where:** [themes.ts](../../packages/ui/src/themes.ts) (+ regenerated
  `noor-themes.css` / `noor-tokens.css`)
- **Symptom:** a computed-contrast scan of Today in Ivory flagged 13 text
  elements: gold labels ("Continue reading", "Verse of the day", the Hijri
  date) at 3.4:1 on white, `faint` text (Gregorian date, ⌘K) at 2.5:1. Checking
  the tokens directly: `faint` fails on at least one surface in **all eight**
  themes (2.1–4.4:1), `accent` fails in all four light themes (2.9–4.2:1), and
  `error` in Sepia/Rose (4.2/4.4:1).
- **Root cause:** ADR 0041 §1 requires labels "at 4.5:1 or better"; the dark
  `faint` had been lightened once (comment in `themes.ts`) but only checked
  against the page background, and the light themes were never adjusted.
- **Fix:** the smallest same-hue lightness change that reaches ≥4.5:1 on `bg`,
  `bg2`, card and raised-card surfaces — e.g. Ivory `faint` #a99e86 → #746952,
  `accent` #b0842a → #876520; dark-theme `faint` lightened. Light-theme
  `accentHi` (used for large Arabic surah names) darkened to ≥3:1. Web and
  mobile both pick this up from the one source.
- **Verification:** live rescan: 0 failures on Today/Settings (Ivory),
  Hifz (Mint), Plans (Rose), Today (Sepia), Today (Obsidian).
- **Regression test:** new [themes.test.ts](../../packages/ui/src/themes.test.ts)
  — every theme's `fg`/`muted`/`faint`/`accent`/`error` ≥4.5:1 and `accentHi`
  ≥3:1 on every surface (14 failures on the old palette).
- **Note for review:** this is a visible change — light-theme gold is a deeper
  shade, and faint labels are a little stronger.

### 2. Destructive actions used a hard-coded red — FIXED

- **Where:** [DataBackup.tsx](../../apps/web/src/components/DataBackup.tsx),
  [SyncSettings.tsx](../../apps/web/src/components/SyncSettings.tsx),
  [theme-css.ts](../../packages/ui/src/theme-css.ts), [tokens.ts](../../packages/ui/src/tokens.ts)
- **Symptom:** "Erase all data" and error statuses were `#E5736B` on every
  theme — 3.0:1 on white in the light themes.
- **Fix:** the palette's existing `error` colour (until now native-only) is
  emitted as `--noor-error` / `N.error`, and the web uses it — so colours stay
  in `packages/ui` (ADR 0023).

## Investigated, no bug found

- No horizontal overflow at 375px on 39 routes in English; in Arabic the only
  off-screen boxes are the decorative glow (clipped) and the Settings section
  chip strip, which is a horizontal scroller by design.
- Pre-paint direction (round 35 fix) on a real load: the document is already
  `dir="rtl" lang="ar"` at `readyState=interactive`, before hydration.
- Bottom tab bar on phones: five labelled places, Settings chips scroll.

## Verification

- `packages/ui`: 79 tests pass (incl. the CSS drift test); web and mobile
  `tsc` clean.

## Verdict

2 real bugs found and fixed. Clean streak: 0/3.
