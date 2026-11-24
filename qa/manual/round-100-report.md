# Manual E2E QA — Round 100 (2026-11-24)

Iteration 32/100. Area: the reader's first-visit translation notice
("Translation: Mustafa Khattab (English) — Change · Keep this").

## Findings

### 1. "Keep this" dropped keyboard focus to the top of the page — FIXED

- **Where:** [`TranslationNotice.tsx`](../../apps/web/src/components/TranslationNotice.tsx)
- **Symptom:** pressing Keep this saved the choice (`ul.editions`) and removed the
  notice — with the focused button — so focus fell to `<body>`; the next Tab
  started again at "Skip to content" (WCAG 2.4.3).
- **Fix:** before the notice goes, Keep finds the next focusable element after it
  in document order and focuses that once the choice is saved.
- **Regression test:** new `TranslationNotice.test.tsx`.

## Investigated, no bug found

Keep writes `ul.editions` and the notice doesn't return on other surahs.

## Verification

Test passes; `tsc`, ESLint clean.

## Verdict

One real accessibility bug, fixed.
