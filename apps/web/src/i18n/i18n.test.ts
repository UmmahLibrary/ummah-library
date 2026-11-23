import { describe, expect, it } from "vitest";
import { LOCALES, isLocale, localeDir } from "./config";
import { fmt, formatHijriFor, formatNumber, intlTag } from "./format";
import { MESSAGES, en, type MessageKey } from "./messages";

const KEYS = Object.keys(en) as MessageKey[];
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("locales", () => {
  it("ships the six wave-1 languages with the right direction", () => {
    expect(LOCALES.map((l) => l.code)).toEqual(["en", "ar", "ur", "id", "bn", "tr"]);
    expect(localeDir("ar")).toBe("rtl");
    expect(localeDir("ur")).toBe("rtl");
    for (const code of ["en", "id", "bn", "tr"] as const) expect(localeDir(code)).toBe("ltr");
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  for (const { code } of LOCALES) {
    it(`${code}: every key has a non-empty value with the same placeholders`, () => {
      const cat = MESSAGES[code];
      expect(Object.keys(cat).sort()).toEqual([...KEYS].sort());
      for (const k of KEYS) {
        expect(cat[k].trim(), `${code} ${k}`).not.toBe("");
        expect(placeholders(cat[k]), `${code} ${k}`).toEqual(placeholders(en[k]));
      }
    });
  }
});

describe("formatNumber", () => {
  it("uses each locale's own digits", () => {
    expect(formatNumber(255, "en")).toBe("255");
    expect(formatNumber(255, "ar")).toBe("٢٥٥");
    expect(formatNumber(255, "ur")).toBe("۲۵۵");
    expect(formatNumber(255, "bn")).toBe("২৫৫");
    expect(formatNumber(255, "id")).toBe("255");
    expect(formatNumber(255, "tr")).toBe("255");
  });

  it("pins the digits in date tags too", () => {
    expect(intlTag("ar")).toBe("ar-u-nu-arab");
  });
});

describe("fmt", () => {
  it("fills placeholders and localizes only numbers", () => {
    expect(fmt("Āyah {aya} of {total}", { aya: 2, total: 7 })).toBe("Āyah 2 of 7");
    expect(fmt("{n} · {ref}", { n: 12, ref: "2:255" }, "ar")).toBe("١٢ · 2:255");
    expect(fmt("Hi {who}", {})).toBe("Hi {who}");
  });
});

describe("formatHijriFor", () => {
  const date = { year: 1448, month: 6, day: 12 };
  it("keeps English as a transliterated, ungrouped date", () => {
    expect(formatHijriFor(date, "en")).toBe("12 Jumādā al-Ākhirah 1448 AH");
  });
  it("uses the Arabic month name and native digits for Arabic and Urdu", () => {
    expect(formatHijriFor(date, "ar")).toBe("١٢ جمادى الآخرة ١٤٤٨ هـ");
    expect(formatHijriFor(date, "ur")).toBe("۱۲ جمادى الآخرة ۱۴۴۸ هـ");
  });
  it("never groups the year's digits", () => {
    for (const code of ["en", "ar", "ur", "id", "bn", "tr"] as const) {
      expect(formatHijriFor(date, code)).not.toMatch(/\d[,.٬]\d/);
    }
  });
});
