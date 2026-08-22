# Manual E2E QA — Round 29 (2026-08-22)

Continuation of native-Android testing on the `QA_Pixel6` emulator. This
round covered the Settings screen (theme/language, reciter/script/tafsir
pickers, and the Data section's export/import/erase flows).

## Findings

### 1. "Erase all data" silently doesn't apply until the app restarts, but never says so - FIXED

- **Where:** [apps/mobile/src/screens/SettingsScreen.tsx](../../apps/mobile/src/screens/SettingsScreen.tsx)
- **Symptom:** The confirmation dialog reads "This removes every bookmark,
  note, prayer log **and setting** on this device," and after confirming,
  the status line says only "Cleared N items." Reproduced: selected a
  non-default Arabic script (IndoPak), tapped Erase all, confirmed — the
  Arabic Script picker kept showing "IndoPak" selected on the still-open
  Settings screen, exactly as if nothing had happened. A user would
  reasonably conclude the erase failed for settings. The same applies to
  "Import a backup" — a restored theme/reciter/script doesn't show up on
  the already-open screen either.
- **Root cause:** `clearAllData()`/`importBackup()` write AsyncStorage
  directly (`backup-store.ts`'s `multiRemove`/`multiSet`), bypassing every
  feature's own setter (`SettingsContext`, `theme.tsx`, `LibraryContext`),
  so their in-memory React state never learns the underlying value changed.
  Confirmed via a controlled test: force-quitting and relaunching the app
  after an erase *did* show onboarding again and reset the theme and
  Arabic script to their defaults — proving the erase itself is correct
  and complete; only the already-open screen's live display is stale.
  I first tried wiring this screen's `onErase`/`onImport` to the existing
  `emitSyncApplied()` re-hydrate signal (built for the identical
  "AsyncStorage written directly, contexts don't know" problem in the sync
  engine — see `lib/sync/sync-events.ts`), but `SettingsContext`'s
  `loadPrefs()` only *overwrites* a field when the freshly-read value is
  present/valid (this is correct for a partial sync pull, so it doesn't
  clobber fields the remote update didn't touch) — after an erase every
  field reads back `null`, so `loadPrefs()` correctly does nothing, and the
  screen stays stale regardless. Making erase force a real reset-to-defaults
  would mean new event plumbing and default-reset logic across three
  providers, well past a same-round fix.
- **Fix:** Mirrored the web app's existing, deliberate handling of this same
  architectural gap — `apps/web/src/components/DataBackup.tsx`'s `onClear`
  already says "Cleared N items. **Reload to start fresh.**" — by making
  the confirmation dialog and both success messages honest that mobile
  needs a restart too: the dialog now ends with "Restart the app afterwards
  to see the reset fully applied," the erase status reads "Cleared N
  item(s). Restart the app to start fresh," and a successful import's
  message gets "Restart the app to see it fully applied." appended.
- **Verification:** `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6`: triggered Erase all with a non-default
  script selected — dialog and success message both show the new copy
  exactly as written; confirmed via a full app relaunch that the
  underlying erase was already correct (onboarding reappeared, theme and
  script reset to defaults).
- **Regression test:** None added — no test harness exists for mobile
  screen components in this repo (confirmed in round 23); the live
  re-verification above is the practical check available.

## Investigated, no bug found

- **Export my data**: opens the native Android share sheet with a
  correctly-named `ummah-library-backup-<date>.json` file; status message
  updates to "Backup ready — choose where to save it."
- **Theme swatches, font-size stepper, reciter picker**: all update and
  persist correctly (confirmed via app relaunch).
- **Tafsir edition "Tafsir Ibn Kathir (abridged)" staying selected through
  an erase+restart**: initially looked like the same live-refresh bug, but
  a clean restart confirmed it's simply the app's shipped default tafsir
  edition, not a leftover stale value — ruled out as a false lead.
- **Language switch (English/Urdu)**: `apps/mobile/src/i18n/messages.ts`
  is an explicitly-documented partial rollout (ADR 0040, "starter slice" —
  tab bar + Settings language section only); the rest of the Settings
  screen staying in English is by design, not a bug.
- **LogBox banner touch-interception** (carried over from round 28): traced
  its clickable region via `uiautomator` — `[26,2146][1054,2271]` overlaps
  only the top ~62px of the bottom tab bar's `[x,2209][x,2337]` buttons;
  tapping the tab bar's lower half (or the banner's own × button) reaches
  the app underneath reliably. Documented here as a testing-workflow note,
  not an app bug — the banner is RN's own dev-only LogBox.

## Verification

- Mobile: `pnpm lint` (0 errors), `pnpm typecheck` (clean),
  `pnpm --filter @ummahlibrary/mobile test` (105/105 passed). Live
  re-verification on `QA_Pixel6` as detailed above.

## Verdict

One real bug found and fixed this round (erase/import silently not
reflecting on an already-open Settings screen, with no indication a
restart is needed). Restarting the 3-in-a-row clean-streak count at zero.
