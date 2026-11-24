# Manual E2E QA — Round 111 (2026-11-24)

Iteration 43/100. Area: renaming a collection on the Bookmarks page — typed
key by key with real keyboard events.

## Findings

### 1. A collection name couldn't contain a space, or be cleared to retype — FIXED (web + mobile)

- **Where:** [`CollectionsView.tsx`](../../apps/web/src/components/CollectionsView.tsx),
  [`CollectionsScreen.tsx`](../../apps/mobile/src/screens/CollectionsScreen.tsx)
- **Symptom:** with "My", pressing Space then x gave **"Myx"**; Ctrl+A, Delete
  left "Myx" in place. (A fast scripted `type(" favourites")` slipped through
  the race, which is why it looked fine at first.)
- **Root cause:** every keystroke was saved through core `renameCollection`,
  which trims and refuses an empty name; the controlled input then re-rendered
  from the saved name, dropping the trailing space and the deletion.
- **Fix:** the title edits a local draft and saves on blur/Enter (mobile: end
  of editing / submit); an empty draft restores the old name; Escape cancels (web).
- **Regression test:** new `CollectionsView.test.tsx` — "keeps spaces while
  typing and saves on Enter"; "lets the name be cleared to retype, and restores
  it if left empty".

## Verification

Tests 2/2; typecheck web + mobile; ESLint clean.

## Verdict

One real bug, fixed on both apps.
