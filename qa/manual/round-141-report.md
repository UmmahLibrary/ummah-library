# Manual E2E QA — Round 141 (2026-11-24)

Iteration 73/100. Area: install and icon assets — everything the web manifest
and `<head>` point at, plus the paths clients request by convention.

## Findings

### 1. `/favicon.ico` was a 404 — FIXED

- **Where:** new `apps/web/src/app/favicon.ico`
- **Symptom:** the SVG/PNG icons in `<head>` are fine, but browsers (on some
  paths and in history/bookmark UIs), feed readers and crawlers request
  `/favicon.ico` regardless — every one 404'd.
- **Fix:** a 16/32/48px `.ico` generated from the existing 192px app icon (the
  same Khatam artwork), served by Next's file convention as `image/x-icon`.
- **Regression test:** `app/metadata.test.ts` "ships app/favicon.ico".

## Investigated, no bug found

Manifest icons 192/512/maskable-512, `icon.svg`, `apple-icon-180.png`,
`/opengraph-image`, `/twitter-image` and `/offline` all 200 with the right type.

## Verification

Metadata tests pass; `curl /favicon.ico` → 200 `image/x-icon`.

## Verdict

One real (small) bug, fixed.
