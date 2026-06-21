/**
 * Local-first adhkar progress (ADR 0006 + 0016). Tap tallies are kept per day
 * and reset automatically at the next calendar day — your morning/evening
 * remembrances start fresh each day, on the device, with no account. Persistence
 * goes through the `./adhkar-counts-store` adapter (ADR 0024).
 */
import { readStored, writeStored } from "./adhkar-counts-store";

/** Local calendar date as YYYY-MM-DD (adhkar are a local, daily concept). */
export function adhkarToday(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Today's tallies (empty if nothing saved today — yesterday's reset away). */
export function readAdhkarCounts(): Record<string, number> {
  const parsed = readStored();
  if (!parsed) return {};
  return parsed.date === adhkarToday() ? (parsed.counts ?? {}) : {};
}

export function writeAdhkarCounts(counts: Record<string, number>): void {
  writeStored({ date: adhkarToday(), counts });
}
