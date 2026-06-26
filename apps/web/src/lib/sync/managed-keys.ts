/**
 * The localStorage keys sync manages (#25, ADR 0033). These are the keys where
 * whole-value last-writer-wins is the *correct* semantic — single-value settings,
 * preferences, the last-read position, and the prayer/calendar configuration — so
 * the most recent change on any device simply wins.
 *
 * Deliberately EXCLUDED, pending v2 element-level merge (two devices edit different
 * entries concurrently, which whole-value LWW would clobber): `ul.collections`,
 * `ul.ayahNotes`, `ul.hifz`(+`.streak`), the prayer/qada/haid/ramadan logs, the
 * reading-goal logs and active plan, the tasbih/adhkar counters, `ul.asmaLearned`,
 * `ul.badges`, and `ul.searchHistory`. Also excluded: the sync sidecar itself
 * (`ul.sync.*` — it must never sync), device-local flags (`ul.onboarded`), and the
 * per-page scroll offsets (sessionStorage). Notification preferences are held back
 * too, since scheduling is per-device.
 *
 * `ul.bookmarks` is included as a v1 list: concurrent adds on two offline devices
 * can still lose one until element-merge lands — an accepted v1 limitation.
 */
export const MANAGED_KEYS: readonly string[] = [
  // Saved library (v1 list)
  "ul.bookmarks",
  // Reader preferences
  "ul.editions",
  "ul.readingMode",
  "ul.readingTranslation",
  "ul.tafsir",
  "ul.reciter",
  "ul.scale",
  "ul.wbw",
  "ul.transliteration",
  "ul.wbwTranslit",
  "ul.tapToHear",
  "ul.script",
  "ul.loop",
  // Last-read position — "continue where you left off" across devices
  "ul.lastRead",
  // Theme
  "ul.theme",
  // Calendar + prayer-times configuration
  "ul.hijriAdjust",
  "ul.prayerMethod",
  "ul.prayerMadhab",
  "ul.prayerHighLat",
  "ul.prayerCoords",
];
