# Manual E2E QA — Round 129 (2026-11-24)

Iteration 61/100. Area: the browser extension's popup links into the web app,
and the branch housekeeping found while preparing a production build.

## Findings

None in the app this round.

## Housekeeping (not an app bug)

While checking out the branch in the verify worktree, `qa-loop-100` turned out
to still point at its starting commit: 16 seconds after this loop created it
(13:12:51), something outside the loop ran `checkout main` + `pull origin main`,
so iterations 1–60 were committed on local `main`. Fixed by moving the pointers
only — `qa-loop-100` → the latest commit, `main` → `origin/main` (= 0560ac4).
No commit was lost or rewritten; nothing was pushed.

## Investigated, no bug found

- Extension links: reader `/surah/N#N:A` (handled by the reader's hash scroll),
  Listen `/listen/N#A` (ListenClient reads a bare āyah number from the hash),
  home and settings — all match the web app's routes.
- Extension sync uses the bundled `/editions` list, so its `fetchVerse` gets a
  translation (round 105's compatibility check).

## Verification

No code changes.

## Verdict

Clean.
