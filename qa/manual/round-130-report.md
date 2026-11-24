# Manual E2E QA — Round 130 (2026-11-24)

Iteration 62/100. Area: a live run of Settings → Erase all data after round 92's
change.

## Findings

None this round.

## Investigated, no bug found

Before: 26 `ul.*` keys including `ul.sync.node/enabled/meta/cursor`, and a
`ul-audio-v1` cache entry. After confirming: "Cleared 22 items. Reload to start
fresh."; **zero** `ul.*` keys left (sync bookkeeping included) and no caches at
all — the downloaded-audio store is gone, and the service worker's own caches
are not affected because the dev server doesn't run the worker.

## Verification

No code changes.

## Verdict

Clean.
