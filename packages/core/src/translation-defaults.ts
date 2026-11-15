/**
 * Which translation a reader sees before they choose one (ADR 0041) — shared
 * by web and mobile. Keyed by language: the interface language first, then
 * the device's. These are widely used, established translations (ids are the
 * runtime catalogue's, ADR 0011); setup and the notice above the first verse
 * always let the reader pick another, or none. Arabic readers read the Quran
 * directly, so Arabic has no default. Pure data and lookups.
 */

/** The English default — The Clear Quran (Mustafa Khattab). */
export const ENGLISH_DEFAULT_TRANSLATION = "eng-mustafakhattaba";

export const DEFAULT_TRANSLATION_BY_LANGUAGE: Readonly<Record<string, readonly string[]>> = {
  en: [ENGLISH_DEFAULT_TRANSLATION],
  ur: ["urd-fatehmuhammadja"], // Fateh Muhammad Jalandhry
  bn: ["ben-muhiuddinkhan"], // Muhiuddin Khan
  hi: ["hin-maulanaazizulha"], // Maulana Azizul Haque al-Umari
  id: ["ind-indonesianislam"], // Indonesian Ministry of Religious Affairs
  tr: ["tur-diyanetisleri"], // Diyanet İşleri
  ar: [],
};

/** The catalogue's language name for a language code. */
export const CATALOGUE_LANGUAGE: Readonly<Record<string, string>> = {
  en: "English",
  ur: "Urdu",
  bn: "Bengali",
  hi: "Hindi",
  id: "Indonesian",
  tr: "Turkish",
  ar: "Arabic",
  fa: "Persian",
  ms: "Malay",
  fr: "French",
  ha: "Hausa",
  sw: "Swahili",
};

/** Default editions for a language tag ("ur", "bn-BD"); English when we have none. */
export function defaultTranslationsFor(lang: string | undefined | null): string[] {
  const code = (lang ?? "").toLowerCase().split(/[-_]/)[0] ?? "";
  return [...(DEFAULT_TRANSLATION_BY_LANGUAGE[code] ?? [ENGLISH_DEFAULT_TRANSLATION])];
}

/**
 * The default for someone who hasn't chosen: the interface language when it
 * isn't English (a deliberate choice in the app), otherwise the device's.
 */
export function defaultTranslations(
  uiLocale: string | null | undefined,
  deviceLocale: string | null | undefined,
): string[] {
  if (uiLocale && uiLocale !== "en") return defaultTranslationsFor(uiLocale);
  return defaultTranslationsFor(deviceLocale ?? "en");
}

/** A BCP-47 code for an edition's language ("Urdu" or "ur" → "ur"), for `lang`. */
export function editionLangCode(language: string | undefined | null): string | undefined {
  if (!language) return undefined;
  const l = language.trim();
  if (/^[a-z]{2,3}$/i.test(l)) return l.toLowerCase();
  const hit = Object.entries(CATALOGUE_LANGUAGE).find(
    ([, name]) => name.toLowerCase() === l.toLowerCase(),
  );
  return hit?.[0];
}

/** Script direction for a language code (translations in these read right to left). */
export function isRtlLanguage(code: string | undefined | null): boolean {
  return code === "ur" || code === "ar" || code === "fa" || code === "ps" || code === "sd";
}
