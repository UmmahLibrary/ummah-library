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
 * Theme is special-cased: there's no theme "event", so we re-apply it directly.
 * Keys with no live listener today (bookmarks, notes, prayer settings, …) map to
 * `[]` — they reflect on the next read/navigation, exactly as before. A test guards
 * that every managed key has an entry here, so adding one forces a conscious choice.
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
  // No live listener today → reflects on the next read/navigation:
  "ul.bookmarks": [],
  "ul.ayahNotes": [],
  "ul.asmaLearned": [],
  "ul.badges": [],
  "ul.lastRead": [],
  "ul.scale": [],
  "ul.readingMode": [],
  "ul.loop": [],
  "ul.prayerMethod": [],
  "ul.prayerMadhab": [],
  "ul.prayerHighLat": [],
  "ul.prayerCoords": [],
};

/** Apply the in-app effect of a synced key changing: re-apply the theme, or fire the feature re-read events. */
export function refreshForKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key === "ul.theme") {
    applyTheme(normalizeTheme(getItem("ul.theme")));
    return;
  }
  for (const event of REFRESH_EVENTS[key] ?? []) {
    window.dispatchEvent(new CustomEvent(event));
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
