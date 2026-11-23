/**
 * Live in-app refresh after a sync round applies a remote value (#25, ADR 0033/0034).
 *
 * The sync state store writes `localStorage` and fires {@link SYNC_CHANGE_EVENT}
 * with the changed key — but feature components don't listen to *that*; they listen
 * to their own bespoke change events (which their write-paths fire, and which sync
 * bypasses by writing storage directly). This module is the single place that
 * translates a synced key into the event(s) those components already re-read on, so
 * a pulled change shows without a reload.
 *
 * Theme is special-cased: there's no theme "event" at all, so it's re-applied
 * directly to the document instead of going through `REFRESH_EVENTS`. Every
 * other managed key now has a live listener somewhere. `[]` is reserved for a
 * future key with none yet. A test guards that every managed key has an entry
 * here, so adding one forces a conscious choice.
 */
import { applyTheme, normalizeTheme } from "../themes";
import { getItem } from "./storage";
import { SYNC_CHANGE_EVENT } from "./web-sync-state-store";

/** Managed key → the feature event(s) whose listeners re-read it. `[]` ⇒ reflects on next navigation. */
export const REFRESH_EVENTS: Record<string, readonly string[]> = {
  // Trackers / collections — note several feature event names differ from the key.
  "ul.collections": ["ul.collections"],
  "ul.qada": ["ul.qada"],
  "ul.haid": ["ul.haid"],
  "ul.prayerLog": ["ul.prayerTracker"],
  "ul.readingLog": ["ul.reading"],
  "ul.readingActive": ["ul.reading"],
  "ul.ramadanFasts": ["ul.ramadan"],
  "ul.ramadanWorship": ["ul.ramadan"],
  // Reader preferences.
  "ul.editions": ["ul.editions"],
  "ul.tafsir": ["ul.tafsir"],
  "ul.readingTranslation": ["ul.readingTranslation"],
  "ul.reciter": ["ul.reciter"],
  "ul.wbw": ["ul.wbw"],
  "ul.transliteration": ["ul.transliteration"],
  "ul.wbwTranslit": ["ul.wbwTranslit"],
  "ul.tapToHear": ["ul.tapToHear"],
  "ul.script": ["ul.script"],
  // Calendar.
  "ul.hijriAdjust": ["ul.hijriAdjust"],
  // Theme — re-applied directly in refreshForKey (no event exists), so [] here.
  "ul.theme": [],
  "ul.bookmarks": ["ul.bookmarks"],
  "ul.hifz": ["ul.hifz"],
  // Notes share the collections view's own live event (CollectionsView listens
  // to both) — a note change re-reads the same way a collection change does.
  "ul.ayahNotes": ["ul.collections"],
  "ul.asmaLearned": ["ul.asmaLearned"],
  "ul.lastRead": ["ul.lastRead"],
  "ul.scale": ["ul.scale"],
  "ul.loop": ["ul.loop"],
  "ul.readingMode": ["ul.readingMode"],
  "ul.badges": ["ul.badges"],
  // Prayer settings — coords fan out to both the general event (timings/qibla,
  // cheap or self-caching) and the coords-specific one (gates the mosque
  // finder's network refetch so a method/madhab change doesn't trigger it).
  "ul.prayerMethod": ["ul.prayerSettings"],
  "ul.prayerMadhab": ["ul.prayerSettings"],
  "ul.prayerHighLat": ["ul.prayerSettings"],
  "ul.prayerCoords": ["ul.prayerSettings", "ul.prayerCoords"],
};

/**
 * Apply the in-app effect of a synced key changing: re-apply the theme, or fire
 * the feature re-read events. The synced key's own raw stored value rides along
 * as `detail` — some listeners (`ul.reciter`, `ul.tafsir`) were written for a
 * same-tab toolbar dispatch that always carries the new value as `detail` and
 * use it directly rather than re-reading storage; without it they silently no-op
 * (`detail` is `undefined`, which fails their "is this a known id" guard). A
 * listener that re-reads storage itself just ignores the extra field.
 */
export function refreshForKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key === "ul.theme") {
    applyTheme(normalizeTheme(getItem("ul.theme")));
    return;
  }
  const detail = getItem(key);
  for (const event of REFRESH_EVENTS[key] ?? []) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }
}

/** Listen for sync-applied changes and re-read the affected feature live. Returns an unsubscribe. */
export function wireSyncRefresh(): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = (e: Event): void => {
    const key = (e as CustomEvent<{ key?: string }>).detail?.key;
    if (typeof key === "string") refreshForKey(key);
  };
  window.addEventListener(SYNC_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(SYNC_CHANGE_EVENT, onChange);
}
