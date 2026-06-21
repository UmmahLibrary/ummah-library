/**
 * Synchronous theme mirror for the extension popup (ADR 0024) — a `localStorage`
 * copy of the chosen theme, read before paint to avoid a flash (the authoritative
 * value lives in `chrome.storage.sync` via `./storage`, which is async). This
 * `*-store` file is the sanctioned synchronous-`localStorage` home.
 */
const MIRROR_KEY = "ul.ext.themeMirror";

export function readThemeMirror(): string | null {
  try {
    return localStorage.getItem(MIRROR_KEY);
  } catch {
    return null;
  }
}

export function writeThemeMirror(key: string): void {
  try {
    localStorage.setItem(MIRROR_KEY, key);
  } catch {
    /* storage unavailable — non-fatal */
  }
}
