import { useI18n } from "../i18n/I18nProvider";
import { localeDir } from "../i18n/config";

/**
 * Native stack headers are drawn by the OS and only mirror with an app-wide
 * `I18nManager` RTL switch (which needs a restart). Until that ships, centre
 * header titles in Arabic and Urdu so the bar reads balanced (ADR 0041).
 */
export function useRtlHeaderOptions(): { headerTitleAlign?: "center" } {
  const { locale } = useI18n();
  return localeDir(locale) === "rtl" ? { headerTitleAlign: "center" } : {};
}
