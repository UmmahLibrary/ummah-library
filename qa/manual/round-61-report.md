# Manual E2E QA — Round 61 (2026-11-23)

Phone-width (375px) checks of screens that only appear after interaction, and
of the largest text sizes, on the production build in English and Arabic.

## Findings

None this round.

## Investigated, no bug found

- **Custom reading plan form** (Plans → Create a custom plan), English and
  Arabic: no control crosses the screen edge, no page overflow.
- **Settings → Sync → Generate** (recovery phrase shown), English and Arabic:
  no overflow.
- **Largest text** (Arabic 240 %, translation 240 % from the reader's Text
  panel, Larger buttons on): Al-Baqara at 375px renders āyāt at full size,
  long āyāt and translations wrap within the column, and no control or text is
  cut off; Today, Juzʾ 30 and Mushaf page 50 likewise. (`main`'s scroll width
  reads 454px at that size, but no element sits outside the screen — an
  off-screen box with nothing visible clipped.) Sizes reset to 100 % afterwards.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 1/3.
