# Manual E2E QA — Round 28 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the Downloads screen (Tools tab).

## Findings

### 1. Downloads screen showed stale/empty state after downloading audio from another screen - FIXED

- **Where:** [apps/mobile/src/screens/DownloadsScreen.tsx](../../apps/mobile/src/screens/DownloadsScreen.tsx)
- **Symptom:** Bottom-tab screens stay mounted in the background when you
  switch tabs (confirmed in earlier rounds). Reproduced: open the Tools tab,
  visit Downloads (correctly shows "Nothing downloaded yet"), switch to the
  Read tab, open a sūrah and download its audio (checkmark confirms the
  save succeeded), then switch back to the Tools tab. The already-mounted
  Downloads screen instance kept showing the stale "Nothing downloaded yet"
  empty state instead of the freshly-downloaded audio, because it only
  fetched from the audio store once via a mount-only `useEffect` — it never
  re-fetched on return-to-focus. A fresh push of the screen always showed
  correct data (the underlying `AudioStore`/persistence was fine); only an
  already-mounted instance went stale.
- **Root cause:** `useEffect(() => { refresh(); }, [])` — runs once on
  mount, not on every focus. Matches the established root cause pattern
  from prior rounds (see `PlansScreen.tsx`, already correct).
- **Fix:** Replaced the mount-only fetch with
  `useFocusEffect(refresh)` from `@react-navigation/native`, mirroring
  `PlansScreen.tsx`'s existing correct pattern. Kept the separate
  mount-only `useEffect` for surah names (cosmetic, API-backed, doesn't
  need to be focus-fresh).
- **Verification:** `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6`: reproduced the bug first (Downloads
  screen kept showing "Nothing downloaded yet" after downloading Al-Faatiha
  from the reader and switching tabs back), then re-tested after the fix —
  the already-mounted Downloads screen now correctly shows "1 download ·
  778 KB on this device" / "Al-Faatiha · Mishary Rashid Alafasy · 7/7 āyāt
  · 778 KB" immediately on switching back to the Tools tab, no remount
  needed.
- **Regression test:** None added — no test harness exists for mobile
  screen/navigation components in this repo (confirmed in round 23); the
  live re-verification above is the practical check available.

## Investigated, no bug found

- **Download button states** (`DownloadButton.tsx`): correctly cycles
  through the default icon → "Downloading N%" with a progress bar → "Saved
  for offline listening" checkmark, across a real download.
- **Downloads screen delete action**: confirmed reachable and calls
  `mobileAudioStore.removeSurah` followed by `refresh()`.

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above.

## Verdict

One real bug found and fixed this round (Downloads screen not refreshing
on focus, same root-cause class as round 25's reference pattern shows was
already handled correctly elsewhere). Restarting the 3-in-a-row
clean-streak count at zero.
