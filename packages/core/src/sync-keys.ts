/**
 * The `ul.*` keys sync manages (#25, ADR 0033) — the shared, platform-neutral
 * contract. Web, mobile, and the extension all sync exactly this set, so a key
 * lands under the same `cipher.entryId(...)` on every platform and the same
 * logical value merges across devices. (A key managed on one platform but not
 * another wouldn't crash — the engine skips ids it doesn't manage — but it would
 * silently fail to round-trip, so the list lives here, in `core`, not per-app.)
 *
 * These are the keys where whole-value last-writer-wins is the *correct* semantic
 * — single-value settings, preferences, the last-read position, and the
 * prayer/calendar configuration — so the most recent change on any device wins.
 *
 * Deliberately EXCLUDED, pending v2 element-level merge (two devices edit
 * different entries concurrently, which whole-value LWW would clobber):
 * `ul.collections`, `ul.ayahNotes`, `ul.hifz`(+`.streak`), the prayer/qada/haid/
 * ramadan logs, the reading-goal logs and active plan, the tasbih/adhkar counters,
 * `ul.asmaLearned`, `ul.badges`, and `ul.searchHistory`. Also excluded: the sync
 * sidecar itself (`ul.sync.*` — it must never sync), device-local flags
 * (`ul.onboarded`), and per-page scroll offsets. Notification preferences are held
 * back too, since scheduling is per-device.
 *
 * `ul.bookmarks` is included as a v1 list: concurrent adds on two offline devices
 * can still lose one until element-merge lands — an accepted v1 limitation.
 *
 * Several of the reader-preference toggles below (`ul.wbw`, `ul.transliteration`,
 * `ul.wbwTranslit`, `ul.tapToHear`, `ul.loop`) are web-only today; they stay in the
 * list so a future mobile/extension toggle inherits sync for free (a platform that
 * never sets them simply skips them — they're absent at the zero clock).
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
  // Element-merged collection/set keys (v2, ADR 0034 — Phase 1, bounded cardinality).
  // Each syncs per element via `sync-shapes.ts`, so concurrent edits to different
  // entries don't clobber. The date-keyed logs (prayer/reading/ramadan worship) are
  // Phase 2 and `ul.hifz` is Phase 3 (gated on the incremental-pull cursor).
  "ul.ayahNotes",
  "ul.collections",
  "ul.qada",
  "ul.haid",
  "ul.asmaLearned",
  "ul.ramadanFasts",
  "ul.badges",
  "ul.readingActive",
  // Phase 2 — date-keyed logs. prayerLog/ramadanWorship merge per (date, item) via
  // the nested shape, so marking different prayers/items on the same day converges.
  "ul.readingLog",
  "ul.prayerLog",
  "ul.ramadanWorship",
];
