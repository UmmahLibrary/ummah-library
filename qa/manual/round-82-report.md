# Manual E2E QA — Round 82 (2026-11-24)

Iteration 14/100. Area: the Tafsir page (`/tafsir`) on its own, compared with
the mobile Tafsir screen. (Round 13's top-bar search check: it submits to
`/search?q=`, so round 81's Go-to fix covers it.)

## Findings

### 1. Arabic and Urdu commentary rendered left-to-right — FIXED

- **Where:** [`TafsirSample.tsx`](../../apps/web/src/components/TafsirSample.tsx)
- **Symptom:** with Tafsīr Muyassar (the default) or Ibn Kathīr (Urdu), the
  commentary block had no `dir`/`lang`, so it was left-aligned with punctuation
  on the wrong side. The reader's tafsir panel already sets `dir="rtl"` for
  `ar-`/`ur-` editions.
- **Fix:** same rule (`dir="rtl"` + `lang`) on this page.

### 2. The Tafsir page only ever showed Al-Fātiḥah 1:1 — FIXED

- **Symptom:** the page offers six editions but no way to choose an āyah; the
  mobile Tafsir screen lets you pick any surah.
- **Fix:** Surah and Āyah pickers plus Previous/Next (crossing surah
  boundaries), the āyah's Arabic from the API, an honest empty state ("may be
  explained together with a neighbouring āyah"), a failure message, and the link
  opens the reader at that exact āyah.
- **Verification:** live — Al-Baqara 255 in Muyassar, right-to-left.
- **Regression tests:** new `TafsirSample.test.tsx` (stepping across surahs; RTL).

## Verification

Tests 2/2; `tsc`, ESLint clean.

## Verdict

Two real bugs, fixed.
