/**
 * Web persistence for the chosen UI locale (#208, ADR 0024/0040), under
 * `ul.locale`. The sanctioned `localStorage` home; the i18n *runtime* lives in
 * `I18nProvider`. A synced adapter (#25) could replace this without touching the
 * provider.
 */
import { DEFAULT_LOCALE, LOCALES, type Locale, isLocale } from "./config";

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

/**
 * Inline pre-paint snippet for the layout bootstrap: sets `lang`/`dir` on
 * `<html>` from the saved locale before first paint, so an Arabic or Urdu
 * reader never sees the page laid out left-to-right and then mirror itself
 * once React hydrates. Mirrors `localeDir`; the provider keeps it in sync after.
 */
export const LOCALE_BOOTSTRAP = `try{var l=localStorage.getItem("${KEY}");var dirs=${JSON.stringify(
  Object.fromEntries(LOCALES.map((l) => [l.code, l.dir])),
)};if(l&&dirs[l]){d.lang=l;d.dir=dirs[l];}}catch(e){}`;
