/**
 * Local-first adhkar progress (ADR 0006 + 0016). Tap tallies are kept per day
 * and reset automatically at the next calendar day — your morning/evening
 * remembrances start fresh each day, on the device, with no account.
 */

const STORAGE_KEY = "ul.adhkar";

interface Stored {
  date: string;
  counts: Record<string, number>;
}

/** Local calendar date as YYYY-MM-DD (adhkar are a local, daily concept). */
export function adhkarToday(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Today's tallies (empty if nothing saved today — yesterday's reset away). */
export function readAdhkarCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Stored;
    return parsed.date === adhkarToday() ? (parsed.counts ?? {}) : {};
  } catch {
    return {};
  }
}

export function writeAdhkarCounts(counts: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: adhkarToday(), counts } satisfies Stored));
  } catch {
    /* storage unavailable — ignore */
  }
}
