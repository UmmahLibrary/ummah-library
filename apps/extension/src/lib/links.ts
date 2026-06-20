import { ayahKey } from "@ummahlibrary/core";
import { BASE_URL } from "./config";

/**
 * Deep link into the web reader. With an āyah, anchors the reader at that verse
 * via the `#sura:aya` hash the surah page already understands (see
 * `HomeVerseOfDay` / `SurahReaderClient` in apps/web).
 */
export function surahUrl(sura: number, aya?: number): string {
  return aya ? `${BASE_URL}/surah/${sura}#${ayahKey({ sura, aya })}` : `${BASE_URL}/surah/${sura}`;
}

export const homeUrl = (): string => BASE_URL;
export const settingsUrl = (): string => `${BASE_URL}/settings`;

/**
 * Open a URL in a new tab. Prefers `chrome.tabs.create` (a popup closes the
 * moment it loses focus, so an in-popup navigation would be lost); falls back to
 * `window.open` when the extension API is unavailable.
 */
export function openUrl(url: string): void {
  const tabs = typeof chrome !== "undefined" ? chrome.tabs : undefined;
  if (tabs?.create) {
    void tabs.create({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
