/**
 * Adhkar (remembrances) domain — the occasion catalogue and the pure counter
 * logic for a dhikr session. The text itself is bundled content (ingested from
 * Ḥiṣn al-Muslim, see docs/adr/0016-adhkar.md); everything here is deterministic
 * and unit-tested. No I/O, no framework.
 */

import type { AdhkarOccasion, Dhikr } from "./entities";
import type { PrayerTimings } from "./prayer";

export interface AdhkarOccasionInfo {
  id: AdhkarOccasion;
  /** English label. */
  label: string;
  /** Arabic label. */
  arabic: string;
}

/**
 * Every adhkar set, in the order they're presented (ADR 0016 §"Scope": morning
 * and evening shipped first; the rest of the Ḥiṣn al-Muslim sets were added by
 * growing the ingest, not the architecture — see #36).
 */
export const ADHKAR_OCCASIONS: readonly AdhkarOccasionInfo[] = [
  { id: "morning", label: "Morning", arabic: "أذكار الصباح" },
  { id: "evening", label: "Evening", arabic: "أذكار المساء" },
  { id: "after-salah", label: "After Prayer", arabic: "أذكار بعد الصلاة" },
  { id: "waking", label: "Waking", arabic: "أذكار الاستيقاظ" },
  { id: "sleep", label: "Sleep", arabic: "أذكار النوم" },
  { id: "home", label: "Home", arabic: "دعاء دخول وخروج المنزل" },
  { id: "travel", label: "Travel", arabic: "دعاء السفر" },
  { id: "eating", label: "Eating", arabic: "دعاء الطعام" },
  { id: "dressing", label: "Dressing", arabic: "دعاء اللباس" },
  { id: "distress", label: "Distress", arabic: "دعاء الهمّ والكرب" },
  { id: "daily", label: "Daily Life", arabic: "أذكار متفرقة" },
];

/**
 * The two occasions with a prayer-window-based reminder (ADR 0016/0017): morning
 * (Fajr→Dhuhr) and evening (ʿAṣr→Maghrib). The other Ḥiṣn al-Muslim sets (§36)
 * have no natural clock/prayer window to hang a reminder off, so they are
 * browsed on-demand only — this narrower type keeps the reminder look-up tables
 * exhaustive without forcing every occasion to define one.
 */
export type AdhkarReminderOccasion = "morning" | "evening";

/** The dhikrs for an occasion, in display order. */
export function filterByOccasion(items: readonly Dhikr[], occasion: AdhkarOccasion): Dhikr[] {
  return items.filter((d) => d.occasions.includes(occasion)).sort((a, b) => a.order - b.order);
}

/** The next tally after one tap — never past the recommended repeat count. */
export function nextTally(current: number, repeat: number): number {
  return Math.min(Math.max(0, current) + 1, repeat);
}

/** Whether a dhikr's recommended repetitions have been reached. */
export function isDhikrComplete(count: number, repeat: number): boolean {
  return count >= repeat;
}

export interface AdhkarProgress {
  completed: number;
  total: number;
}

/** How many dhikrs in a set have reached their repeat count, given tap tallies. */
export function sessionProgress(
  items: readonly Dhikr[],
  counts: Readonly<Record<string, number>>,
): AdhkarProgress {
  let completed = 0;
  for (const d of items) {
    if (isDhikrComplete(counts[d.id] ?? 0, d.repeat)) completed++;
  }
  return { completed, total: items.length };
}

export interface AdhkarReminderWindow {
  occasion: AdhkarReminderOccasion;
  /** ISO instant the window opens (a prayer time). */
  start: string;
  /** ISO instant it closes (the next prayer that bounds it). */
  end: string;
}

/**
 * The two daily reminder windows, derived from prayer timings: morning adhkar
 * run from **Fajr to Dhuhr**, evening adhkar from **ʿAṣr to Maghrib** — so a
 * reminder is wired off the prayer-times module, not a fixed clock time.
 */
export function adhkarReminderWindows(timings: PrayerTimings): AdhkarReminderWindow[] {
  return [
    { occasion: "morning", start: timings.fajr, end: timings.dhuhr },
    { occasion: "evening", start: timings.asr, end: timings.maghrib },
  ];
}

/** Which adhkar window `now` currently falls inside, or `null`. */
export function activeAdhkarReminder(
  timings: PrayerTimings,
  now: Date,
): AdhkarReminderOccasion | null {
  const t = now.getTime();
  for (const w of adhkarReminderWindows(timings)) {
    if (t >= Date.parse(w.start) && t < Date.parse(w.end)) return w.occasion;
  }
  return null;
}

/** The next reminder (a window's opening) at or after `now` among today's timings. */
export function nextAdhkarReminder(
  timings: PrayerTimings,
  now: Date,
): { occasion: AdhkarReminderOccasion; at: Date } | null {
  const t = now.getTime();
  const upcoming = adhkarReminderWindows(timings)
    .map((w) => ({ occasion: w.occasion, at: new Date(w.start) }))
    .filter((w) => w.at.getTime() >= t)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  return upcoming[0] ?? null;
}
