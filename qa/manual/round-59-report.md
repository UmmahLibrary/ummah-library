# Manual E2E QA — Round 59 (2026-11-23)

After round 58's menu fix, every other reader popup at phone width (375px) in
English and Arabic, on the production build: Save panel, Tafsir, the toolbar's
Text panel, the dock's Options row, and the Go to sheet.

## Findings

### 1. The reader's Text panel ran off the right edge on phones — FIXED

- **Where:** [ReaderToolbar.tsx](../../apps/web/src/components/ReaderToolbar.tsx),
  [globals.css](../../apps/web/src/app/globals.css)
- **Symptom:** at 375px in English the panel's right side was cut off — the
  "+" size buttons, "Choose translations" and the option labels.
- **Root cause:** a phone-only override (`.noor-pop-sm-left` → `left: 0
!important`) forced the panel to grow rightward. It was written for an
  earlier toolbar where the Text button sat on the left; now it sits near the
  right edge.
- **Fix:** dropped the override (and its now-unused rule); the panel keeps its
  default `insetInlineEnd: 0`, which grows toward the screen's interior in
  both directions.
- **Verification:** production build at 375px: English 52–312px, Arabic
  63–323px.
- **Regression test:** [ReaderToolbar.test.tsx](../../apps/web/src/components/ReaderToolbar.test.tsx).

### 2. Go to sheet was wider than a phone screen in Arabic — FIXED

- **Where:** [noor-everyone.css](../../apps/web/src/app/noor-everyone.css)
- **Symptom:** at 375px in Arabic the sheet measured −91…375px: Close, the Go
  button, the Page tab and the Arabic surah names were off screen.
- **Root cause:** `.goto-root` is a grid with an implicit `auto` column, which
  grew to the sheet content's min width (466px); `width: 100%` plus padding
  in `content-box` added to it.
- **Fix:** `grid-template-columns: minmax(0, 1fr)`, `min-width: 0` and
  `box-sizing: border-box` on the sheet.
- **Verification:** production build: Arabic and English at 375px → 0–375px
  with Close, Go and all four tabs on screen; desktop unchanged (centred,
  560px).
- **Regression test:** layout guard in
  [GoToSheet.test.tsx](../../apps/web/src/components/GoToSheet.test.tsx)
  (jsdom has no layout, so it checks the rule itself).

## Investigated, no bug found

- Save panel and Tafsir open in the page flow (no overflow); the dock's Options
  row wraps within 375px.

## Verification

- Web `tsc` clean; prettier clean; toolbar and Go to tests pass; production
  build OK.

## Verdict

2 real bugs found and fixed. Clean streak: 0/3.
