/**
 * Web persistence for the chosen UI locale (#208, ADR 0024/0040), under
 * `ul.locale`. The sanctioned `localStorage` home; the i18n *runtime* lives in
 * `I18nProvider`. A synced adapter (#25) could replace this without touching the
 * provider.
 */
import { DEFAULT_LOCALE, type Locale, isLocale } from "./config";

const KEY = "ul.locale";

export function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    return saved && isLocale(saved) ? saved : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeLocale(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* storage unavailable */
  }
}
