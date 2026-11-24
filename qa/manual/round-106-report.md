# Manual E2E QA — Round 106 (2026-11-24)

Iteration 38/100. Area: resume reading — Today's card after reading Yā-Sīn 12;
plus a repo-wide checkpoint.

## Findings

None this round.

## Investigated, no bug found

- Opening `/surah/36#36:12` stores `ul.lastRead {surah:36, aya:12, total:83}`;
  Today shows "Read a little more" → `/surah/36#36:12`, which lands with 36:12
  in view (319px from the top of a 768px viewport).
- Checkpoint: `pnpm typecheck` 8/8 packages; `pnpm lint` — 0 errors in the
  repository (the one error is the known untracked `.local/social/recitation/run.mjs`).

## Verification

No code changes.

## Verdict

Clean.
