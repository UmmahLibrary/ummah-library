# Manual E2E QA — Round 94 (2026-11-24)

Iteration 26/100. Area: the Hijri date adjustment — one setting, read by the
calendar, the top-bar date and the Ramaḍān page.

## Findings

None this round.

## Investigated, no bug found

On `/calendar`, +1 moves today from 13 to 14 Jumādā al-Ākhirah in the grid
(`aria-current` cell, round 75's label) **and** in the top bar at once, and
persists `ul.hijriAdjust = 1`; `/ramadan` then shows 14 Jumādā al-Ākhirah in
both places. Reset to 0 afterwards.

## Verification

No code changes.

## Verdict

Clean.
