import { describe, expect, it } from "vitest";
import { HADITH_GRADE_LABEL, hadithGradeCategory } from "./hadith";

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

  it("matches the al-Albānī grader even without the hyphen", () => {
    // Pins the optional hyphen in /al-?albani/: "Alalbani" must still win over the
    // first (daif) grade.
    const grades = ["Zubair Ali Zai: Daif", "Alalbani: Sahih"];
    expect(hadithGradeCategory("eng-abudawud", grades)).toBe("sahih");
  });

  it("classifies a bare grade string with no 'Grader: ' prefix", () => {
    // No ": " separator → the whole string is the grade part; a `includes("")`
    // regression would slice off the first letter and misclassify.
    expect(hadithGradeCategory("eng-x", ["Sahih"])).toBe("sahih");
    expect(hadithGradeCategory("eng-x", ["Daif"])).toBe("daif");
  });

  it("classifies on the grade part, not a grader whose name contains a grade word", () => {
    // "Daifullah" is the grader; the grade is Ṣaḥīḥ. Pins that only the part after
    // ": " is classified (a slice→whole regression would read this as daif).
    expect(hadithGradeCategory("eng-x", ["Daifullah: Sahih"])).toBe("sahih");
  });

  it("returns unknown for an unrecognised grade word (not hasan, not blank)", () => {
    // Reaches the final `return "unknown"`; pins the `g.includes("hasan")` guard
    // and the literal against `if (true)` / `return ""` regressions.
    expect(hadithGradeCategory("eng-x", ["Al-Albani: Maqbul"])).toBe("unknown");
  });
});

describe("HADITH_GRADE_LABEL", () => {
  it("pins a display label for every grade category", () => {
    expect(HADITH_GRADE_LABEL).toEqual({
      sahih: "Ṣaḥīḥ",
      hasan: "Ḥasan",
      daif: "Ḍaʿīf",
      unknown: "Graded",
    });
  });
});
