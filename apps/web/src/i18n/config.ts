/**
 * UI localization config (#208, ADR 0040). The interface language is separate
 * from Quran/translation content: this only localizes the app's own chrome.
 * A locale carries a text direction so an RTL language (Urdu, Arabic) flips the
 * whole layout via `<html dir>`.
 */
/** Every UI locale the app can render in. Adding one extends this union, which
 *  forces its message catalogue to be complete (see `messages.ts`). */
export type Locale = "en" | "ur";

export interface LocaleMeta {
  code: Locale;
  /** Endonym — the language's own name, shown in the picker. */
  label: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: readonly LocaleMeta[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return LOCALES.some((l) => l.code === value);
}

export function localeDir(code: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}
