# Manual E2E QA — Round 38 (2026-11-23)

Search, saving to collections, Bookmarks, and a link crawl of every hub page.

## Findings

### 1. Search under-reported results and hid whole categories — FIXED

- **Where:** [SearchView.tsx](../../apps/web/src/components/SearchView.tsx)
- **Symptom:** `/search?q=mercy` said "60 results" with only a "Quran 60"
  filter. The real count is 152 — 146 verses and 6 adhkār — so the Adhkār
  filter never appeared and "60" was simply the cap.
- **Root cause:** `searchText(index, query, 60)` scores every item but keeps
  only the top 60; the summary and the per-filter counts were computed from
  that truncated list, so lower-ranked types were crowded out entirely.
- **Fix:** rank every match (`Infinity`), report the true total and true
  per-filter counts, and render 60 at a time with a "Show more (N more)"
  button (reset on a new query or filter).
- **Verification:** live: "All 152 · Quran 146 · Adhkār 6 · 152 results for
  “mercy”", 60 links, "Show more (92 more)".
- **Regression test:** [SearchView.test.tsx](../../apps/web/src/components/SearchView.test.tsx)
  (75 matches → count 75, 60 shown, Show more reveals all; fails on the old code).

### 2. Collection "Delete" buttons were indistinguishable to screen readers — FIXED

- **Where:** [CollectionsView.tsx](../../apps/web/src/components/CollectionsView.tsx)
- **Symptom:** with several collections, each header had a bare "Delete".
- **Fix:** `aria-label="Delete collection <name>"` (the confirm dialog already
  named it).

## Investigated, no bug found

- Save → new collection: the name is trimmed ("  Favourites  " → "Favourites"),
  the āyah is added, the button flips to "Saved"; Bookmarks lists it with a
  "Remove 112:1" control and "Open in reader".
- Link crawl: all 166 distinct internal links on Today, More, Learn, Prayer,
  Quran, Tools, Settings, Profile, Blog and Kids return 200.

## Verification

- Web `tsc` clean; prettier clean; new SearchView test passes.

## Verdict

2 real bugs found and fixed. Clean streak: 0/3.
