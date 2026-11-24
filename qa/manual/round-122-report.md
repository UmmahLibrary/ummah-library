# Manual E2E QA — Round 122 (2026-11-24)

Iteration 54/100. Area: round 121's tap-target sweep on the other 17 routes
(juzʾ and muṣḥaf readers, Listen, Kids, hubs, Qibla, Mosques, Ramaḍān, Hifz
review, blog, plan detail, Downloads, Privacy).

## Findings

### 1. More small targets: reader nav/back links, blog links, the RSS button squeezed to 16px — FIXED

- **Reader "← All juzʾ", "← Previous juzʾ/page", "← Home"** — ~23px lines →
  `display:inline-block; padding:4px 0` on `.reader-nav a, .back-link` (globals.css).
- **Blog RSS button** — designed 36×36 but **shrunk to 16px wide** by its flex
  row on phones; `flexShrink: 0` (and an explicit `aria-label`).
- **Code block "Copy"** 41×17, **blog footer "GitHub"/"Open the app"** 21px,
  **"← Back to all posts"** 22px, **plan "← All plans"** 17px — padded to ≥25px.
- **Where:** `globals.css`, `blog/BlogHeader.tsx`, `blog/BlogFooter.tsx`,
  `blog/CodeBlock.tsx`, `blog/SeriesNav.tsx`, `PlanDetailView.tsx`.
- **Verification:** re-measured live: no control under 24px on the five affected routes.

## Investigated, no bug found

Listen, Kids, hubs, Qibla, Mosques, Ramaḍān, Hifz review, Downloads, Privacy: all ≥ 24px.

## Verification

Blog + plans tests pass; `tsc`, ESLint clean.

## Verdict

One real accessibility bug class (eight controls), fixed.
