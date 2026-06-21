import { noorThemes } from "@ummahlibrary/ui";
import type { ThemeKey } from "@ummahlibrary/ui";
import { getPref, setPref } from "./storage";
import { readThemeMirror, writeThemeMirror } from "./theme-store";

/** All Noor themes, in palette order — the single source (ADR 0023/0027). */
export const THEME_KEYS = Object.keys(noorThemes) as ThemeKey[];

const DEFAULT_THEME: ThemeKey = "obsidian";

function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as string[]).includes(value);
}

/** Apply a theme by setting `data-theme` on <html>; the generated
 *  `noor-themes.css` recolours everything from there. */
export function applyTheme(key: ThemeKey): void {
  document.documentElement.dataset.theme = key;
}

/** Best-effort synchronous read for pre-paint. Falls back to the default. */
export function readThemeSync(): ThemeKey {
  const v = readThemeMirror();
  return isThemeKey(v) ? v : DEFAULT_THEME;
}

/** Authoritative read from synced storage (follows the user across devices),
 *  falling back to the synchronous mirror, then the default. */
export async function getStoredTheme(): Promise<ThemeKey> {
  const v = await getPref<string>("theme", readThemeSync());
  return isThemeKey(v) ? v : DEFAULT_THEME;
}

/** Persist + apply: synced pref (cross-device) + the synchronous mirror. */
export async function setStoredTheme(key: ThemeKey): Promise<void> {
  applyTheme(key);
  writeThemeMirror(key);
  await setPref("theme", key);
}
