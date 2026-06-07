/**
 * Hijri (Islamic) calendar — pure, deterministic arithmetic with no vendor and
 * no I/O, so it lives entirely in `core` (see docs/adr/0014-hijri-calendar.md
 * and the principle clarified in 0013).
 *
 * This is the **tabular** civil calendar (matches ICU `islamic-civil`): a fixed
 * 30-year arithmetic cycle, not moon-sighting. It can differ from Saudi Umm
 * al-Qura or a local sighting by ±1 day, which is why every conversion accepts
 * an `adjustmentDays` offset the caller can persist as a user preference.
 */

/** A plain civil (Gregorian) date — no time, no timezone. */
export interface GregorianDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
}

/** A date in the Hijri calendar. */
export interface HijriDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–30
}

export interface HijriMonth {
  number: number; // 1–12
  /** Transliterated name, e.g. "Ramaḍān". */
  name: string;
  /** Arabic name, e.g. "رمضان". */
  arabic: string;
}

export const HIJRI_MONTHS: readonly HijriMonth[] = [
  { number: 1, name: "Muḥarram", arabic: "محرم" },
  { number: 2, name: "Ṣafar", arabic: "صفر" },
  { number: 3, name: "Rabīʿ al-Awwal", arabic: "ربيع الأول" },
  { number: 4, name: "Rabīʿ al-Thānī", arabic: "ربيع الآخر" },
  { number: 5, name: "Jumādā al-Ūlā", arabic: "جمادى الأولى" },
  { number: 6, name: "Jumādā al-Ākhirah", arabic: "جمادى الآخرة" },
  { number: 7, name: "Rajab", arabic: "رجب" },
  { number: 8, name: "Shaʿbān", arabic: "شعبان" },
  { number: 9, name: "Ramaḍān", arabic: "رمضان" },
  { number: 10, name: "Shawwāl", arabic: "شوال" },
  { number: 11, name: "Dhū al-Qaʿdah", arabic: "ذو القعدة" },
  { number: 12, name: "Dhū al-Ḥijjah", arabic: "ذو الحجة" },
];

const HIJRI_EPOCH_JDN = 1948440; // 1 Muḥarram 1 AH (civil), Julian Day Number.
const fl = Math.floor;

/** Julian Day Number for a Gregorian civil date (proleptic, integer days). */
function gregorianToJdn({ year, month, day }: GregorianDate): number {
  const a = fl((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + fl((153 * m + 2) / 5) + 365 * y + fl(y / 4) - fl(y / 100) + fl(y / 400) - 32045;
}

/** Gregorian civil date from a Julian Day Number. */
function jdnToGregorian(jdn: number): GregorianDate {
  const a = jdn + 32044;
  const b = fl((4 * a + 3) / 146097);
  const c = a - fl((146097 * b) / 4);
  const d = fl((4 * c + 3) / 1461);
  const e = c - fl((1461 * d) / 4);
  const m = fl((5 * e + 2) / 153);
  return {
    day: e - fl((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * fl(m / 10),
    year: 100 * b + d - 4800 + fl(m / 10),
  };
}

function jdnToHijri(jdn: number): HijriDate {
  let l = jdn - HIJRI_EPOCH_JDN + 10632;
  const n = fl((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    fl((10985 - l) / 5316) * fl((50 * l) / 17719) + fl(l / 5670) * fl((43 * l) / 15238);
  l = l - fl((30 - j) / 15) * fl((17719 * j) / 50) - fl(j / 16) * fl((15238 * j) / 43) + 29;
  const month = fl((24 * l) / 709);
  const day = l - fl((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

function hijriToJdn({ year, month, day }: HijriDate): number {
  return (
    day + fl(29.5001 * (month - 1) + 0.99) + (year - 1) * 354 + fl((3 + 11 * year) / 30) + HIJRI_EPOCH_JDN - 1
  );
}

/** Whether a Hijri year is a leap year (Dhū al-Ḥijjah has 30 days). */
export function isHijriLeapYear(year: number): boolean {
  return ((11 * year + 14) % 30) < 11;
}

/** Number of days (29 or 30) in a Hijri month. */
export function hijriMonthLength(year: number, month: number): number {
  if (month % 2 === 1) return 30;
  if (month === 12) return isHijriLeapYear(year) ? 30 : 29;
  return 29;
}

/**
 * Convert a Gregorian civil date to Hijri. `adjustmentDays` shifts the result
 * (e.g. `-1` / `+1`) so a user can align the tabular calendar with their local
 * moon sighting or Umm al-Qura.
 */
export function gregorianToHijri(date: GregorianDate, adjustmentDays = 0): HijriDate {
  return jdnToHijri(gregorianToJdn(date) + adjustmentDays);
}

/** Convert a Hijri date back to a Gregorian civil date (inverse, undoing the adjustment). */
export function hijriToGregorian(date: HijriDate, adjustmentDays = 0): GregorianDate {
  return jdnToGregorian(hijriToJdn(date) - adjustmentDays);
}

/** The month's metadata (1–12). */
export function hijriMonth(month: number): HijriMonth {
  return HIJRI_MONTHS[month - 1]!;
}

/** Human label, e.g. "9 Ramaḍān 1447 AH" (use `arabic` for the Arabic name). */
export function formatHijri(date: HijriDate, opts: { arabic?: boolean } = {}): string {
  const m = hijriMonth(date.month);
  return `${date.day} ${opts.arabic ? m.arabic : m.name} ${date.year} AH`;
}
