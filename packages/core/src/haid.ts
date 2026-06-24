/**
 * Ḥayḍ (menstruation) pause domain: date ranges during which prayer tracking is
 * paused. Paused days don't count as "missed", don't break the streak, and the
 * prayers in them are **not** owed as qaḍāʾ — per fiqh, menstrual-missed prayers
 * are not made up (missed *fasts* are a separate, later concern; see #138).
 *
 * Pure and deterministic — dates are plain YYYY-MM-DD strings and "today" is
 * injected, never read from the clock. Persisted locally behind the `HaidStore`
 * port (ADR 0006, 0024, 0031). A separate domain from the daily prayer log, so
 * adding it cannot regress the existing tracker (`prayer-tracker.ts`).
 */

import { addDays, daysBetween } from "./reading-goals";
import { completeDates, type PrayerTrackerLog } from "./prayer-tracker";

/** One pause period, inclusive of both ends. `end` undefined ⇒ still ongoing. */
export interface HaidPeriod {
  /** First paused day, YYYY-MM-DD (inclusive). */
  start: string;
  /** Last paused day, YYYY-MM-DD (inclusive); undefined while the pause is open. */
  end?: string;
}

/** All pause periods, kept sorted by `start` (oldest → newest). */
export type HaidLog = HaidPeriod[];

const byStart = (a: HaidPeriod, b: HaidPeriod): number =>
  a.start < b.start ? -1 : a.start > b.start ? 1 : 0;

/** Whether `date` (YYYY-MM-DD) falls within any pause period. */
export function isDatePaused(log: HaidLog, date: string): boolean {
  return log.some((p) => date >= p.start && (p.end === undefined || date <= p.end));
}

/** The single ongoing (open-ended) period, or `undefined` if none is active. */
export function currentPeriod(log: HaidLog): HaidPeriod | undefined {
  return log.find((p) => p.end === undefined);
}

/** Inclusive length of a period in days, measured to `asOf` while it is open. */
export function periodLength(period: HaidPeriod, asOf: string): number {
  const end = period.end ?? asOf;
  const days = daysBetween(period.start, end) + 1;
  // Math.max(1, NaN) is NaN, so a corrupt/foreign date string would break the
  // documented "never below 1" guarantee — clamp non-finite results explicitly.
  return Number.isFinite(days) ? Math.max(1, days) : 1;
}

/**
 * Begin a pause on `date`. No-op if a pause is already ongoing or `date` already
 * sits inside a recorded period — so the log holds at most one open period and
 * never overlaps.
 */
export function startPause(log: HaidLog, date: string): HaidLog {
  if (currentPeriod(log) || isDatePaused(log, date)) return log;
  return [...log, { start: date }].sort(byStart);
}

/**
 * Close the ongoing pause on `date` (inclusive). No-op if no pause is open. An
 * `end` earlier than the start collapses to a single-day period.
 */
export function endPause(log: HaidLog, date: string): HaidLog {
  const open = currentPeriod(log);
  if (!open) return log;
  const end = date < open.start ? open.start : date;
  return log.map((p) => (p === open ? { ...p, end } : p));
}

/** One-tap toggle: end the ongoing pause, or start one today. */
export function togglePauseToday(log: HaidLog, today: string): HaidLog {
  return currentPeriod(log) ? endPause(log, today) : startPause(log, today);
}

/** Whether every day strictly between `a` and `b` is paused (a bridged gap). */
function bridged(a: string, b: string, paused: (date: string) => boolean): boolean {
  for (let d = addDays(a, 1); d < b; d = addDays(d, 1)) {
    if (!paused(d)) return false;
  }
  return true;
}

/**
 * Consecutive active days ending today, walking backwards. Paused days are
 * transparent — they neither extend nor break the run — so a streak survives a
 * pause. A non-active, non-paused day ends the run. Today is a grace day: if it
 * is neither active nor paused, the count starts from yesterday.
 */
export function streakWithPauses(
  activeDates: Iterable<string>,
  paused: (date: string) => boolean,
  today: string,
): number {
  const set = new Set(activeDates);
  let cursor = !set.has(today) && !paused(today) ? addDays(today, -1) : today;
  let streak = 0;
  for (;;) {
    if (paused(cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!set.has(cursor)) return streak;
    streak++;
    cursor = addDays(cursor, -1);
  }
}

/** The current prayer streak (complete days), preserved across ḥayḍ pauses. */
export function prayerStreakWithPause(
  log: PrayerTrackerLog,
  haid: HaidLog,
  today: string,
): number {
  return streakWithPauses(completeDates(log), (d) => isDatePaused(haid, d), today);
}

/** The longest prayer streak ever, with fully-paused gaps bridging the run. */
export function longestPrayerStreakWithPause(log: PrayerTrackerLog, haid: HaidLog): number {
  const dates = completeDates(log).sort();
  const paused = (d: string) => isDatePaused(haid, d);
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of dates) {
    run = prev !== null && bridged(prev, date, paused) ? run + 1 : 1;
    if (run > best) best = run;
    prev = date;
  }
  return best;
}
