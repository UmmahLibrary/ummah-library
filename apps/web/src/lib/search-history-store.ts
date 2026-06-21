/**
 * Web persistence for recent search queries (ADR 0024), under `ul.searchHistory`.
 * Sync; the `*-store` file is the sanctioned `localStorage` home.
 */
const KEY = "ul.searchHistory";

export function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
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
