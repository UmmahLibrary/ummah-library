/**
 * Gentle consistency (ADR 0041). Pure rules for how the app talks about a
 * reader's habit without loss framing: "days this week" instead of an unbroken
 * chain, a welcome back after a gap (never a count of missed days), the one
 * thing Home should offer next, and the 30-juz khatm journey.
 *
 * Deterministic: today's date and the current time are always passed in.
 */
import { JUZ_STARTS, TOTAL_JUZ, TOTAL_PAGES_MADANI, pageNumberOf } from "./quran-structure";

/** `YYYY-MM-DD` arithmetic in UTC, so it never drifts with daylight saving. */
function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface DayMark {
  date: string;
  active: boolean;
  isToday: boolean;
}

/** The last seven days ending today, oldest first, each marked read / not read. */
export function lastSevenDays(activeDates: Iterable<string>, today: string): DayMark[] {
  const set = new Set(activeDates);
  return Array.from({ length: 7 }, (_, i) => {
    const date = shift(today, i - 6);
    return { date, active: set.has(date), isToday: i === 6 };
  });
}

/** How many of the last seven days had any reading or listening. */
export function daysThisWeek(activeDates: Iterable<string>, today: string): number {
  return lastSevenDays(activeDates, today).filter((d) => d.active).length;
}

/** Whole days since the most recent active day before today (0 = read today). */
export function daysSinceLastActive(activeDates: Iterable<string>, today: string): number | null {
  let latest: string | null = null;
  for (const d of activeDates) if (d <= today && (latest === null || d > latest)) latest = d;
  if (latest === null) return null;
  const ms = new Date(`${today}T00:00:00Z`).getTime() - new Date(`${latest}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export interface ResumePoint {
  sura: number;
  aya: number;
}

export type HomeAction =
  /** First visit: offer a gentle start. */
  | { kind: "start" }
  /** A reading is in progress; `welcomeBack` after a gap of 2+ days. */
  | { kind: "continue"; at: ResumePoint; welcomeBack: boolean }
  /** Today's portion is done: say so and let the reader stop. */
  | { kind: "done"; at: ResumePoint | null };

/**
 * The single card Home leads with. Never mentions missed days: after a gap the
 * reader is simply welcomed back to where they left off.
 */
export function homeAction(input: {
  resume: ResumePoint | null;
  activeDates: Iterable<string>;
  today: string;
  portionDone: boolean;
}): HomeAction {
  const { resume, today, portionDone } = input;
  const dates = Array.from(input.activeDates);
  if (!resume && dates.length === 0) return { kind: "start" };
  if (portionDone) return { kind: "done", at: resume };
  if (!resume) return { kind: "start" };
  const gap = daysSinceLastActive(
    dates.filter((d) => d < today),
    today,
  );
  return { kind: "continue", at: resume, welcomeBack: gap !== null && gap >= 2 };
}

/** True when a prayer starts within `withinMinutes` of `now` (for the slim banner). */
export function prayerIsNear(at: Date, now: Date, withinMinutes = 20): boolean {
  const diff = at.getTime() - now.getTime();
  return diff >= 0 && diff <= withinMinutes * 60_000;
}

export type JuzState = "done" | "now" | "todo";

/** First Madani page of each juz (1-based juz index → page). */
export const JUZ_START_PAGES: readonly number[] = JUZ_STARTS.map((v) => pageNumberOf(v));

/**
 * The 30-juz khatm journey from a Madani page cursor (the furthest page read in
 * the current khatm, 0 = not started): juz fully behind the cursor are done,
 * the one containing it is "now".
 */
export function khatmJourney(currentPage: number): JuzState[] {
  const page = Math.max(0, Math.min(TOTAL_PAGES_MADANI, Math.floor(currentPage)));
  return Array.from({ length: TOTAL_JUZ }, (_, i) => {
    const start = JUZ_START_PAGES[i]!;
    const end = i + 1 < TOTAL_JUZ ? JUZ_START_PAGES[i + 1]! - 1 : TOTAL_PAGES_MADANI;
    if (page >= end) return "done";
    if (page >= start) return "now";
    return "todo";
  });
}
