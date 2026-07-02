/**
 * Sunnah (recommended) fasting days — the weekly Mondays & Thursdays and the
 * white days (Ayyām al-Bīḍ, 13–15 of each Hijri month) — resolved to their
 * upcoming Gregorian occurrences with a day countdown, plus the decision of when
 * to remind about the next one.
 *
 * Like the rest of `core` this is deterministic and clock-injected: the resolver
 * takes "today" as a {@link GregorianDate} and the reminder helper takes `now`
 * as a `Date` (see `hifz.ts`), so there is no I/O and no hidden `Date.now()`.
 * These are factual calendar markers (no interpretive content); the tabular
 * Hijri calendar can sit ±1 day from a local sighting, so every function threads
 * the same `adjustmentDays` offset the rest of the calendar uses (see `hijri.ts`).
 */

import type { GregorianDate, HijriDate } from "./hijri";
import { addGregorianDays, gregorianToHijri, gregorianWeekday, hijriToGregorian } from "./hijri";

/** Which kind of recommended fast a day is. */
export type SunnahFastKind = "monday" | "thursday" | "white-day";

/** A recommended fast resolved to its next Gregorian occurrence. */
export interface UpcomingSunnahFast {
  kind: SunnahFastKind;
  /** Short label shown to the reader, e.g. `"Monday fast"`. */
  name: string;
  /** One-line description. */
  note: string;
  /** The Hijri date it falls on. */
  hijri: HijriDate;
  /** Its Gregorian civil date. */
  gregorian: GregorianDate;
  /** Whole days from `today` to the fast (0 = today, 1 = tomorrow). */
  daysUntil: number;
}

const MONDAY = 1;
const THURSDAY = 4;
/** The white days — Ayyām al-Bīḍ — are the 13th, 14th and 15th of every Hijri month. */
const WHITE_DAYS = [13, 14, 15] as const;

/**
 * Proleptic Gregorian day number (a Julian Day Number) for a civil date — pure
 * integer arithmetic, no `Date`. Mirrors the conversion in `hijri.ts`/
 * `islamic-events.ts` so day differences are exact regardless of timezone.
 */
function dayNumber({ year, month, day }: GregorianDate): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

const dateKey = (g: GregorianDate): string => `${g.year}-${g.month}-${g.day}`;

/** The next `count` Gregorian dates (soonest first) whose weekday is `weekday`, from `today`. */
function nextWeekdays(today: GregorianDate, weekday: number, count: number): GregorianDate[] {
  const offset = (weekday - gregorianWeekday(today) + 7) % 7;
  return Array.from({ length: count }, (_, i) => addGregorianDays(today, offset + i * 7));
}

/**
 * The next `count` recommended fasts at or after `today`, soonest first, each
 * with the Gregorian date it next falls on and the days until then. A day that is
 * both a white day and a Monday/Thursday is listed once, as the white day (its
 * three-day observance takes precedence in the label).
 */
export function upcomingSunnahFasts(
  today: GregorianDate,
  count = 8,
  adjustmentDays = 0,
): UpcomingSunnahFast[] {
  const todayNum = dayNumber(today);
  const todayHijri = gregorianToHijri(today, adjustmentDays);

  // White days first so they win the de-dupe when they coincide with a Mon/Thu.
  const byDate = new Map<string, UpcomingSunnahFast>();
  const add = (fast: UpcomingSunnahFast): void => {
    if (fast.daysUntil >= 0 && !byDate.has(dateKey(fast.gregorian))) {
      byDate.set(dateKey(fast.gregorian), fast);
    }
  };

  // Ayyām al-Bīḍ for this Hijri month and the next two (enough to fill `count`).
  for (let k = 0; k < 3; k++) {
    let year = todayHijri.year;
    let month = todayHijri.month + k;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
    for (const day of WHITE_DAYS) {
      const gregorian = hijriToGregorian({ year, month, day }, adjustmentDays);
      add({
        kind: "white-day",
        name: "White Day (Ayyām al-Bīḍ)",
        note: "The 13th–15th of the Hijri month",
        hijri: { year, month, day },
        gregorian,
        daysUntil: dayNumber(gregorian) - todayNum,
      });
    }
  }

  // Weekly Mondays & Thursdays.
  const weekly: Array<[SunnahFastKind, number, string]> = [
    ["monday", MONDAY, "Monday fast"],
    ["thursday", THURSDAY, "Thursday fast"],
  ];
  for (const [kind, weekday, name] of weekly) {
    for (const gregorian of nextWeekdays(today, weekday, count)) {
      add({
        kind,
        name,
        note: "A recommended weekly fast",
        hijri: gregorianToHijri(gregorian, adjustmentDays),
        gregorian,
        daysUntil: dayNumber(gregorian) - todayNum,
      });
    }
  }

  return [...byDate.values()].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, Math.max(0, count));
}

/**
 * The next recommended fast to remind about and the instant to fire it — the
 * evening before at 20:00 local, so the reader has time to make the intention
 * and plan suhoor. Skips a fast whose evening-before has already passed (e.g. a
 * fast that is today), rolling forward to the next one. Pure: `now` is injected.
 */
export function nextSunnahFastReminder(
  now: Date,
  adjustmentDays = 0,
): { fast: UpcomingSunnahFast; at: Date } | null {
  const today: GregorianDate = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
  for (const fast of upcomingSunnahFasts(today, 8, adjustmentDays)) {
    const eve = addGregorianDays(fast.gregorian, -1);
    const at = new Date(eve.year, eve.month - 1, eve.day, 20, 0, 0, 0);
    if (at.getTime() > now.getTime()) return { fast, at };
  }
  return null;
}
