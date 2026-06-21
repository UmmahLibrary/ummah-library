/**
 * Web theme persistence (ADR 0024) — the one `localStorage` home for the active
 * theme and the last theme used in each mode. Kept **synchronous**: the theme is
 * read before paint (the inline script in `app/layout.tsx`) to avoid a flash, so
 * an async port can't serve it. The pure theme logic (resolving/normalising)
 * stays in `./themes`.
 */
import type { ThemeMode } from "./themes";

const THEME_KEY = "ul.theme";
const lastKey = (mode: ThemeMode): string => (mode === "dark" ? "ul.lastDark" : "ul.lastLight");

/** The last theme stored for a mode (raw string), or `null`. */
export function readLastTheme(mode: ThemeMode): string | null {
  try {
    return localStorage.getItem(lastKey(mode));
  } catch {
    return null;
  }
}

/** Persist the active theme and remember it as the last one used in its mode. */
export function writeActiveTheme(key: string, mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, key);
    localStorage.setItem(lastKey(mode), key);
  } catch {
    /* storage unavailable */
  }
}
