# Manual E2E QA — Round 54 (2026-11-23)

Tried to exercise this loop's mobile changes (Profile streaks, Plans
confirmation and "Next" label) in the Expo web build, and compared Today
across web and mobile.

## Findings

None this round (see the open question below, which needs a product decision
rather than a code fix).

## Open question for the owner — Verse of the day differs between web and mobile

- **Web and the browser extension** use core's `verseOfDay(date)`, a
  deterministic pick across all 6,236 āyāt (today: 37:65).
- **Mobile** uses a hand-curated list of five āyāt in
  [apps/mobile/src/verses.ts](../../apps/mobile/src/verses.ts) rotated by day
  of year (today: 65:2).
- So the same person sees a different "Verse of the day" on phone and web,
  against ADR 0042's "one design across web and mobile". Which way to align
  is an editorial choice (a curated list needs scholarly care and is only five
  āyāt today; the full-Quran pick can land on āyāt that read oddly out of
  context), so it is left unchanged here.

## Investigated, no bug found

- **Expo web shows black interface text in the surah list** — an artifact of
  running the native app in a browser: Metro's web target resolves
  `packages/ui/ListRow.tsx` (the Next.js version, coloured by CSS variables the
  Expo web page never loads) instead of `ListRow.native.tsx`. The shipped
  Android app uses the themed native file. Not user-facing.
- Expo web keeps hidden stack screens in the DOM, so automated clicks landed
  on the wrong screen; mobile verification for this loop therefore rests on
  `tsc` (clean), the mobile test suite (25 files / 203 tests pass) and the
  catalogue test that checks every new string in all six languages.
- Port 8090 (the configured mobile-web port) is held by a WSL relay on this
  machine; a temporary local launcher on 8092 was used and not committed.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 1/3.
