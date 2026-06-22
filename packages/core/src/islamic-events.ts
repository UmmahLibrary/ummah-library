/**
 * Islamic (Hijri) events — a small static table of well-established observances
 * by fixed Hijri date, plus a pure resolver that turns them into the upcoming
 * Gregorian occurrences with a day countdown.
 *
 * Like the rest of `core` this is deterministic and clock-injected: the caller
 * passes "today" as a {@link GregorianDate}, so there is no I/O and no hidden
 * `Date.now()`. The dates are factual calendar markers (no interpretive
 * content); the tabular Hijri calendar can sit ±1 day from a local sighting,
 * which is why every function takes the same `adjustmentDays` offset the rest of
 * the calendar uses (see `hijri.ts`).
 */

import type { GregorianDate, HijriDate } from "./hijri";
import { gregorianToHijri, hijriToGregorian } from "./hijri";

/** One observance, pinned to a fixed Hijri month and day. */
export interface IslamicEvent {
  /** Stable id (kebab-case), e.g. `"eid-al-fitr"`. */
  id: string;
  /** Hijri month, 1–12. */
  month: number;
  /** Hijri day of the month. */
  day: number;
  /** Transliterated name shown to the reader. */
  name: string;
  /** One-line description. */
  note: string;
}

/**
 * Major observances by fixed Hijri date, in calendar order. The festivals
 * themselves follow a local sighting; these are the widely-agreed tabular dates.
 */
export const ISLAMIC_EVENTS: readonly IslamicEvent[] = [
  { id: "islamic-new-year", month: 1, day: 1, name: "Islamic New Year", note: "Start of Muḥarram" },
  { id: "tasua", month: 1, day: 9, name: "Tāsūʿāʾ", note: "Ninth of Muḥarram — fasted before ʿĀshūrāʾ" },
  { id: "ashura", month: 1, day: 10, name: "ʿĀshūrāʾ", note: "A day of fasting" },
  { id: "mawlid", month: 3, day: 12, name: "Mawlid an-Nabī ﷺ", note: "Birth of the Prophet" },
  { id: "isra-miraj", month: 7, day: 27, name: "Al-Isrāʾ wal-Miʿrāj", note: "The Night Journey" },
  { id: "laylat-al-baraah", month: 8, day: 15, name: "Laylat al-Barāʾah", note: "Mid-Shaʿbān night" },
  { id: "ramadan-begins", month: 9, day: 1, name: "First of Ramaḍān", note: "Fasting begins" },
  { id: "laylat-al-qadr", month: 9, day: 27, name: "Laylat al-Qadr", note: "Sought in the last ten nights" },
  { id: "eid-al-fitr", month: 10, day: 1, name: "ʿĪd al-Fiṭr", note: "Festival of breaking the fast" },
  { id: "dhul-hijjah-begins", month: 12, day: 1, name: "Dhū al-Ḥijjah begins", note: "The first ten days begin" },
  { id: "tarwiyah", month: 12, day: 8, name: "Day of Tarwiyah", note: "Pilgrims set out for Minā" },
  { id: "arafah", month: 12, day: 9, name: "Day of ʿArafah", note: "The standing at ʿArafah" },
  { id: "eid-al-adha", month: 12, day: 10, name: "ʿĪd al-Aḍḥā", note: "Festival of the sacrifice" },
  { id: "tashriq", month: 12, day: 11, name: "Days of Tashrīq", note: "Days of takbīr (11–13 Dhū al-Ḥijjah)" },
];

/** The events that fall in a given Hijri month (1–12), in day order. */
export function islamicEventsInMonth(month: number): IslamicEvent[] {
  return ISLAMIC_EVENTS.filter((e) => e.month === month);
}

/** An event resolved to its next Gregorian occurrence. */
export interface UpcomingIslamicEvent {
  event: IslamicEvent;
  /** The resolved Hijri date, carrying the year it next falls in. */
  hijri: HijriDate;
  /** Its Gregorian civil date. */
  gregorian: GregorianDate;
  /** Whole days from `today` to the event (0 = today, 1 = tomorrow). */
  daysUntil: number;
}

/**
 * Proleptic Gregorian day number (a Julian Day Number) for a civil date — pure
 * integer arithmetic, no `Date`. Mirrors the conversion in `hijri.ts` so day
 * differences are exact regardless of timezone.
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

/**
 * The next `count` Islamic events at or after `today`, soonest first, each with
 * the Gregorian date it next falls on and the number of days until then. An
 * event that has already passed this Hijri year rolls over to the next one.
 */
export function upcomingIslamicEvents(
  today: GregorianDate,
  count: number = ISLAMIC_EVENTS.length,
  adjustmentDays = 0,
): UpcomingIslamicEvent[] {
  const todayHijri = gregorianToHijri(today, adjustmentDays);
  const todayNum = dayNumber(today);

  const resolved = ISLAMIC_EVENTS.map((event) => {
    // This Hijri year, else the next, is always at or after today.
    let chosen: { hijri: HijriDate; gregorian: GregorianDate; num: number } | null = null;
    for (const year of [todayHijri.year, todayHijri.year + 1]) {
      const hijri = { year, month: event.month, day: event.day };
      const gregorian = hijriToGregorian(hijri, adjustmentDays);
      const num = dayNumber(gregorian);
      if (num >= todayNum) {
        chosen = { hijri, gregorian, num };
        break;
      }
    }
    // `chosen` is non-null: next year's date is always in the future.
    const { hijri, gregorian, num } = chosen!;
    return { event, hijri, gregorian, daysUntil: num - todayNum };
  });

  resolved.sort((a, b) => a.daysUntil - b.daysUntil);
  return resolved.slice(0, Math.max(0, count));
}

/** An observance resolved within a specific Hijri month, with a signed countdown. */
export interface MonthlyIslamicEvent {
  event: IslamicEvent;
  /** Gregorian date of the event in the requested Hijri year. */
  gregorian: GregorianDate;
  /** Whole days from `today`: negative if already passed, 0 = today. */
  daysUntil: number;
}

/**
 * The observances in a given Hijri month (of a specific Hijri year), in day
 * order, each resolved to its Gregorian date with a signed day countdown from
 * `today`. This is the labelled companion to a month grid: every marker the grid
 * draws has a named row here, in the same scope. Pure; the clock is injected.
 */
export function islamicEventsForMonth(
  hijriYear: number,
  hijriMonth: number,
  today: GregorianDate,
  adjustmentDays = 0,
): MonthlyIslamicEvent[] {
  const todayNum = dayNumber(today);
  return islamicEventsInMonth(hijriMonth).map((event) => {
    const gregorian = hijriToGregorian(
      { year: hijriYear, month: hijriMonth, day: event.day },
      adjustmentDays,
    );
    return { event, gregorian, daysUntil: dayNumber(gregorian) - todayNum };
  });
}
