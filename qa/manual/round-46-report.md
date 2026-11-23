# Manual E2E QA — Round 46 (2026-11-23)

Listen mode (`/listen/[n]`) controls, and the Mushaf page view's ends.

## Findings

### 1. Listen page Previous/Next did nothing unless audio started — FIXED

- **Where:** [ListenClient.tsx](../../apps/web/src/components/ListenClient.tsx)
- **Symptom:** the shown āyah, "Āyah n" and `#n` only changed once the
  recitation actually began playing. Whenever it couldn't (offline without a
  download, a failed or blocked stream) Previous/Next looked dead, and on a
  slow connection they lagged by the buffering time.
- **Root cause:** the buttons only carry `data-play-key`; the audio engine
  moves the page via `onAyah`, which fires from `audio.play().then(...)`.
- **Fix:** the buttons also move the text immediately (`moveTo`), deferred with
  `setTimeout(0)` so the engine's document-level click handler still reads this
  click's `data-play-key` before the re-render changes it; the recitation
  follows when it can.
- **Verification:** live with audio: one real click on Next from Āyah 1 →
  "Āyah 2", and the playing highlight is `114:2` (not 3).
- **Regression test:** [ListenClient.test.tsx](../../apps/web/src/components/ListenClient.test.tsx)
  — with no playable recitation, Next/Previous step 1→2→3→2, update the hash
  and disable at the ends (fails on the old code).

## Investigated, no bug found

- Listen controls: Previous disabled on āyah 1, Next disabled on the last, "Play
  this āyah", link to the previous surah, a Read link back to the reader at the
  same āyah, and the Today link.
- Mushaf view: `/page/1` links only to page 2 and `/page/604` only to page 603;
  out-of-range pages 404 (round 34).

## Verification

- Web `tsc` clean; prettier clean; new test passes.

## Verdict

1 real bug found and fixed. Clean streak: 0/3 (reset).
