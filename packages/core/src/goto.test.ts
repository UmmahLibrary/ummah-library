import { describe, expect, it } from "vitest";
import { describeGoTo, foldLatinName, matchSurahNames, parseGoTo, toWesternDigits } from "./goto";
import type { GoToSurahName } from "./goto";

const NAMES: GoToSurahName[] = [
  { number: 1, name: "الفاتحة", transliteration: "Al-Faatiha", englishName: "The Opening" },
  { number: 2, name: "البقرة", transliteration: "Al-Baqara", englishName: "The Cow" },
  {
    number: 3,
    name: "آل عمران",
    transliteration: "Aal-i-Imraan",
    englishName: "The Family of Imraan",
  },
  { number: 18, name: "الكهف", transliteration: "Al-Kahf", englishName: "The Cave" },
  { number: 36, name: "يس", transliteration: "Yaseen", englishName: "Yaseen" },
  { number: 67, name: "الملك", transliteration: "Al-Mulk", englishName: "The Sovereignty" },
  { number: 112, name: "الإخلاص", transliteration: "Al-Ikhlaas", englishName: "Sincerity" },
];

describe("parseGoTo", () => {
  it("reads surah:ayah in every common separator", () => {
    for (const q of ["2:255", "2 255", "2.255", "2/255", "2-255", " 2 : 255 "]) {
      expect(parseGoTo(q, NAMES)).toEqual({ kind: "ayah", sura: 2, aya: 255 });
    }
  });

  it("reads Arabic-Indic and Persian digits", () => {
    expect(parseGoTo("٢:٢٥٥", NAMES)).toEqual({ kind: "ayah", sura: 2, aya: 255 });
    expect(parseGoTo("۱۸:۱۰", NAMES)).toEqual({ kind: "ayah", sura: 18, aya: 10 });
  });

  it("treats a bare number as an āyah of the open surah", () => {
    expect(parseGoTo("67", NAMES, { currentSurah: 25 })).toEqual({
      kind: "ayah",
      sura: 25,
      aya: 67,
    });
    expect(parseGoTo("78", NAMES, { currentSurah: 25 })).toBeNull();
  });

  it("treats a bare number as a surah when no surah is open", () => {
    expect(parseGoTo("67", NAMES)).toEqual({ kind: "surah", sura: 67, aya: 1 });
    expect(parseGoTo("115", NAMES)).toBeNull();
  });

  it("resolves juz, para, page and hizb to their first verse", () => {
    expect(parseGoTo("juz 15", NAMES)).toEqual({ kind: "juz", sura: 17, aya: 1, n: 15 });
    expect(parseGoTo("j15", NAMES)).toEqual({ kind: "juz", sura: 17, aya: 1, n: 15 });
    expect(parseGoTo("para 30", NAMES)).toEqual({ kind: "juz", sura: 78, aya: 1, n: 30 });
    expect(parseGoTo("page 1", NAMES)).toEqual({ kind: "page", sura: 1, aya: 1, n: 1 });
    expect(parseGoTo("p2", NAMES)).toEqual({ kind: "page", sura: 2, aya: 1, n: 2 });
    expect(parseGoTo("hizb 1", NAMES)).toEqual({ kind: "hizb", sura: 1, aya: 1, n: 1 });
  });

  it("rejects out-of-range units instead of clamping", () => {
    expect(parseGoTo("juz 31", NAMES)).toBeNull();
    expect(parseGoTo("page 605", NAMES)).toBeNull();
    expect(parseGoTo("hizb 61", NAMES)).toBeNull();
    expect(parseGoTo("2:287", NAMES)).toBeNull();
    expect(parseGoTo("0:1", NAMES)).toBeNull();
  });

  it("understands surah names in many spellings, with or without an āyah", () => {
    expect(parseGoTo("baqarah 255", NAMES)).toEqual({ kind: "ayah", sura: 2, aya: 255 });
    expect(parseGoTo("Al-Baqara", NAMES)).toEqual({ kind: "surah", sura: 2, aya: 1 });
    expect(parseGoTo("kahf", NAMES)).toEqual({ kind: "surah", sura: 18, aya: 1 });
    expect(parseGoTo("yasin", NAMES)).toEqual({ kind: "surah", sura: 36, aya: 1 });
    expect(parseGoTo("the cave 10", NAMES)).toEqual({ kind: "ayah", sura: 18, aya: 10 });
    expect(parseGoTo("ikhlas", NAMES)).toEqual({ kind: "surah", sura: 112, aya: 1 });
  });

  it("understands Arabic names without diacritics", () => {
    expect(parseGoTo("البقرة ٢٥٥", NAMES)).toEqual({ kind: "ayah", sura: 2, aya: 255 });
    expect(parseGoTo("الكهف", NAMES)).toEqual({ kind: "surah", sura: 18, aya: 1 });
  });

  it("returns null for nonsense", () => {
    expect(parseGoTo("", NAMES)).toBeNull();
    expect(parseGoTo("zzzzqqq", NAMES)).toBeNull();
    expect(parseGoTo("6.5.1", NAMES)).toBeNull();
  });
});

describe("helpers", () => {
  it("folds Latin names", () => {
    expect(foldLatinName("Al-Baqarah")).toBe(foldLatinName("baqara"));
    expect(foldLatinName("Al-Ikhlāṣ")).toBe(foldLatinName("ikhlaas"));
  });

  it("converts digits", () => {
    expect(toWesternDigits("٢٥٥ ۶۷")).toBe("255 67");
  });

  it("ranks exact matches first", () => {
    expect(matchSurahNames("mulk", NAMES)[0]?.number).toBe(67);
  });

  it("describes targets", () => {
    expect(describeGoTo({ kind: "ayah", sura: 2, aya: 255 }, NAMES)).toBe("Al-Baqara · Āyah 255");
    expect(describeGoTo({ kind: "juz", sura: 17, aya: 1, n: 15 }, NAMES)).toContain("Juz 15");
  });
});
