# Manual E2E QA — Round 105 (2026-11-24)

Iteration 37/100. Area: the single-āyah API and its `?edition=` parameter.

## Findings

### 1. The `edition` parameter's null-translation behaviour was undocumented — FIXED (docs + test)

- **Where:** [`openapi.json/route.ts`](../../apps/web/src/app/api/v1/openapi.json/route.ts),
  [`ayahs/[aya]/route.ts`](../../apps/web/src/app/api/v1/surahs/[number]/ayahs/[aya]/route.ts)
- **Symptom:** `?edition=bogus` (or the reader's runtime default
  `eng-mustafakhattaba`, which this server doesn't bundle) answers 200 with
  `"translation": null`, while the per-surah translation route 404s.
- **First fix, reverted:** a 404 to match. On review, the browser extension
  calls this route with the user's stored edition and treats any non-200 as
  "no verse", so a 404 would blank its popup whenever an edition stops being
  bundled. The published client wins: the route keeps returning the Arabic.
- **Fix:** the OpenAPI spec now says so ("for any other id the Arabic is still
  returned, with translation: null"), and a test pins the behaviour with the
  reason, so nobody "fixes" it into a 404 later.
- **Regression test:** new `ayahs/[aya]/route.test.ts` (bundled edition returns
  a translation; unknown edition keeps Arabic + null).

## Verification

Route + OpenAPI tests 3/3.

## Verdict

One API contract gap, closed without breaking the extension.
