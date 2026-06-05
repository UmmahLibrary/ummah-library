import { describe, expect, it } from "vitest";
import { TOTAL_JUZ, TOTAL_SURAHS, isValidJuzNumber, isValidSurahNumber } from "./quran-structure";

describe("quran-structure", () => {
  it("knows there are 114 surahs and 30 ajzāʾ", () => {
    expect(TOTAL_SURAHS).toBe(114);
    expect(TOTAL_JUZ).toBe(30);
  });

  it("validates surah numbers within [1, 114]", () => {
    expect(isValidSurahNumber(1)).toBe(true);
    expect(isValidSurahNumber(114)).toBe(true);
    expect(isValidSurahNumber(0)).toBe(false);
    expect(isValidSurahNumber(115)).toBe(false);
    expect(isValidSurahNumber(2.5)).toBe(false);
  });

  it("validates juzʾ numbers within [1, 30]", () => {
    expect(isValidJuzNumber(1)).toBe(true);
    expect(isValidJuzNumber(30)).toBe(true);
    expect(isValidJuzNumber(31)).toBe(false);
  });
});
