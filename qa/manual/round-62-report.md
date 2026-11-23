# Manual E2E QA — Round 62 (2026-11-23)

Sizes between phone and desktop on the production build: 761, 768, 900–960,
1023–1280px, English and Arabic.

## Findings

None this round.

## Investigated, no bug found

- **768px (tablet), English:** Today, Quran, Al-Baqara, Settings — no
  horizontal overflow, no control off-screen; the tab bar shows (sidebar
  hidden); the reader shows neither, as designed (it has its own bar and dock).
- **768px, Arabic:** Today, Quran, Al-Baqara, Plans — same.
- **761px** (just above the 760px phone tweaks): Today, Goals — clean.
- **Navigation breakpoint:** the sidebar and tab bar switch at a single
  `max-width: 900px` rule ([globals.css](../../apps/web/src/app/globals.css)), so
  there is no width with neither; verified at 900 (tab bar), 920, 939–941, 950,
  960, 1000, 1023, 1025 and 1280 (sidebar).
- **1024px:** Today, Hifz — clean, sidebar shown.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 2/3.
