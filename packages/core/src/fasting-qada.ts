/**
 * Fasting qaḍāʾ (make-up fasts) domain (#155, ADR 0034). A woman does not fast
 * during ḥayḍ, and the Ramaḍān fast-days she misses **are** made up later —
 * unlike the prayers in that pause, which are not owed (see `haid.ts`).
 *
 * The count *owed* is derived, not stored: it is the ḥayḍ pause ranges
 * (`haid.ts`) intersected with Ramaḍān (Hijri month 9) — each paused Gregorian
 * day that falls in Ramaḍān is one fast to make up. The only persisted state is
 * how many of those have been completed (`FastingQadaLog`), kept behind the
 * `FastingQadaStore` port. Pure and deterministic — "today" and the Hijri
 * adjustment are injected, never read from the clock.
 */
import { addDays, daysBetween } from "./reading-goals";
import { gregorianToHijri } from "./hijri";
import type { HaidLog } from "./haid";

/** Ramaḍān is the 9th Hijri month. */
const RAMADAN_MONTH = 9;
/** Skip a pause range longer than this (corrupt or foreign data) to bound the loop. */
const MAX_SPAN_DAYS = 1000;

/** Stored fasting-qaḍāʾ state: how many of the owed make-up fasts are completed. */
export interface FastingQadaLog {
  madeUp: number;
}

/** The empty log — nothing made up yet. */
export const EMPTY_FASTING_QADA: FastingQadaLog = { madeUp: 0 };

/** Whether a `YYYY-MM-DD` date falls in Ramaḍān, under the given Hijri adjustment. */
export function isRamadanDate(date: string, hijriAdjust = 0): boolean {
  const parts = date.split("-");
  if (parts.length !== 3) return false;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  return gregorianToHijri({ year, month, day }, hijriAdjust).month === RAMADAN_MONTH;
}

/**
 * The distinct Gregorian days inside any ḥayḍ pause that fall in Ramaḍān, bounded
 * to `today` for an open (ongoing) period. These are the fasts owed as qaḍāʾ. A
 * `Set` keeps the count correct even if two periods overlap; a corrupt or absurdly
 * long range is skipped rather than looped over.
 */
export function ramadanPauseDays(haid: HaidLog, today: string, hijriAdjust = 0): string[] {
  const days = new Set<string>();
  for (const period of haid) {
    const end = period.end ?? today;
    const span = daysBetween(period.start, end);
    if (!Number.isFinite(span) || span < 0 || span > MAX_SPAN_DAYS) continue;
    let date = period.start;
    for (let i = 0; i <= span; i++) {
      if (isRamadanDate(date, hijriAdjust)) days.add(date);
      date = addDays(date, 1);
    }
  }
  return [...days];
}

/** How many qaḍāʾ fasts are owed — derived from ḥayḍ pauses ∩ Ramaḍān. */
export function fastingQadaOwed(haid: HaidLog, today: string, hijriAdjust = 0): number {
  return ramadanPauseDays(haid, today, hijriAdjust).length;
}

/** The made-up count, clamped into the valid range `[0, owed]` for display. */
export function fastingMadeUp(log: FastingQadaLog, owed: number): number {
  const n = Math.trunc(log.madeUp);
  return Number.isFinite(n) ? Math.min(Math.max(0, n), Math.max(0, owed)) : 0;
}

/** Fasts still to make up: owed minus made-up, never below zero. */
export function fastingQadaRemaining(log: FastingQadaLog, owed: number): number {
  return Math.max(0, owed) - fastingMadeUp(log, owed);
}

/** Adjust the made-up count by `delta` (`+1` makes one up, `-1` undoes), clamped to `[0, owed]`. */
export function adjustFastingMadeUp(
  log: FastingQadaLog,
  delta: number,
  owed: number,
): FastingQadaLog {
  const next = Math.min(Math.max(0, fastingMadeUp(log, owed) + Math.trunc(delta)), Math.max(0, owed));
  return { madeUp: next };
}
