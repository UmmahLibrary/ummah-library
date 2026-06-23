/**
 * Raw `localStorage` access for the sync module (ADR 0024/0028) — the one file
 * here permitted to touch web storage directly, so the rest of the sync code stays
 * storage-agnostic. Every accessor swallows storage errors (private mode, quota)
 * and degrades to null / a no-op rather than throwing.
 */
export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}
