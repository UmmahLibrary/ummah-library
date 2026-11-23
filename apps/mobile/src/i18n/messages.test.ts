import { describe, expect, it } from "vitest";
import { MESSAGES, en } from "./messages";
import { LOCALES } from "./config";

// Intentional exceptions, kept explicit so anything else still fails:
// - set.p.englishNote is shown only to non-English readers ("the English text
//   is the binding version"), so its English value is empty on purpose.
// - Singular "…One" forms may spell the number as a word (Arabic "صفحة واحدة").
const EMPTY_OK = new Set(["en set.p.englishNote"]);
const singular = (key: string) => key.endsWith("One");

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("mobile interface translations", () => {
  it("has a catalogue for every interface language", () => {
    for (const l of LOCALES) expect(MESSAGES[l.code], l.code).toBeDefined();
  });

  it("never leaves a translation empty", () => {
    const empty: string[] = [];
    for (const [locale, messages] of Object.entries(MESSAGES)) {
      for (const [key, value] of Object.entries(messages)) {
        if ((!value || !value.trim()) && !EMPTY_OK.has(`${locale} ${key}`))
          empty.push(`${locale} ${key}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it("keeps every {placeholder} of the English text in every language", () => {
    const mismatched: string[] = [];
    for (const [locale, messages] of Object.entries(MESSAGES)) {
      if (locale === "en") continue;
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        const a = placeholders(en[key]).join(",");
        const b = placeholders(messages[key]).join(",");
        if (a !== b && !(singular(key) && b === ""))
          mismatched.push(`${locale} ${key}: {${a}} vs {${b}}`);
      }
    }
    expect(mismatched).toEqual([]);
  });
});
