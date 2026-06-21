/**
 * Web persistence for the zakat calculator's saved inputs (ADR 0024), under
 * `ul.zakat`. Sync; the `*-store` file is the sanctioned `localStorage` home.
 * The caller owns the state shape (this layer is shape-agnostic).
 */
const KEY = "ul.zakat";

export function readZakat(): unknown {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeZakat(state: unknown): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
