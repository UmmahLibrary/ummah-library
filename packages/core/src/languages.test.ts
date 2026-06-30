import { describe, expect, it } from "vitest";
import { LANGUAGE_NAMES, displayLanguage } from "./languages";

describe("displayLanguage", () => {
  it("returns English and native names for known codes", () => {
    expect(displayLanguage("en")).toEqual({ english: "English", native: "English" });
    expect(displayLanguage("ur")).toEqual({ english: "Urdu", native: "اردو" });
    expect(displayLanguage("bn")).toEqual({ english: "Bengali", native: "বাংলা" });
  });

  it("is case-insensitive on the code", () => {
    expect(displayLanguage("UR")).toEqual(LANGUAGE_NAMES.ur);
  });

  it("covers every code our editions currently use", () => {
    for (const code of ["en", "ur", "bn"]) {
      expect(LANGUAGE_NAMES[code]).toBeDefined();
    }
  });

  it("falls back to a title-cased code for unknown languages", () => {
    expect(displayLanguage("xyz")).toEqual({ english: "Xyz", native: "Xyz" });
  });

  it("title-cases the first letter and lowercases the tail of an unknown code", () => {
    expect(displayLanguage("XYZ")).toEqual({ english: "Xyz", native: "Xyz" });
  });
});

describe("LANGUAGE_NAMES table", () => {
  it("exposes the expected ISO-639 code set", () => {
    expect(Object.keys(LANGUAGE_NAMES)).toEqual([
      "ar", "bn", "de", "en", "es", "fa", "fr", "hi", "id", "ml",
      "ms", "nl", "ps", "pt", "ru", "sq", "sw", "ta", "tr", "ur", "zh",
    ]);
  });

  it("gives every language a non-empty English name and endonym", () => {
    for (const [code, n] of Object.entries(LANGUAGE_NAMES)) {
      expect(n.english.length, code).toBeGreaterThan(0);
      expect(n.native.length, code).toBeGreaterThan(0);
    }
  });

  it("pins representative English labels and native endonyms", () => {
    expect(LANGUAGE_NAMES.ar).toEqual({ english: "Arabic", native: "العربية" });
    expect(LANGUAGE_NAMES.zh).toEqual({ english: "Chinese", native: "中文" });
    expect(LANGUAGE_NAMES.tr).toEqual({ english: "Turkish", native: "Türkçe" });
  });
});
