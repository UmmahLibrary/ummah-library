# Manual E2E QA — Round 99 (2026-11-24)

Iteration 31/100. Area: page weight — what opening `/hadith` and `/search`
downloads.

## Findings

None this round.

## Investigated, no bug found

- `/hadith` background-fetches all six collections (Bukhārī 13.6 MB … Ibn Mājah
  6.2 MB raw JSON, ~56 MB before compression) so global search covers them. This
  is the recorded trade-off of ADR 0022 (one-time, client-side search); the
  routes are `force-static`, so in production they're CDN files with validators
  and compression, and repeat visits revalidate rather than re-download. The
  dev server doesn't compress, which is why the numbers look large here.
- Round 93 deliberately keeps these collections out of the service worker's API
  cache for the same reason.
- `/search` loads the 1.4 MB corpus plus names/adhkār — fine.

## Verification

No code changes.

## Verdict

Clean.
