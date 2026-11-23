# Manual E2E QA — Round 42 (2026-11-23)

Round 41 found a setting that was saved but never read. This round swept every
comfort setting for a consumer and checked that each one actually changes
behaviour.

## Findings

### 1. "Reduce motion" didn't stop animated scrolling — FIXED

- **Where:** new [motion.ts](../../apps/web/src/lib/motion.ts);
  [ReadingAudio.tsx](../../apps/web/src/components/ReadingAudio.tsx),
  [ReaderShortcuts.tsx](../../apps/web/src/components/ReaderShortcuts.tsx),
  [ArticleTOC.tsx](../../apps/web/src/components/blog/ArticleTOC.tsx)
- **Symptom:** with Settings → Reduce motion ("No sliding or animated
  scrolling") on, the reader still glided to each āyah while following a
  recitation, keyboard āyah navigation glided, and the blog contents list
  glided. The device's own reduced-motion preference was ignored by these too.
- **Root cause:** the setting adds `html.comfort-reduce-motion`, whose CSS sets
  `scroll-behavior: auto` — but an explicit `scrollIntoView({ behavior:
"smooth" })` / `scrollTo({ behavior: "smooth" })` in JS overrides CSS.
- **Fix:** `scrollBehavior()` returns `"auto"` when Reduce motion is on or the
  device prefers reduced motion, else `"smooth"`; the three call sites use it.
- **Regression test:** [motion.test.ts](../../apps/web/src/lib/motion.test.ts).

## Investigated, no bug found

Every other comfort setting has a working consumer:

| Setting                   | Consumer                                             |
| ------------------------- | ---------------------------------------------------- |
| Translation size          | `--tr-scale` (pre-paint + `applyComfort`)            |
| Calmer translation colour | `html.tr-soft` CSS                                   |
| Dyslexia spacing          | `html.comfort-dyslexia` CSS, Latin translations only |
| Larger buttons            | `html.comfort-large` CSS + `SizeControls`            |
| Show days in a row        | Home, Goals, Hifz, Tracker, Profile (round 36)       |
| Pause tracking            | Home, Goals                                          |
| Reading path              | Home (round 41)                                      |
| Easy / Kids mode          | `data-app-mode`, Easy home, Kids redirect, shell CSS |

## Verification

- Web `tsc` clean; eslint: only two pre-existing hook-dependency warnings in
  `ReadingAudio.tsx`; motion and ReadingAudio tests pass.

## Verdict

1 real bug found and fixed. Clean streak: 0/3.
