# Manual E2E QA — Round 121 (2026-11-24)

Iteration 53/100. Area: tap-target size at phone width — every button, link and
field on 20 routes measured at 375px against WCAG 2.5.8 (24×24 minimum).

## Findings

### 1. Five kinds of controls were smaller than 24px — FIXED

- **Duʿā "read in context" links** (my round 79) — 21px tall → `padding: 4px 0`.
- **Search "Clear search"** — an 18×18 icon button → 32×32 (padding, negative margin
  so the layout doesn't move).
- **Prayer-times reminder bells** — 18×18 → 32×32, same way (mobile was fixed in
  an earlier loop).
- **Bookmarks "Open in reader →"** — 17px tall → 25px.
- **Text fields in pills** (top-bar search, Search, Hadith, Zakat) — the
  `<input>` was a 21–23px line inside a 44–56px pill; tapping the rest of the
  pill did nothing. `.noor-field input { align-self: stretch }` makes the whole
  pill the field.
- **Where:** `DuasView.tsx`, `SearchView.tsx`, `PrayerTimesView.tsx`,
  `CollectionsView.tsx`, `globals.css`.
- **Verification:** re-measured live on the six affected routes: no control
  under 24px. (The skip link measures 32×16 only while visually hidden.)
- **Regression test:** `focus-ring.test.ts` now also asserts the pill-input
  stretch rule; layout sizes can't be measured in jsdom.

## Verification

Affected tests pass; ESLint clean.

## Verdict

One real accessibility bug class (five controls), fixed.
