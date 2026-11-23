# Manual E2E QA — Round 64 (2026-11-23)

More keyboard use of the reader on the production build: the āyah More menu,
the Save panel, the dock's Options, and the reader's keyboard shortcuts.

## Findings

### 1. The āyah More menu didn't behave like a menu from the keyboard — FIXED

- **Where:** [AyahActions.tsx](../../apps/web/src/components/AyahActions.tsx)
- **Symptom:** it is announced as a `menu` (round 34), but opening it left
  focus on the More button and ↑/↓ did nothing, so keyboard users had to Tab
  through it and screen-reader users were told it's a menu that didn't act
  like one.
- **Fix:** opening focuses the first item; ↑/↓ wrap through the items,
  Home/End jump to the ends; Escape closes and returns focus to More.
- **Verification:** production build: open → "Copy verse" focused; ↓↓ →
  "Share as image"; Escape → focus on More (`aria-expanded=false`).

### 2. The āyah Save panel ignored Escape — FIXED

- **Where:** [AyahActions.tsx](../../apps/web/src/components/AyahActions.tsx)
- **Symptom:** the Save panel (`role="dialog"`, "Save āyah") stayed open on
  Escape.
- **Fix:** Escape closes it and returns focus to the Save button.

### 3. Space toggled audio instead of pressing the focused button (Juzʾ reader) — FIXED

- **Where:** [ReaderShortcuts.tsx](../../apps/web/src/components/ReaderShortcuts.tsx)
- **Symptom / root cause:** the reader's Space shortcut (play/pause the inline
  player, present on the Juzʾ reader) only ignored text fields; with a button,
  link or menu item focused it called `preventDefault()` and toggled audio, so
  Space could never press the focused control.
- **Fix:** Space is left to any focused interactive element (buttons, links,
  selects, and button-like roles); on the page itself it still plays/pauses.

## Investigated, no bug found

- The dock's Options row is a disclosure (`aria-expanded` on its button), not a
  popup, so it closing only from its button is expected.
- The reader's j/k shortcuts don't use the arrow keys, so menu arrows don't
  clash with them.

## Regression tests

- [AyahActions.test.tsx](../../apps/web/src/components/AyahActions.test.tsx):
  menu focus/arrows/Escape and Save-panel Escape (2 fail on the old code).
- [ReaderShortcuts.test.tsx](../../apps/web/src/components/ReaderShortcuts.test.tsx):
  Space plays on the page but not over a focused button (fails on the old
  code).

## Verification

- Web `tsc` clean; prettier clean; tests pass.

## Verdict

3 real bugs found and fixed. Clean streak: 0/3.
