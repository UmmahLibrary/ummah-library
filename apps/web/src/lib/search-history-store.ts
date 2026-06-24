/**
 * Web persistence for recent search queries (ADR 0024), under `ul.searchHistory`.
 * Sync; the `*-store` file is the sanctioned `localStorage` home.
 */
const KEY = "ul.searchHistory";

export function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    // A corrupt/peer-synced non-array would crash consumers (.includes/.filter/.slice).
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function writeHistory(history: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable */
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
