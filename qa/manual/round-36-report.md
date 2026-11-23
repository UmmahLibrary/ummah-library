# Manual E2E QA — Round 36 (2026-11-23)

Worship and progress screens in English: Prayer hub, Prayer Tracker, Hifz
dashboard and review, Profile ("Your journey") — checked against the product
rules PR #293 introduced (ADR 0041, "gentle consistency").

## Findings

### 1. Streak counters and fire emoji shown although streaks are opt-in — FIXED

- **Where:** [HifzDashboard.tsx](../../apps/web/src/components/HifzDashboard.tsx),
  [PrayerTracker.tsx](../../apps/web/src/components/PrayerTracker.tsx),
  [ProfileView.tsx](../../apps/web/src/components/ProfileView.tsx),
  mobile [ProfileScreen.tsx](../../apps/mobile/src/screens/ProfileScreen.tsx);
  new hook [use-show-streaks.ts](../../apps/web/src/lib/use-show-streaks.ts)
- **Symptom:** with Settings → "Show days in a row" off (the default), the web
  Hifz dashboard showed "— / Day streak" (and "N 🔥"), "Keep your streak alive
  — a few minutes is all it takes." and "Longest streak"; the Prayer Tracker
  showed "0 🔥 Day streak" and "Best streak"; Profile showed "0 🔥 Hifz streak",
  "Prayer streak" and four streak badges. Mobile Profile showed the streak
  counters too.
- **Root cause:** ADR 0041 §7 says "a day-streak count is opt-in … No fire
  emoji, loss copy … or reward counters", and Home, Reading Goals and the mobile
  Hifz screen honour `comfort.showStreaks` — but these screens predate the
  setting and never read it.
- **Fix:** following the mobile Hifz screen's existing pattern: by default the
  Hifz dashboard shows "N of 7 · Days this week" (from the review log), the
  streak stats, the longest-streak line and the streak badges/toasts are shown
  only when the reader opts in, and the fire emoji and "keep your streak alive"
  copy are gone in every case.
- **Verification:** live: Hifz shows "0 of 7", then "1 of 7" after a two-āyah
  review; Tracker shows "Prayed today" and "On time"; Profile shows 9
  non-streak achievements. Web and mobile `tsc` clean.
- **Regression tests:** [HifzDashboard.test.tsx](../../apps/web/src/components/HifzDashboard.test.tsx),
  [PrayerTracker.test.tsx](../../apps/web/src/components/PrayerTracker.test.tsx)
  (the old "4 🔥" assertion now opts in and reads "Days in a row"),
  [ProfileView.test.tsx](../../apps/web/src/components/ProfileView.test.tsx).

## Investigated, no bug found

- Hifz review: Reveal → Again/Hard/Good/Easy for each due āyah, "All caught
  up! 2 āyāt reviewed", review log written for today, queue shows "Tomorrow".
- "Āyāt memorized: 2" on Profile vs "0% memorized" on Hifz: both count tracked
  āyāt; 2 / 6,236 rounds to 0 %. Consistent.
- Prayer hub lists Prayer Times, Tracker, Qibla, Ramadan and Mosques.

## Verification

- Web and mobile `tsc --noEmit` clean; prettier clean; the four touched test
  files pass.

## Verdict

1 real bug (across five screens) found and fixed. Clean streak: 0/3.
