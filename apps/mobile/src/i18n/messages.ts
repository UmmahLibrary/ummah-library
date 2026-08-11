/**
 * UI message catalogue (#208) — mobile mirror of `apps/web/src/i18n/messages.ts`.
 * English is the source of truth and defines the key set (`MessageKey`); every
 * other locale is a `Record<MessageKey, string>` the compiler forces to stay
 * complete. This is a **starter slice** (the bottom tab bar + the Settings
 * language section) that proves the mechanism end-to-end on this platform,
 * mirroring web's Phase 0–1 scope (ADR 0040) — extracting the rest of the UI is
 * incremental follow-up under #208.
 *
 * The `common.*` keys and their Urdu text are copied verbatim from web's
 * catalogue so the two platforms describe the same choice identically; `tab.*`
 * is mobile-only (the bottom tab bar has no web equivalent).
 *
 * The Urdu strings are a first pass flagged for **native review** before
 * release — the localization *infrastructure* is what this change lands, not
 * authoritative translations.
 */
import type { Locale } from "./config";

export const en = {
  // Bottom tab bar
  "tab.home": "Home",
  "tab.read": "Read",
  "tab.tools": "Tools",
  "tab.memorize": "Memorize",
  "tab.more": "More",
  // Common chrome (kept in sync with apps/web/src/i18n/messages.ts)
  "common.settings": "Settings",
  "common.language": "Language",
  "settings.languageHint": "Choose the language for the app's interface. Quran and translation text are unaffected.",
} as const;

export type MessageKey = keyof typeof en;

// First-pass Urdu (RTL) — نظرِ ثانی درکار / needs native review.
const ur: Record<MessageKey, string> = {
  "tab.home": "ہوم",
  "tab.read": "پڑھیں",
  "tab.tools": "اوزار",
  "tab.memorize": "حفظ",
  "tab.more": "مزید",
  "common.settings": "ترتیبات",
  "common.language": "زبان",
  "settings.languageHint": "ایپ کے انٹرفیس کی زبان منتخب کریں۔ قرآن اور ترجمے کا متن متاثر نہیں ہوگا۔",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ur };
