# Manual E2E QA — Round 63 (2026-11-23)

Keyboard-only use of the reader on the production build (Al-Kahf): Tab to the
surah title, open Go to, close it; Tab to Text, open the panel, close it.

## Findings

### 1. Closing Go to dropped keyboard focus to the page — FIXED

- **Where:** [GoToSheet.tsx](../../apps/web/src/components/GoToSheet.tsx)
- **Symptom:** Enter on the surah title opened Go to (focus in its field, as
  intended), but Escape left `document.activeElement` = `<body>`; the next Tab
  started again from the top of the page.
- **Fix:** the sheet remembers what had focus when it opened and gives focus
  back on close (a separate effect keyed only on `open`, so it can't fire
  mid-use).
- **Regression test:** "returns focus to what opened it when closed" in
  [GoToSheet.test.tsx](../../apps/web/src/components/GoToSheet.test.tsx).

### 2. Toolbar buttons were remounted on every render; their panels ignored Escape — FIXED

- **Where:** [ReaderToolbar.tsx](../../apps/web/src/components/ReaderToolbar.tsx),
  and the same pattern in [TranslationChoice.tsx](../../apps/web/src/components/TranslationChoice.tsx)
- **Symptom:** Enter on Text opened its panel but focus fell to `<body>`; Escape
  didn't close the panel.
- **Root cause:** `IconBtn` was a component declared _inside_ `ReaderToolbar`,
  so each render created a new component type and React replaced the button —
  opening a panel re-rendered the toolbar and destroyed the focused element.
  The panels only closed on a click-away. `TranslationChoice` declared its
  `Row` the same way (its buttons were replaced on pick).
- **Fix:** `IconBtn` moved to module level; `Row` became a render function;
  Escape closes a toolbar panel and returns focus to the button that opened
  it. A scan found no other components declared inside components (web or
  mobile).
- **Verification:** production build: Tab×4 → "Text size and display", Enter
  → panel open with focus still on the button, Escape → closed, focus on the
  button.
- **Regression test:** "closes on Escape and gives focus back to the Text
  button" in [ReaderToolbar.test.tsx](../../apps/web/src/components/ReaderToolbar.test.tsx)
  (fails on the old code).

## Verification

- Web `tsc` clean; eslint clean on changed files; all 49 component test files
  (142 tests) pass; production build OK.

## Verdict

2 real bugs found and fixed. Clean streak: 0/3.
