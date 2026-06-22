/**
 * Qaḍāʾ (missed-prayer) tracking domain: a per-prayer backlog of obligatory
 * prayers owed, kept separate from the daily prayer log (`prayer-tracker.ts`).
 * Pure and deterministic — non-negative integer balances and immutable
 * operations over them. The backlog is persisted on-device behind the
 * `QadaStore` port (ADR 0024, 0030); these helpers only compute over it.
 */

import { OBLIGATORY_PRAYERS, type PrayerName } from "./prayer";

/**
 * A backlog of missed obligatory prayers owed, keyed by prayer. An absent (or
 * zero) entry means none are owed, so the log stays sparse.
 */
export type QadaLog = Partial<Record<PrayerName, number>>;

/** Coerce any stored/input value to a safe, non-negative integer count. */
function clampCount(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** How many of a given prayer are owed (0 when none recorded). */
export function owedFor(log: QadaLog, prayer: PrayerName): number {
  return clampCount(log[prayer] ?? 0);
}

/** Total obligatory prayers owed across all five. */
export function totalOwed(log: QadaLog): number {
  return OBLIGATORY_PRAYERS.reduce((sum, p) => sum + owedFor(log, p), 0);
}

/**
 * Set a prayer's backlog to an explicit count (clamped to a non-negative
 * integer). A zero count drops the entry so the log stays sparse. Immutable —
 * returns a new log.
 */
export function setQada(log: QadaLog, prayer: PrayerName, count: number): QadaLog {
  const next: QadaLog = { ...log };
  const safe = clampCount(count);
  if (safe === 0) delete next[prayer];
  else next[prayer] = safe;
  return next;
}

/**
 * Adjust a prayer's backlog by `delta` — `+1` to record a missed prayer, `-1`
 * to make one up — clamped at zero so it can never go negative. Immutable.
 */
export function adjustQada(log: QadaLog, prayer: PrayerName, delta: number): QadaLog {
  return setQada(log, prayer, owedFor(log, prayer) + Math.trunc(delta));
}

/** Record one missed prayer (shorthand for `adjustQada(log, prayer, +1)`). */
export function recordMissed(log: QadaLog, prayer: PrayerName): QadaLog {
  return adjustQada(log, prayer, 1);
}

/** Mark one owed prayer as made up; a no-op when none are owed. */
export function makeUp(log: QadaLog, prayer: PrayerName): QadaLog {
  return adjustQada(log, prayer, -1);
}
