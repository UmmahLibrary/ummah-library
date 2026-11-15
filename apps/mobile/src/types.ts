import { defaultTranslations } from "@ummahlibrary/core";

/** The three reader presentations, mirroring the web `data-reading-mode`. */
export type ReadingMode = "translation" | "reading" | "reading-tr";

// A fawazahmed0/quran-api slug (the runtime catalogue's id-space — ADR 0011).
export const DEFAULT_EDITION = "eng-mustafakhattaba";
export const DEFAULT_EDITIONS = [DEFAULT_EDITION];

/**
 * The translation shown before the reader chooses (ADR 0041): the interface
 * language when it isn't English, otherwise the device's. The rule lives in
 * core so web and mobile agree. Always user-overridable — once they pick
 * (including "None"), the stored set wins (see SettingsContext).
 */
export function defaultEditions(uiLocale?: string): string[] {
  let device: string | undefined;
  try {
    device = Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    /* Intl unavailable */
  }
  return defaultTranslations(uiLocale, device);
}

// The catalogue edition for the per-āyah transliteration line (#150) — Tanzil's
// verbatim Latin transliteration (CC-BY 3.0), fetched at runtime like any edition.
export const TRANSLIT_EDITION = "ara-quran-la";

// Arabic size multiplier (ADR 0041). The range only ever grows (it was
// 0.8–1.6), so a size saved by an earlier version is never shrunk on load.
export const MIN_SCALE = 0.7;
export const MAX_SCALE = 2.4;
