/**
 * Interface-language helpers shared by the prayer and learn tool screens
 * (ADR 0040/0041): one set of prayer-name keys in place of core's English
 * `PRAYER_LABELS`, localized clock times / dates, the countdown string, and
 * digit mapping for numbers that must not get thousands separators (years).
 */
import { type Coordinates, type PrayerName, formatUiNumber } from "@ummahlibrary/core";
import type { FmtVars } from "@ummahlibrary/core";
import type { MessageKey } from "./i18n/messages";
import { timeZoneFor } from "./utils";

export const PRAYER_KEY: Record<PrayerName, MessageKey> = {
  fajr: "pr.fajr",
  sunrise: "pr.sunrise",
  dhuhr: "pr.dhuhr",
  asr: "pr.asr",
  maghrib: "pr.maghrib",
  isha: "pr.isha",
};

/** The twelve Hijri month names, 1-based via `HIJRI_MONTH_KEY[month - 1]`. */
export const HIJRI_MONTH_KEY: readonly MessageKey[] = [
  "lr.hm1",
  "lr.hm2",
  "lr.hm3",
  "lr.hm4",
  "lr.hm5",
  "lr.hm6",
  "lr.hm7",
  "lr.hm8",
  "lr.hm9",
  "lr.hm10",
  "lr.hm11",
  "lr.hm12",
];

/** Digits in the interface language, with no grouping (e.g. a Hijri year). */
export function uiDigits(n: number | string, locale: string): string {
  return String(n).replace(/[0-9]/g, (d) => formatUiNumber(Number(d), locale));
}

/** A prayer time in the interface language, in the location's own zone. */
export function fmtPrayerTimeIn(
  src: string | Date,
  coords: Coordinates | null | undefined,
  locale: string,
): string {
  const d = typeof src === "string" ? new Date(src) : src;
  if (Number.isNaN(d.getTime())) return "—";
  const timeZone = timeZoneFor(coords);
  try {
    return uiDigits(
      d.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        ...(timeZone && { timeZone }),
      }),
      locale,
    );
  } catch {
    return uiDigits(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), locale);
  }
}

/** A civil (Y-M-D) date in the interface language. */
export function fmtCivilDateIn(
  g: { year: number; month: number; day: number },
  locale: string,
  opts: Intl.DateTimeFormatOptions,
): string {
  const d = new Date(Date.UTC(g.year, g.month - 1, g.day));
  try {
    // Digits follow the interface's numbering (Urdu, Bengali, Arabic) even
    // where the platform's date data would print Western ones.
    return uiDigits(d.toLocaleDateString(locale, { ...opts, timeZone: "UTC" }), locale);
  } catch {
    return uiDigits(d.toLocaleDateString(undefined, { ...opts, timeZone: "UTC" }), locale);
  }
}

type Tf = (key: MessageKey, vars: FmtVars) => string;

/** "2h 15m" / "8m" in the interface language; "—" for an invalid target. */
export function fmtCountdownIn(target: Date, now: Date, tf: Tf): string {
  if (Number.isNaN(target.getTime())) return "—";
  const secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs - h * 3600) / 60);
  return h > 0 ? tf("pr.countdownHM", { h, m }) : tf("pr.countdownM", { m });
}

/** "Today" / "Tomorrow" / "in N days". */
export function fmtDaysUntil(daysUntil: number, t: (key: MessageKey) => string, tf: Tf): string {
  if (daysUntil === 0) return t("pr.today");
  if (daysUntil === 1) return t("pr.tomorrow");
  return tf("pr.inDays", { n: daysUntil });
}
