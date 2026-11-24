# Manual E2E QA — Round 144 (2026-11-24)

Iteration 76/100. Area: the hadith collections' data (entries without text,
Arabic, section, or with duplicate numbers) and what the Hadith page says about
them.

## Findings

### 1. The collection cards showed hard-coded hadith counts that didn't match the data — FIXED

- **Where:** [`HadithBrowser.tsx`](../../apps/web/src/components/HadithBrowser.tsx)
- **Symptom:** cards read Bukhārī 7,563 · Muslim 7,500 · Abū Dāwūd 5,274 ·
  Tirmidhī 3,956 · Nasāʾī 5,761 · Ibn Mājah 4,341; the bundled data holds
  7,580 · 7,360 · 5,272 · 3,926 · 5,679 · 4,340 — so "7,500 hadith" for Muslim
  promised 140 the search can never return.
- **Fix:** counts come from the loaded collection ("…" until it arrives — they
  are prefetched on page load); the stale literals are gone.
- **Regression test:** `HadithBrowser.test.tsx` "shows how many hadith are
  actually loaded, not a hard-coded figure".

## Investigated, no bug found

No entry lacks English text; 2 Ibn Mājah and 2 Tirmidhī lack Arabic (the 4 known
from ADR 0044); no duplicate numbers; 306 Bukhārī hadith reference a book with
no section title — their cards simply omit the section name.

## Verification

HadithBrowser tests 3/3; ESLint clean; `tsc` clean.

## Verdict

One real bug, fixed.
