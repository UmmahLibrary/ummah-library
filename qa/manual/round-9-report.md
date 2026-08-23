# Manual E2E QA - Round 9 (2026-08-21)

Third round on the mobile app. After rounds 7-8 both turned up a bug that
had already been fixed on web but never mirrored to mobile, this round
deliberately spot-checked mobile's prayer-time display against the same
class of bug web hit before (commit `5820d26`,
"render prayer times in the location's timezone, not the device's").

## Findings

### 1. Prayer times rendered in the device's timezone, not the location's - FIXED

- **Where:** [apps/mobile/src/utils.ts](../../apps/mobile/src/utils.ts) (new
  `fmtPrayerTime`/`timeZoneFor`), and its three call sites —
  [apps/mobile/src/screens/HomeScreen.tsx](../../apps/mobile/src/screens/HomeScreen.tsx),
  [apps/mobile/src/screens/PrayerTimesScreen.tsx](../../apps/mobile/src/screens/PrayerTimesScreen.tsx),
  [apps/mobile/src/screens/RamadanScreen.tsx](../../apps/mobile/src/screens/RamadanScreen.tsx)
- **Symptom:** The device running this session is on `Asia/Dubai`
  (UTC+4). Mocked geolocation to London (51.5074, -0.1278) — a real
  scenario for a traveler or anyone whose device clock hasn't followed
  them — and the Prayer Times screen showed Dhuhr at **04:05 PM** and
  Maghrib at **11:11 PM**. London's actual Dhuhr/Maghrib that day are
  ~01:05 PM / ~08:11 PM (BST, UTC+1) — exactly 3 hours earlier, matching
  the Dubai-London UTC offset. The Home screen's "Next prayer" card showed
  the same 3-hour-shifted Maghrib time.
- **Root cause:** `fmtTime()` in `apps/mobile/src/utils.ts` called
  `d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })` with no
  `timeZone` — which falls back to the *device's* zone
  (`Intl.DateTimeFormat().resolvedOptions().timeZone`), not the zone of the
  coordinates the prayer time was computed for. This is the identical
  pattern already found and fixed on web in `apps/web/src/lib/prayer-time-format.ts`
  (commit `5820d26`) — but that fix lives in a web-only file; mobile's
  `fmtTime` was never touched and all three of its screens called it
  directly on the raw computed prayer instants.
- **Fix:** Added `tz-lookup` as a mobile dependency (already used by web for
  exactly this) and mirrored web's `fmtPrayerTime`/`timeZoneFor` functions
  in `utils.ts`: derive the location's IANA timezone offline from its
  coordinates and pass it to `toLocaleTimeString`, falling back to the
  device zone only when coordinates are unknown. `fmtTime` itself is left
  unchanged (matches web, which also keeps a separate plain `fmtTime` for
  non-prayer local-time display) since nothing else in the mobile app used
  it for a non-prayer purpose. `HomeScreen` and `RamadanScreen` didn't
  previously keep the fetched `Coordinates` object in state (only used it
  transiently inside the fetch closure); both now store it so the render
  path can pass it to `fmtPrayerTime`.
- **Verification:** `pnpm lint` (0 errors, 12 pre-existing warnings),
  `pnpm typecheck` (8/8), `pnpm test` (413/413 web, 105/105 mobile incl. 3
  new tests), `pnpm build` (clean). Live re-verification on the Expo web
  dev server with geolocation mocked to London: Dhuhr corrected to
  **01:05 PM**, Maghrib to **08:11 PM** on both the Prayer Times list and
  the Home screen's "Next prayer" card — a clean 3-hour shift matching the
  Dubai→London offset exactly.
- **Regression test:** [apps/mobile/src/utils.test.ts](../../apps/mobile/src/utils.test.ts) —
  new `fmtPrayerTime` suite: renders a fixed instant against known London
  coordinates and asserts it matches `Europe/London` wall-clock time (not
  the device's), falls back to device time when coordinates are
  `null`/unknown, and dashes an invalid/empty instant instead of throwing.
  Confirmed to fail on the pre-fix `utils.ts` (via `git stash` — the import
  itself fails since `fmtPrayerTime` doesn't exist yet) and pass after.
  Unlike the mobile screen-level fixes in rounds 7-8, this fix lives in
  `utils.ts`, which already has a proper Vitest unit-test harness (pure
  Node-environment logic, no component rendering needed), so a real
  fail-before/pass-after regression test was possible here.

## Investigated, no bug found

- **Prior fixes re-verified across a full dev-server restart:** the round
  7 Zakat reset fix and round 8 Hifz plural fix both still held correctly
  after stopping and restarting the Expo dev server (picking up the
  `tz-lookup` dependency addition), confirming they weren't accidentally
  reverted by this round's changes.
- **Location-permission mocking in this environment:** `expo-location`'s
  web implementation checks `navigator.permissions.query({name:
  "geolocation"})` before calling `getCurrentPosition`, and this automation
  browser reports that as `denied` by default — overriding
  `getCurrentPosition` alone wasn't enough to reproduce the bug; also had
  to stub `navigator.permissions.query` to report `"granted"` for
  geolocation. Noted here since it'll be needed again for any future round
  that needs to simulate a location on this app.

## Verification

- `pnpm lint` — 0 errors, 12 pre-existing warnings (unrelated).
- `pnpm typecheck` — clean (8/8).
- `pnpm test` — 413/413 passed for web (incl. 2 new files from round 8),
  105/105 for mobile (incl. 3 new tests this round), clean everywhere else.
- `pnpm build` — clean.
- Live re-verification against the Expo web dev server with mocked
  geolocation, described above.

## Verdict

One real bug found and fixed this round (mobile prayer times ignoring the
location's timezone, mirroring an already-fixed web bug). Restarting the
3-in-a-row clean-streak count at zero; continuing to round 10.
