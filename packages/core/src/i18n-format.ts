/**
 * Interface string formatting shared by web and mobile (ADR 0040/0041). Pure:
 * no React, no platform APIs beyond the standard `Intl`.
 *
 * Interface numbers only — the Quran's own āyah-end markers are never passed
 * through here.
 */

/** The digits each interface language shows its counts in (CLDR native digits). */
export const UI_NUMBERING: Readonly<Record<string, string>> = {
  en: "latn",
  ar: "arab", // ٠١٢٣٤٥٦٧٨٩ Arabic-Indic
  ur: "arabext", // ۰۱۲۳۴۵۶۷۸۹ Extended Arabic-Indic
  id: "latn",
  bn: "beng", // ০১২৩৪৫৬৭৮৯ Bengali
  tr: "latn",
};

const DIGITS: Readonly<Record<string, string>> = {
  arab: "٠١٢٣٤٥٦٧٨٩",
  arabext: "۰۱۲۳۴۵۶۷۸۹",
  beng: "০১২৩৪৫৬৭৮৯",
};

/**
 * Format a count in the interface language. Digits are mapped explicitly, not
 * left to `Intl`, because Hermes and some ICU builds ignore `numberingSystem`.
 */
export function formatUiNumber(n: number, locale: string): string {
  let s: string;
  try {
    s = new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
  } catch {
    s = String(n);
  }
  const digits = DIGITS[UI_NUMBERING[locale] ?? "latn"];
  return digits ? s.replace(/[0-9]/g, (d) => digits[Number(d)]!) : s;
}

export type FmtVars = Record<string, string | number>;

/**
 * Fill `{name}` placeholders. Numbers are localized when a locale is given;
 * strings are inserted as-is (so a surah name or `2:255` is never re-digited).
 * Unknown placeholders stay visible.
 */
export function fmtMessage(template: string, vars: FmtVars, locale?: string): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const v = vars[name];
    if (v === undefined) return whole;
    return typeof v === "number" && locale ? formatUiNumber(v, locale) : String(v);
  });
}
