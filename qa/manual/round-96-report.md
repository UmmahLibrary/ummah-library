# Manual E2E QA — Round 96 (2026-11-24)

Iteration 28/100. Area: round 95's pattern elsewhere — grids whose meaning is
colour plus a hover `title`: the reading-plan "Your days" grid and the Hifz
review heatmap.

## Findings

### 1. Plan and Hifz heatmaps carried their data only in colour and hover titles — FIXED

- **Where:** [`PlanDetailView.tsx`](../../apps/web/src/components/PlanDetailView.tsx),
  [`HifzDashboard.tsx`](../../apps/web/src/components/HifzDashboard.tsx)
- **Symptom:** dozens of empty `<div>`s; `title` isn't announced by most screen
  readers and doesn't exist on touch. Nothing told a non-sighted reader how many
  plan days were done or missed, or how often they'd reviewed.
- **Fix:** each grid is one `role="img"` with a summary — "Day 12 of 30: 9 done,
  3 missed"; "Reviews over the last 84 days: 17 reviews on 6 days". (A per-cell
  label would mean 30–90 stops for one fact.)
- **Regression test:** `HifzDashboard.test.tsx` "gives the colour-only heatmap a spoken summary".

## Verification

HifzDashboard + PlansView tests 9/9; `tsc`, ESLint clean.

## Verdict

One real accessibility bug (two grids), fixed.
