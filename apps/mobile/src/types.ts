/** The three reader presentations, mirroring the web `data-reading-mode`. */
export type ReadingMode = "translation" | "reading" | "reading-tr";

// A fawazahmed0/quran-api slug (the runtime catalogue's id-space — ADR 0011).
export const DEFAULT_EDITION = "eng-mustafakhattaba";
export const DEFAULT_EDITIONS = [DEFAULT_EDITION];

// Muhammad Junagarhi — shown by default to users with an Urdu device locale,
// mirroring apps/web/src/lib/editions.ts (#238: Urdu is a stated priority
// language, not just English until a user goes looking for it).
const URDU_DEFAULT_EDITIONS = ["urd-muhammadjunagar"];

/**
 * The default edition set for a first-time user, chosen by device locale.
 * Always user-overridable — once they pick editions of their own, the stored
 * set wins (see SettingsContext).
 */
export function defaultEditions(): string[] {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (/^ur\b/i.test(locale)) return URDU_DEFAULT_EDITIONS;
  } catch {
    /* Intl unavailable — fall through */
  }
  return DEFAULT_EDITIONS;
}

// The catalogue edition for the per-āyah transliteration line (#150) — Tanzil's
// verbatim Latin transliteration (CC-BY 3.0), fetched at runtime like any edition.
export const TRANSLIT_EDITION = "ara-quran-la";

// Arabic size multiplier (ADR 0041). The range only ever grows (it was
// 0.8–1.6), so a size saved by an earlier version is never shrunk on load.
export const MIN_SCALE = 0.7;
export const MAX_SCALE = 2.4;
