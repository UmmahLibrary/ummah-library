# Manual E2E QA — Round 40 (2026-11-23)

Keyboard and screen-reader structure (skip link, landmarks), and the reader's
display modes.

## Findings

### 1. Full-screen pages had no `main` landmark; "Skip to content" led nowhere — FIXED

- **Where:** [SurahReaderClient.tsx](../../apps/web/src/components/SurahReaderClient.tsx),
  [ListenClient.tsx](../../apps/web/src/components/ListenClient.tsx),
  [KidsReader.tsx](../../apps/web/src/components/KidsReader.tsx),
  [blog/layout.tsx](../../apps/web/src/app/blog/layout.tsx)
- **Symptom:** served HTML: `/surah/[n]` had a `<div id="main">` (no landmark);
  `/listen/[n]`, `/kids/[n]` and `/blog` had neither a `<main>` nor an
  `id="main"`, so the layout's "Skip to content" link (`#main`) did nothing and
  screen-reader "jump to main" had no target.
- **Root cause:** these routes render without the app shell
  (`SHELL_EXCLUDED` in `AppShellWrapper`), and the shell is what provides
  `<main id="main">`.
- **Fix:** each one's scrolling content column is now `<main id="main">`
  (the reader's scroll ref widened to `HTMLElement`).
- **Verification:** served HTML for all four routes contains
  `<main … id="main">`; on `/surah/36` Tab → "Skip to content" → Enter moves
  focus to `#main`; position tracking still follows a real scroll ("Āyah 14 of
  83").
- **Regression test:** [ReaderLandmarks.test.tsx](../../apps/web/src/components/ReaderLandmarks.test.tsx).

## Investigated, no bug found

- Skip link is the first Tab stop and works on shell pages and the reader.
- Reader modes: Verse by verse / Reading / Mushaf expose `aria-pressed`;
  switching to Reading sets `data-reading-mode` and keeps the page.
- 404 (`/zzz` inside the shell; `/surah/999` outside it) renders "Page not
  found" with Back to home and Search. Outside the shell the 404 has no
  landmark — left as is, since wrapping it would nest two `main`s inside the
  shell.

## Verification

- Web `tsc` clean; prettier clean; new test passes.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
