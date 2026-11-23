import { describe, expect, it } from "vitest";
import {
  CATALOGUE_LANGUAGE,
  DEFAULT_TRANSLATION_BY_LANGUAGE,
  defaultEditions,
  defaultEditionsFor,
  editionLangCode,
} from "./editions";
import { LOCALES } from "../i18n/config";

describe("translation shown before the reader chooses (ADR 0041)", () => {
  it("follows the language", () => {
    expect(defaultEditionsFor("ur")).toEqual(["urd-fatehmuhammadja"]);
    expect(defaultEditionsFor("bn-BD")).toEqual(["ben-muhiuddinkhan"]);
    expect(defaultEditionsFor("hi")).toEqual(["hin-maulanaazizulha"]);
    expect(defaultEditionsFor("id")).toEqual(["ind-indonesianislam"]);
    expect(defaultEditionsFor("tr")).toEqual(["tur-diyanetisleri"]);
    expect(defaultEditionsFor("en-GB")).toEqual(["eng-mustafakhattaba"]);
  });

  it("shows no translation by default to Arabic readers", () => {
    expect(defaultEditionsFor("ar")).toEqual([]);
    expect(defaultEditions("ar")).toEqual([]);
  });

  it("falls back to English for languages without a default", () => {
    expect(defaultEditionsFor("xx")).toEqual(["eng-mustafakhattaba"]);
  });

  it("prefers the interface language over the browser's", () => {
    expect(defaultEditions("tr")).toEqual(["tur-diyanetisleri"]);
  });

  it("has a default for every interface language", () => {
    for (const l of LOCALES) expect(DEFAULT_TRANSLATION_BY_LANGUAGE[l.code], l.code).toBeDefined();
  });

  it("returns a fresh array the caller may mutate", () => {
    const a = defaultEditionsFor("ur");
    a.push("x");
    expect(defaultEditionsFor("ur")).toEqual(["urd-fatehmuhammadja"]);
  });

  it("maps catalogue language names to lang codes", () => {
    expect(editionLangCode("Urdu")).toBe("ur");
    expect(editionLangCode("ur")).toBe("ur");
    expect(editionLangCode("English")).toBe("en");
    expect(editionLangCode(undefined)).toBeUndefined();
    expect(CATALOGUE_LANGUAGE.tr).toBe("Turkish");
  });
});
