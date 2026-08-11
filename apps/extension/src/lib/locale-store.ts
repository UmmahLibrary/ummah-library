/**
 * Synchronous locale mirror for the extension popup (ADR 0024, ADR 0040) — a
 * `localStorage` copy of the chosen UI language, read before paint to avoid a
 * flash (the authoritative value lives in `chrome.storage.sync` via `./storage`,
 * which is async). Mirrors `theme-store.ts`'s split for the same reason.
 */
const MIRROR_KEY = "ul.ext.localeMirror";

export function readLocaleMirror(): string | null {
  try {
    return localStorage.getItem(MIRROR_KEY);
  } catch {
    return null;
  }
}

export function writeLocaleMirror(locale: string): void {
  try {
    localStorage.setItem(MIRROR_KEY, locale);
  } catch {
    /* storage unavailable — non-fatal */
  }
}
