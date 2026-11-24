# Manual E2E QA — Round 135 (2026-11-24)

Iteration 67/100. Area: "New collection" in the reader's Save panel (web) and
the mobile Save sheet — blank, repeated and differently-cased names.

## Findings

### 1. Typing an existing collection's name created a duplicate — FIXED (web + mobile)

- **Where:** [`AyahActions.tsx`](../../apps/web/src/components/AyahActions.tsx),
  [`SaveToCollection.tsx`](../../apps/mobile/src/components/SaveToCollection.tsx)
- **Symptom (from source):** "Favourites" typed when a "Favourites" collection
  exists made a second, separate "Favourites"; saved āyāt then split between two
  look-alike lists on the Bookmarks page.
- **Fix:** new core `saveToNamedCollection(collections, id, name, ref)` in
  [`collections.ts`](../../packages/core/src/collections.ts): an existing name
  (case- and space-insensitive) saves into that collection and never toggles the
  āyah back out; a new name creates one; a blank name is a no-op (the button was
  already disabled for blanks). Both apps use it.
- **Regression tests:** `core/collections.test.ts` "reuses a same-named
  collection instead of creating a duplicate", "creates a new collection for a
  new name, and ignores a blank one".

## Verification

core collections 9/9, web AyahActions 7/7; typecheck core/web/mobile; ESLint clean.

## Verdict

One real data-organisation bug, fixed on both apps.
