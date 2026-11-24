# Manual E2E QA — Round 69 (2026-11-24)

Iteration 1 of a new 100-iteration loop (branch `qa-loop-100`, from `origin/main`
0560ac4). Area: the newest feature, **Related hadith** on an āyah (#263, ADR 0044),
exercised on Al-Aḥzāb in the dev server at 1280px.

## Findings

### 1. A Related hadith link opened the Hadith page's home, not the hadith — FIXED

- **Where:** [`RelatedHadith.tsx`](../../apps/web/src/components/RelatedHadith.tsx),
  [`HadithBrowser.tsx`](../../apps/web/src/components/HadithBrowser.tsx)
- **Symptom:** on 33:21, Related → "Sunan Abi Dawud · 1223" went to
  `/hadith?collection=eng-abudawud&section=4`, which showed the collection list
  with no filter and no hadith 1223.
- **Root cause:** the Hadith browser never read any URL parameter; `section`
  had no meaning anywhere.
- **Fix:** the link is now `?collection=<id>&hadith=<number>`. The browser reads
  it once on mount, selects that book and shows just that hadith ("1 result in
  Abū Dāwūd · #1223"); touching any filter, the search box or Clear drops it.
- **Verification:** live in the browser — the link lands on hadith 1223.
- **Regression test:** `HadithBrowser.test.tsx` "opens on the one hadith named by ?collection=&hadith=".

### 2. A failed Related load could never be retried — FIXED

- **Where:** [`RelatedHadith.tsx`](../../apps/web/src/components/RelatedHadith.tsx)
- **Symptom (from source, confirmed by test):** the per-āyah promise cache stored
  the rejected promise too, so after one failure (offline) every re-open showed
  "Couldn't load… try again" without trying again until a full reload.
- **Fix:** a failed promise removes itself from the cache.
- **Regression test:** new `RelatedHadith.test.tsx`.

## Investigated, no bug found

- 33:1 shows the "No hadith … word for word" empty state; 33:21 lists 34 hadith
  with grade, Arabic, translation and matched span. Every āyah showing a Related
  toggle that is usually empty is the accepted trade-off recorded in ADR 0044.

## Verification

Web tests for both files pass (React pin hook), `tsc` clean, ESLint clean, Prettier written.

## Verdict

Two real bugs, both fixed.
