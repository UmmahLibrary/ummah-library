# Manual E2E QA — Round 4 (2026-08-21)

Areas covered this round: Blog (post page, code-block copy, RSS feed), Nearby Mosques
(no-location state), Adhkār (per-category counters, cross-category shared-dhikr
tracking, Reset scope), browser back/forward history, and a deep-link-to-a-specific-
ayah check on the Surah reader.

## Findings

None this round.

## Investigated, no bug found

- **Blog:** post page renders correctly with code blocks (YAML/TEXT with "Copy"
  buttons — clicking one produced no console errors); `/blog/rss.xml` returns
  well-formed RSS XML with the correct title, link, and item.
- **Nearby Mosques:** correct no-location prompt state, matching the pattern used by
  Prayer Times and Qibla.
- **Adhkār — shared dhikr across categories:** marking the first item in "Morning"
  done, then switching to "Evening," showed that category's total as already `1/24`
  before tapping anything there. Traced to `ul.adhkar`'s stored counts (`{"me-1": 1}`)
  and the rendered content: the first dhikr in both categories is the literal same
  phrase ("Alḥamdulillahi waḥdah...", id `me-1`) — a dhikr genuinely recited both
  morning and evening in practice. Its completion is intentionally shared, not a
  cross-category bleed; every other item stayed independent. `resetSet()` in
  `AdhkarView.tsx` correctly scopes "Reset" to only the current category's item ids.
- **Browser back/forward navigation:** multi-step back navigation across `/mosques` →
  `/blog/rss.xml` (an earlier visit) resolved correctly with no stale content or
  broken state.
- **Deep link to a specific ayah** (`/surah/18#18:10`): scrolls the target ayah into
  view and applies the `ayah--current` highlight class, matching the "Open in reader"
  links used by Collections/Bookmarks.

## Verification

- No code changes this round, so no lint/typecheck/test/build re-run was needed beyond
  round 3's (which remains green: lint 0 errors, typecheck clean, 410/410 tests, clean
  build).
- All checks above were live re-verifications against the running dev server; the
  dev-server error log (`preview_logs`) was checked directly (rather than the
  browser tab's accumulated console buffer, which still carries stale entries from
  earlier rounds' resolved `.next`-corruption incident) and shows no errors.

## Verdict

Zero new bugs found this round — clean round 1 of the (restarted) 3-in-a-row stop
condition, following round 3's fix. Continuing to round 5.
