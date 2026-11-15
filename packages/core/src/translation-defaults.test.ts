import { describe, expect, it } from "vitest";
import {
  defaultTranslations,
  defaultTranslationsFor,
  editionLangCode,
  isRtlLanguage,
} from "./translation-defaults";

describe("default translation by language (ADR 0041)", () => {
  it("follows the language, with none for Arabic and English as the fallback", () => {
    expect(defaultTranslationsFor("ur-PK")).toEqual(["urd-fatehmuhammadja"]);
    expect(defaultTranslationsFor("tr")).toEqual(["tur-diyanetisleri"]);
    expect(defaultTranslationsFor("ar")).toEqual([]);
    expect(defaultTranslationsFor("xx")).toEqual(["eng-mustafakhattaba"]);
    expect(defaultTranslationsFor(null)).toEqual(["eng-mustafakhattaba"]);
  });

  it("prefers a non-English interface language over the device's", () => {
    expect(defaultTranslations("ur", "en-US")).toEqual(["urd-fatehmuhammadja"]);
    expect(defaultTranslations("en", "bn-BD")).toEqual(["ben-muhiuddinkhan"]);
    expect(defaultTranslations(null, "id-ID")).toEqual(["ind-indonesianislam"]);
  });

  it("maps edition languages to codes and directions", () => {
    expect(editionLangCode("Urdu")).toBe("ur");
    expect(editionLangCode("en")).toBe("en");
    expect(isRtlLanguage("ur")).toBe(true);
    expect(isRtlLanguage("en")).toBe(false);
  });
});
