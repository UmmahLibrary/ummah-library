# Manual E2E QA — Round 67 (2026-11-23)

Robustness against corrupted or legacy saved data on the production build.
Fifteen `ul.*` keys — including the settings added in PR #293 — were set to
malformed JSON, wrong types or unknown values, then 22 pages were loaded with
`error` and `unhandledrejection` listeners attached.

Seeded values: `ul.comfort` = `{not json`, `ul.locale` = `xx`, `ul.theme` =
`neon`, `ul.readingMode` = `sideways`, `ul.planReminder` = `[1,2]`,
`ul.readingLog` = `"str"`, `ul.readingActive` = `{"a":1}`, `ul.hifz` = `[]`,
`ul.hifz.reviewLog` = `null`, `ul.prayerCoords` = `{"latitude":"abc"}`,
`ul.lastRead` = `{"surah":999,"aya":-1}`, `ul.collections` = `{"x":1}`,
`ul.editions` = `42`, `ul.searchHistory` = `{}`.

## Findings

None this round.

## Investigated, no bug found

- No crash screen, uncaught error or unhandled rejection on Today, Al-Fātiḥah,
  Settings, Plans, Hifz, Goals, Profile, Search, Bookmarks, Prayer, Prayer
  Times, Qibla, Ramadan, Tracker, Listen, Kids; each rendered its `<h1>`.
- No `NaN`, `undefined`, `Infinity`, `null`, `[object …]` or "999" in the text
  of Today, Qibla, Prayer Times or Goals: the invalid location is treated as
  "no location yet" (Use my location), the invalid resume point falls back to
  a valid one, and the reading log reads as empty.
- The original saved data was restored afterwards.

## Verification

No code changes this round.

## Verdict

No bugs found. Clean streak: 2/3.
