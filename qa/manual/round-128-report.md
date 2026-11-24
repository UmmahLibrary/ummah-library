# Manual E2E QA — Round 128 (2026-11-24)

Iteration 60/100. Area: browser console errors on the pages this loop changed.

## Findings

None this round.

## Investigated, no bug found

- The tab's accumulated console showed `isStrongRecoverySecret is not defined`
  (SyncSettings), `Cannot read properties of undefined (reading 'find')`
  (TafsirSample), a ChunkLoadError and some 404s. Each is from earlier in this
  session: hot-reloads caught between two halves of an edit (round 73's import
  added after its use, round 82's page prop added after the component), and the
  deliberate 404 probes of round 127. Fresh loads of `/settings`, `/tafsir` and
  `/calendar` log no errors.
- An iframe-based console hook proved unreliable (it attaches to the initial
  about:blank window, not the page's) — noted so it isn't reused.

## Verification

No code changes.

## Verdict

Clean.
