/**
 * Reading-habit domain: streaks, daily-goal progress and khatma pacing. Pure
 * and deterministic — dates are plain YYYY-MM-DD strings and "today" is injected
 * (never read from the clock here). The web persists the data locally (ADR
 * 0006); these helpers just compute over it.
 */

export interface KhatmaPlan {
  /** Pages in the mushaf being completed (Madani = 604). */
  totalPages: number;
  /** Pages completed so far (0…totalPages). */
  currentPage: number;
  /** Date to finish by, YYYY-MM-DD. */
  targetDate: string;
}

/** Whole days from `from` to `to` (YYYY-MM-DD); negative if `to` precedes `from`. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** A YYYY-MM-DD date shifted by `n` days. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Current streak length in days. The streak is alive if there was activity
 * today or yesterday (a grace day so it doesn't "break" before the day ends),
 * and counts back over consecutive active days.
 */
export function computeStreak(activeDates: Iterable<string>, today: string): number {
  const set = new Set(activeDates);
  if (set.size === 0) return 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Pages per day needed to finish the khatma by its target date (inclusive of today). */
export function khatmaDailyTarget(plan: KhatmaPlan, today: string): number {
  const pagesLeft = Math.max(0, plan.totalPages - plan.currentPage);
  if (pagesLeft === 0) return 0;
  const daysLeft = Math.max(1, daysBetween(today, plan.targetDate) + 1);
  return Math.ceil(pagesLeft / daysLeft);
}

/** Completion fraction, clamped to 0…1. */
export function progressFraction(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, done / total));
}

/** Whether a day's amount meets the goal target. */
export function goalMet(done: number, target: number): boolean {
  return target > 0 && done >= target;
}
