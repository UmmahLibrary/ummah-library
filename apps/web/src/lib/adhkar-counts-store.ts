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
    return raw ? (JSON.parse(raw) as StoredAdhkar) : null;
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
