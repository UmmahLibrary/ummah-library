/**
 * Language reference data — a small, pure lookup from ISO-639 codes to display
 * names (English + native). Translations carry only a language *code* (e.g.
 * "ur"); the reader groups and labels them by language, so the human-readable
 * names live here in the core where both web and mobile can share them.
 *
 * This is reference data, not logic: no I/O, no framework. Unknown codes fall
 * back to a title-cased form of the code itself so a newly-added edition never
 * breaks the UI.
 */

export interface LanguageName {
  /** Name in English, e.g. "Urdu". */
  english: string;
  /** Endonym (name in its own script), e.g. "اردو". */
  native: string;
}

/**
 * ISO-639-1 (with a few ISO-639-3 fallbacks) → display names. Covers the codes
 * our editions currently use plus common languages we expect to add, so the
 * grouping UI labels them properly out of the box.
 */
export const LANGUAGE_NAMES: Record<string, LanguageName> = {
  ar: { english: "Arabic", native: "العربية" },
  bn: { english: "Bengali", native: "বাংলা" },
  de: { english: "German", native: "Deutsch" },
  en: { english: "English", native: "English" },
  es: { english: "Spanish", native: "Español" },
  fa: { english: "Persian", native: "فارسی" },
  fr: { english: "French", native: "Français" },
  hi: { english: "Hindi", native: "हिन्दी" },
  id: { english: "Indonesian", native: "Bahasa Indonesia" },
  ml: { english: "Malayalam", native: "മലയാളം" },
  ms: { english: "Malay", native: "Bahasa Melayu" },
  nl: { english: "Dutch", native: "Nederlands" },
  ps: { english: "Pashto", native: "پښتو" },
  pt: { english: "Portuguese", native: "Português" },
  ru: { english: "Russian", native: "Русский" },
  sq: { english: "Albanian", native: "Shqip" },
  sw: { english: "Swahili", native: "Kiswahili" },
  ta: { english: "Tamil", native: "தமிழ்" },
  tr: { english: "Turkish", native: "Türkçe" },
  ur: { english: "Urdu", native: "اردو" },
  zh: { english: "Chinese", native: "中文" },
};

/** Title-case a bare code so an unknown language still reads sensibly. */
function titleCase(code: string): string {
  if (!code) return code;
  return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
}

/**
 * Display names for a language code. Falls back to a title-cased copy of the
 * code for anything not in {@link LANGUAGE_NAMES}, so the UI never shows a blank
 * label for a freshly added edition.
 */
export function displayLanguage(code: string): LanguageName {
  const known = LANGUAGE_NAMES[code.toLowerCase()];
  if (known) return known;
  const label = titleCase(code);
  return { english: label, native: label };
}
