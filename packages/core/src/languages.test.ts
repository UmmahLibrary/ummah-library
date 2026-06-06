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
});
