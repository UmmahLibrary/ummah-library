import { describe, expect, it } from "vitest";
import { hadithGradeCategory } from "./hadith";

describe("hadithGradeCategory", () => {
  it("treats Bukhārī and Muslim as Ṣaḥīḥ by consensus (ungraded at source)", () => {
    expect(hadithGradeCategory("eng-bukhari", [])).toBe("sahih");
    expect(hadithGradeCategory("eng-muslim", [])).toBe("sahih");
  });

  it("prefers al-Albānī's grade for the Sunan", () => {
    const grades = ["Zubair Ali Zai: Daif", "Al-Albani: Sahih"];
    expect(hadithGradeCategory("eng-abudawud", grades)).toBe("sahih");
  });

  it("classifies daif / weak gradings", () => {
    expect(hadithGradeCategory("eng-tirmidhi", ["Al-Albani: Daif"])).toBe("daif");
    expect(hadithGradeCategory("eng-tirmidhi", ["Al-Albani: Da'eef"])).toBe("daif");
    expect(hadithGradeCategory("eng-nasai", ["Al-Albani: Shadh"])).toBe("daif");
  });

  it("treats 'Hasan Sahih' and 'Sahih Lighairihi' as Ṣaḥīḥ", () => {
    expect(hadithGradeCategory("eng-tirmidhi", ["Al-Albani: Hasan Sahih"])).toBe("sahih");
    expect(hadithGradeCategory("eng-abudawud", ["Shuaib Al Arnaut: Sahih Lighairihi"])).toBe("sahih");
  });

  it("classifies hasan when not sahih", () => {
    expect(hadithGradeCategory("eng-tirmidhi", ["Al-Albani: Hasan"])).toBe("hasan");
    expect(hadithGradeCategory("eng-abudawud", ["Zubair Ali Zai: Isnaad Hasan"])).toBe("hasan");
  });

  it("falls back to the first grade when al-Albānī is absent, and unknown when empty", () => {
    expect(hadithGradeCategory("eng-tirmidhi", ["Bashar Awad Maarouf: Hasan"])).toBe("hasan");
    expect(hadithGradeCategory("eng-abudawud", [])).toBe("unknown");
  });
});
