/**
 * Prayer-tracking domain: a local log of which of the five obligatory prayers
 * were prayed each day, and on time or late. Pure and deterministic — dates are
 * plain YYYY-MM-DD strings and "today" is injected (never read from the clock).
 * The web persists the log locally (ADR 0006, 0020); these helpers only compute
 * over it. Fasting is a separate domain and intentionally not modelled here.
 */

import { OBLIGATORY_PRAYERS, type PrayerName } from "./prayer";
import { addDays, computeStreak, daysBetween } from "./reading-goals";

/** Whether a prayer was prayed on time, late, or not (yet) — `none`. */
export type PrayerStatus = "none" | "ontime" | "late";

/** A single day's log; an absent prayer is `none`. */
export type PrayerDayLog = Partial<Record<PrayerName, PrayerStatus>>;

/** The whole tracker log, keyed by local date (YYYY-MM-DD). */
export type PrayerTrackerLog = Record<string, PrayerDayLog>;

/**
 * Tap order for a prayer button: not logged → on time → late → not logged. On
 * time comes first because it's the common case (one tap to log a prayer).
 */
export const PRAYER_STATUS_CYCLE: readonly PrayerStatus[] = ["none", "ontime", "late"];

/** The next status when the user taps a prayer. */
export function nextPrayerStatus(status: PrayerStatus): PrayerStatus {
  const i = PRAYER_STATUS_CYCLE.indexOf(status);
  return PRAYER_STATUS_CYCLE[(i + 1) % PRAYER_STATUS_CYCLE.length] ?? "none";
}

/** A prayer's status on a given day (`none` when not logged). */
export function statusFor(day: PrayerDayLog | undefined, prayer: PrayerName): PrayerStatus {
  return day?.[prayer] ?? "none";
}

/** How many of the five obligatory prayers are logged (on time or late) that day. */
export function prayedCount(day: PrayerDayLog | undefined): number {
  return OBLIGATORY_PRAYERS.reduce((n, p) => (statusFor(day, p) === "none" ? n : n + 1), 0);
}

/** A day "counts" for the streak when all five obligatory prayers are logged. */
export function isComplete(day: PrayerDayLog | undefined): boolean {
  return prayedCount(day) === OBLIGATORY_PRAYERS.length;
}

/** Dates whose day is complete (all five logged), in no particular order. */
export function completeDates(log: PrayerTrackerLog): string[] {
  return Object.keys(log).filter((date) => isComplete(log[date]));
}

/**
 * Current run of consecutive complete days ending today (or yesterday — a grace
 * day so an in-progress today doesn't break it). Reuses the reading-streak math.
 */
export function prayerStreak(log: PrayerTrackerLog, today: string): number {
  return computeStreak(completeDates(log), today);
}

/** The longest run of consecutive complete days anywhere in the log. */
export function longestStreak(log: PrayerTrackerLog): number {
  const dates = completeDates(log).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of dates) {
    run = prev !== null && daysBetween(prev, date) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = date;
  }
  return best;
}

/**
 * Share of prayed prayers (on time or late) that were on time, over the last
 * `windowDays` ending today, as a 0–100 integer. `0` when nothing was logged.
 */
export function onTimeRate(log: PrayerTrackerLog, today: string, windowDays = 30): number {
  let prayed = 0;
  let ontime = 0;
  for (let i = 0; i < windowDays; i++) {
    const day = log[addDays(today, -i)];
    for (const p of OBLIGATORY_PRAYERS) {
      const s = statusFor(day, p);
      if (s === "none") continue;
      prayed++;
      if (s === "ontime") ontime++;
    }
  }
  return prayed === 0 ? 0 : Math.round((ontime / prayed) * 100);
}

/** One day in the recent grid: its date and the five statuses in prayer order. */
export interface TrackedDay {
  date: string;
  statuses: PrayerStatus[];
}

/** The most recent `count` days, oldest → newest, for the history grid. */
export function recentDays(log: PrayerTrackerLog, today: string, count = 7): TrackedDay[] {
  const out: TrackedDay[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const day = log[date];
    out.push({ date, statuses: OBLIGATORY_PRAYERS.map((p) => statusFor(day, p)) });
  }
  return out;
}

/**
 * Return a new log with one prayer's status set for a date. Setting `none`
 * removes it, and an emptied day is dropped — so the log only holds real data.
 */
export function setPrayerStatus(
  log: PrayerTrackerLog,
  date: string,
  prayer: PrayerName,
  status: PrayerStatus,
): PrayerTrackerLog {
  const day: PrayerDayLog = { ...(log[date] ?? {}) };
  if (status === "none") delete day[prayer];
  else day[prayer] = status;

  const next: PrayerTrackerLog = { ...log };
  if (Object.keys(day).length === 0) delete next[date];
  else next[date] = day;
  return next;
}
