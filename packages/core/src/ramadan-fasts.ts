/**
 * Which Ramaḍān fasts were kept, scoped by Hijri year.
 *
 * `ul.ramadanFasts` began as `{ "1": true, … "30": true }` — day numbers with no
 * year — so last Ramaḍān's fasts showed up as already kept the next year. Entries
 * are now keyed `"<hijriYear>:<day>"`. The map stays a flat `Record<id, true>`, so
 * the synced shape (`recordShape`) and per-entry merge are unchanged. Pure; the
 * apps read/write storage and pass "today" in.
 */
import type { HijriDate } from "./hijri";

export type RamadanFasts = Readonly<Record<string, true>>;

/**
 * The Ramaḍān a fasting grid refers to on `today`: this year's from Ramaḍān
 * onwards, otherwise last year's — so after Eid you can still fill in a fast you
 * forgot to tick, and before Ramaḍān you see the one just gone.
 */
export function ramadanYearFor(today: HijriDate): number {
  return today.month >= 9 ? today.year : today.year - 1;
}

const LEGACY = /^\d{1,2}$/;

/**
 * Move year-less legacy entries ("5") to `legacyYear` ("1447:5"). Those were
 * ticked in the most recent Ramaḍān, which is what {@link ramadanYearFor} gives.
 */
export function migrateRamadanFasts(fasts: RamadanFasts, legacyYear: number): Record<string, true> {
  const out: Record<string, true> = {};
  for (const key of Object.keys(fasts)) {
    if (fasts[key] !== true) continue;
    out[LEGACY.test(key) ? `${legacyYear}:${Number(key)}` : key] = true;
  }
  return out;
}

/** The days (1–30) kept in `year`'s Ramaḍān. */
export function keptFastDays(fasts: RamadanFasts, year: number): ReadonlySet<number> {
  const prefix = `${year}:`;
  const days = new Set<number>();
  for (const key of Object.keys(fasts)) {
    if (fasts[key] === true && key.startsWith(prefix)) days.add(Number(key.slice(prefix.length)));
  }
  return days;
}

/** Tick or untick one fast of `year`'s Ramaḍān. */
export function toggleRamadanFast(
  fasts: RamadanFasts,
  year: number,
  day: number,
): Record<string, true> {
  const next: Record<string, true> = { ...fasts };
  const key = `${year}:${day}`;
  if (next[key]) delete next[key];
  else next[key] = true;
  return next;
}
