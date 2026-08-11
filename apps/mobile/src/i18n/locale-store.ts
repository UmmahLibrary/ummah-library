/**
 * Mobile persistence for the chosen UI locale (#208, ADR 0024/0040), under
 * `ul.locale` — the same key the web app uses, matching AsyncStorage instead of
 * `localStorage`. The i18n *runtime* lives in `I18nProvider`.
 */
import { KEYS, getString, setString } from "../storage";
import { DEFAULT_LOCALE, type Locale, isLocale } from "./config";

export async function readLocale(): Promise<Locale> {
  const saved = await getString(KEYS.locale);
  return saved && isLocale(saved) ? saved : DEFAULT_LOCALE;
}

export async function writeLocale(locale: Locale): Promise<void> {
  await setString(KEYS.locale, locale);
}
