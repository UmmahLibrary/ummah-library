# Manual E2E QA — Round 2 (2026-08-21)

Areas not yet exercised in round 1: full-text search (Quran + filters), hadith search
with collection/grade filters, tafsir edition switching, 99 Names marking + Profile
aggregation, mobile-viewport (375px) layout on newly-touched pages, and a
re-verification of the two previously-fixed high-severity bugs (qada rapid-click race,
prayer-time timezone) under this round's browser session.

## Findings

None this round.

## Investigated, no bug found

- **Search (`/search`):** "mercy" → 60 results, matches the count from the earlier QA
  pass; result tabs ("All"/"Quran") reflect per-source counts correctly.
- **Hadith search + filters (`/hadith`):** "intentions" → 34 results; narrowing to
  collection **Muslim** → 2; adding grade **Ḍaʿīf** on top → 0, with the correct
  "No hadith found" empty state. Book and grade filters compose as an AND correctly.
- **Tafsir edition switching (`/tafsir`):** switching to "Tafsir Ibn Kathir (abridged)"
  correctly re-fetches and renders that edition's commentary for the current ayah.
- **99 Names (`/names`) → Profile aggregation:** marked 2 non-adjacent names (#2, #8);
  "2 / 99 marked" on the page and "2/99 Names learned" on `/profile` agree.
- **Qada rapid-click race (previously fixed, `55adba5`):** re-clicked "Record a missed
  Fajr" 3× in immediate succession — `ul.qada` correctly recorded `{ fajr: 3 }`, no
  regression of the earlier read-modify-write race fix.
- **Prayer Times page:** loads cleanly with no location set, correct "Use my location"
  prompt state; no console errors.
- **Responsive (375px):** no horizontal overflow on `/hadith` or `/downloads`
  (`document.body.scrollWidth === window.innerWidth` on both); the sidebar correctly
  collapses to the bottom tab bar with a working "More — settings & tools" link.
- **`/tools` page title:** still shows the generic "Ummah Library" instead of a
  page-specific title — this is the same pre-existing, already-documented observation
  from the first QA report (not a regression, not newly introduced).
- **A tooling false alarm, noted for the record:** partway through this round the
  Browser pane's `computer` (click/screenshot) actions started timing out with
  "the Browser pane is not displayed" / `document.hidden === true`. This is a display-
  attachment state of the automation session itself, not an app bug — confirmed the
  page was fully functional throughout via `javascript_tool`-dispatched clicks and
  `read_page`/`get_page_text`, which don't require compositing. Switched to
  JS-dispatched clicks for the remainder of this round once this was identified.
- A `read_console_messages` check briefly showed the same `.next` `MODULE_NOT_FOUND`
  error from round 1's build/dev-server conflict — confirmed via `preview_logs` (the
  actual dev-server process log) that this was a **stale buffered message** from
  before that incident was resolved, not a fresh recurrence; the live server log
  showed a clean, uninterrupted compile/request sequence with no errors.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was needed beyond
  round 1's (which remains green: lint 0 errors, typecheck clean, 408/408 tests,
  clean build).
- All checks above were live re-verifications against the running dev server.

## Verdict

Zero new bugs found this round — clean round 1 of the 3-in-a-row stop condition.
Continuing to round 3.
