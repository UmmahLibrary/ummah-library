import { describe, expect, it } from "vitest";
import {
  AYAH_COUNTS,
  HIZB_STARTS,
  JUZ_STARTS,
  TOTAL_AYAHS,
  TOTAL_HIZB,
  TOTAL_JUZ,
  TOTAL_PAGES_MADANI,
  TOTAL_SURAHS,
  ayahCountOf,
  compareVerseKeys,
  hizbNumberOf,
  isValidHizbNumber,
  isValidJuzNumber,
  isValidPageNumber,
  isValidSurahNumber,
  isValidVerseRef,
  juzNumberOf,
} from "./quran-structure";

describe("constants", () => {
  it("knows the top-level totals", () => {
    expect(TOTAL_SURAHS).toBe(114);
    expect(TOTAL_JUZ).toBe(30);
    expect(TOTAL_PAGES_MADANI).toBe(604);
    expect(TOTAL_AYAHS).toBe(6236);
  });

  it("has 114 ayah counts that sum to 6236", () => {
    expect(AYAH_COUNTS).toHaveLength(TOTAL_SURAHS);
    expect(AYAH_COUNTS.reduce((a, b) => a + b, 0)).toBe(TOTAL_AYAHS);
  });

  it("has 30 juzʾ starts beginning at 1:1", () => {
    expect(JUZ_STARTS).toHaveLength(TOTAL_JUZ);
    expect(JUZ_STARTS[0]).toEqual({ sura: 1, aya: 1 });
  });

  it("has 60 hizb starts, ascending, beginning at 1:1", () => {
    expect(TOTAL_HIZB).toBe(60);
    expect(HIZB_STARTS).toHaveLength(TOTAL_HIZB);
    expect(HIZB_STARTS[0]).toEqual({ sura: 1, aya: 1 });
    for (let i = 1; i < HIZB_STARTS.length; i++) {
      expect(compareVerseKeys(HIZB_STARTS[i - 1]!, HIZB_STARTS[i]!)).toBeLessThan(0);
    }
  });
});

describe("validators", () => {
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

  it("validates hizb numbers within [1, 60]", () => {
    expect(isValidHizbNumber(1)).toBe(true);
    expect(isValidHizbNumber(60)).toBe(true);
    expect(isValidHizbNumber(61)).toBe(false);
  });

  it("validates page numbers within [1, 604]", () => {
    expect(isValidPageNumber(1)).toBe(true);
    expect(isValidPageNumber(604)).toBe(true);
    expect(isValidPageNumber(605)).toBe(false);
  });

  it("validates verse references against real ayah counts", () => {
    expect(isValidVerseRef(2, 255)).toBe(true); // Ayat al-Kursi exists
    expect(isValidVerseRef(1, 7)).toBe(true);
    expect(isValidVerseRef(1, 8)).toBe(false); // Al-Fatiha has only 7
    expect(isValidVerseRef(2, 287)).toBe(false); // Al-Baqara has 286
    expect(isValidVerseRef(115, 1)).toBe(false);
  });
});

describe("ayahCountOf", () => {
  it("returns known counts", () => {
    expect(ayahCountOf(1)).toBe(7);
    expect(ayahCountOf(2)).toBe(286);
    expect(ayahCountOf(114)).toBe(6);
  });

  it("throws for an invalid surah", () => {
    expect(() => ayahCountOf(0)).toThrow(RangeError);
    expect(() => ayahCountOf(115)).toThrow(RangeError);
  });
});

describe("compareVerseKeys", () => {
  it("orders by surah then ayah", () => {
    expect(compareVerseKeys({ sura: 1, aya: 1 }, { sura: 2, aya: 1 })).toBeLessThan(0);
    expect(compareVerseKeys({ sura: 2, aya: 5 }, { sura: 2, aya: 3 })).toBeGreaterThan(0);
    expect(compareVerseKeys({ sura: 3, aya: 7 }, { sura: 3, aya: 7 })).toBe(0);
  });
});

describe("juzNumberOf", () => {
  it("maps boundary verses to their juzʾ", () => {
    expect(juzNumberOf({ sura: 1, aya: 1 })).toBe(1);
    expect(juzNumberOf({ sura: 2, aya: 141 })).toBe(1); // just before juzʾ 2
    expect(juzNumberOf({ sura: 2, aya: 142 })).toBe(2); // start of juzʾ 2
    expect(juzNumberOf({ sura: 2, aya: 255 })).toBe(3); // Ayat al-Kursi
    expect(juzNumberOf({ sura: 78, aya: 1 })).toBe(30);
    expect(juzNumberOf({ sura: 114, aya: 6 })).toBe(30); // last ayah
  });

  it("throws for an invalid verse", () => {
    expect(() => juzNumberOf({ sura: 1, aya: 99 })).toThrow(RangeError);
  });
});

describe("hizbNumberOf", () => {
  it("maps boundary verses to their hizb", () => {
    expect(hizbNumberOf({ sura: 1, aya: 1 })).toBe(1);
    expect(hizbNumberOf({ sura: 2, aya: 74 })).toBe(1); // just before hizb 2
    expect(hizbNumberOf({ sura: 2, aya: 75 })).toBe(2); // start of hizb 2
    expect(hizbNumberOf({ sura: 87, aya: 1 })).toBe(60); // last hizb
    expect(hizbNumberOf({ sura: 114, aya: 6 })).toBe(60);
  });

  it("throws for an invalid verse", () => {
    expect(() => hizbNumberOf({ sura: 1, aya: 99 })).toThrow(RangeError);
  });
});
