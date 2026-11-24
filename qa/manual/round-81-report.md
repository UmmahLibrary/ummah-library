# Manual E2E QA — Round 81 (2026-11-24)

Iteration 13/100. Area: the Search page with awkward input — references,
loose surah spellings, Arabic, regex characters, a 300-character string.

## Findings

### 1. Search couldn't find a place: "2:255", "yasin", "juz 30" gave "Nothing found" — FIXED

- **Where:** [`SearchView.tsx`](../../apps/web/src/components/SearchView.tsx)
- **Symptom:** `2:255` → 0 results, "Nothing found"; `yasin` → 0 (the surah is
  "Yaseen"); `juz 30`, `page 3` → nothing. `kahf` worked only because the
  spelling happened to be a substring.
- **Root cause:** Search only matched text. The reader's Go-to parser
  (`core/goto.ts` `parseGoTo`) already understands references, loose
  transliterations, juzʾ/page/ḥizb — Search never used it.
- **Fix:** when the query names a place, a "Go to …" result leads the list
  ("Go to Al-Baqara 2:255", "Go to Surah 36 · Yaseen", "Go to Juzʾ 30"), and
  "Nothing found"/"0 results" no longer show under it. A surah already in the
  text results isn't duplicated.
- **Regression test:** `SearchView.test.tsx` "offers a jump for a place…".

## Investigated, no bug found

Arabic phrases (`الحمد لله` 27, `رب اشرح لي صدري` → 20:25), regex characters
`(`, `[a`, `.*` (no crash, treated literally), 300 × "a" (0 results, layout
holds). "ayat al kursi" by name isn't recognised — a nickname table would be
content curation, left alone.

## Verification

Tests 3/3; `tsc`, ESLint clean; live: all six place queries show the jump.

## Verdict

One real UX bug, fixed.
