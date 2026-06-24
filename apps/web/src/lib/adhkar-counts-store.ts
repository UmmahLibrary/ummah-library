/**
 * Web persistence for adhkar tap-tallies (ADR 0024), under `ul.adhkar`. Sync;
 * the `*-store` file is the sanctioned `localStorage` home. The per-day reset
 * logic lives in `./adhkar`.
 */
const KEY = "ul.adhkar";

export interface StoredAdhkar {
  date: string;
  counts: Record<string, number>;
}

export function readStored(): StoredAdhkar | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    // A corrupt/peer-synced value must have a usable `counts` map, else the per-day
    // reset logic crashes on `stored.counts[id]`. Anything else resets to null.
    const v = JSON.parse(raw) as unknown;
    const counts = v !== null && typeof v === "object" ? (v as { counts?: unknown }).counts : undefined;
    return counts !== null && typeof counts === "object" && !Array.isArray(counts)
      ? (v as StoredAdhkar)
      : null;
  } catch {
    return null;
  }
}

export function writeStored(value: StoredAdhkar): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}
