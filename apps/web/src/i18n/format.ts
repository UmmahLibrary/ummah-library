/**
 * Tiny, dependency-free formatting helpers for UI strings (#208, ADR 0040).
 * Pure functions — no React — so they are unit-tested directly.
 */
import { type HijriDate, hijriMonth } from "@ummahlibrary/core";
import type { Locale } from "./config";

/**
 * The digits each locale shows its interface counts in (CLDR native digits).
 * Set explicitly because ICU builds differ on the default for `ar`/`ur`.
 * Interface numbers only — the Quran's own āyah-end markers are never touched.
 */
const NUMBERING: Record<Locale, string> = {
  en: "latn",
  ar: "arab", // ٠١٢٣٤٥٦٧٨٩ Arabic-Indic
  ur: "arabext", // ۰۱۲۳۴۵۶۷۸۹ Extended Arabic-Indic
  id: "latn",
  bn: "beng", // ০১২৩৪৫৬৭৮৯ Bengali
  tr: "latn",
};

const cache = new Map<Locale, Intl.NumberFormat>();

/** Format a count for display in the given UI locale. */
export function formatNumber(n: number, locale: Locale): string {
  let nf = cache.get(locale);
  if (!nf) {
    try {
      nf = new Intl.NumberFormat(locale, { numberingSystem: NUMBERING[locale] });
    } catch {
      nf = new Intl.NumberFormat("en");
    }
    cache.set(locale, nf);
  }
  return nf.format(n);
}

export type FmtVars = Record<string, string | number>;

/**
 * Fill `{name}` placeholders in a message. Numeric values are localized with
 * `formatNumber` when a locale is given; strings are inserted as-is (so a surah
 * name or an `2:255` key is never re-digited). Unknown placeholders stay visible.
 */
export function fmt(template: string, vars: FmtVars, locale?: Locale): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const v = vars[name];
    if (v === undefined) return whole;
    return typeof v === "number" && locale ? formatNumber(v, locale) : String(v);
  });
}

/** A BCP 47 tag that pins the locale's digits, for `toLocaleDateString` etc. */
export function intlTag(locale: Locale): string {
  return `${locale}-u-nu-${NUMBERING[locale]}`;
}

/**
 * Today's Hijri date for the interface language. Arabic and Urdu use the
 * Arabic month name and "هـ"; the others keep the transliterated name. Digits
 * follow the locale. Built as one coherent string so a right-to-left page
 * doesn't scramble a Latin "12 … 1448 AH" into "… 1448 AH 12".
 */
export function formatHijriFor(date: HijriDate, locale: Locale): string {
  const m = hijriMonth(date.month);
  const day = formatNumber(date.day, locale);
  const year = formatNumber(date.year, locale);
  // Year digits without grouping ("1,448" would be wrong).
  const plainYear = year.replace(/[,.٬،\s]/g, "");
  if (locale === "ar" || locale === "ur") return `${day} ${m.arabic} ${plainYear} هـ`;
  return `${day} ${m.name} ${plainYear} AH`;
}
