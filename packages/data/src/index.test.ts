import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AYAH_COUNTS, JUZ_STARTS, TOTAL_AYAHS, TOTAL_SURAHS } from "@ummahlibrary/core";
import { describe, expect, it } from "vitest";
import { FileQuranRepository, FileTranslationRepository } from "./index";
import surahsData from "../datasets/surahs.json";

const quran = new FileQuranRepository();
const translations = new FileTranslationRepository();

describe("FileQuranRepository", () => {
  it("lists all 114 surahs with full metadata", async () => {
    const surahs = await quran.listSurahs();
    expect(surahs).toHaveLength(TOTAL_SURAHS);
    expect(surahs[1]).toMatchObject({
      number: 2,
      englishName: "The Cow",
      revelationPlace: "medinan",
      ayahCount: 286,
      hasBismillah: true,
    });
  });

  it("returns every ayah of a surah", async () => {
    expect(await quran.getSurahAyahs(1)).toHaveLength(7);
    expect(await quran.getSurahAyahs(0)).toEqual([]);
  });

  it("returns null for an out-of-range ayah", async () => {
    expect(await quran.getAyah({ sura: 1, aya: 8 })).toBeNull();
  });
});

describe("Phase 1 definition of done", () => {
  it("gives Surah 2, Ayah 255 with its Urdu (Jalandhry) translation — no app running", async () => {
    const arabic = await quran.getAyah({ sura: 2, aya: 255 });
    expect(arabic).not.toBeNull();
    expect(arabic?.sura).toBe(2);
    expect(arabic?.aya).toBe(255);
    // Ayat al-Kursi is among the longest ayahs — a sanity check that we got
    // real, Basmala-free text (avoids brittle Arabic string literals in tests).
    expect((arabic?.text ?? "").length).toBeGreaterThan(100);

    const urdu = await translations.getTranslatedAyah("urd-jalandhry", { sura: 2, aya: 255 });
    expect(urdu).not.toBeNull();
    expect(urdu?.translationId).toBe("urd-jalandhry");
    expect(urdu?.text.length).toBeGreaterThan(0);
  });
});

describe("FileTranslationRepository", () => {
  it("lists the six ingested editions across four languages", async () => {
    const editions = await translations.listTranslations();
    const ids = editions.map((e) => e.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "eng-khattab",
        "urd-jalandhry",
        "urd-junagarhi",
        "urd-ahmedali",
        "urd-tahirulqadri",
        "ben-muhiuddinkhan",
      ]),
    );
    expect(new Set(editions.map((e) => e.language))).toEqual(new Set(["en", "ur", "bn"]));
  });

  it("returns [] for an unknown edition", async () => {
    expect(await translations.getSurahTranslation("xx-nope", 1)).toEqual([]);
  });
});

describe("datasets agree with the core structural invariants", () => {
  const structure = JSON.parse(
    readFileSync(fileURLToPath(new URL("../datasets/structure.json", import.meta.url)), "utf8"),
  ) as { juz: { number: number; sura: number; aya: number }[] };

  it("ingested ayah counts match core AYAH_COUNTS (sum 6236)", () => {
    const counts = surahsData.surahs.map((s) => s.ayahCount);
    expect(counts).toEqual([...AYAH_COUNTS]);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(TOTAL_AYAHS);
  });

  it("ingested juzʾ starts match core JUZ_STARTS", () => {
    const starts = structure.juz.map((j) => ({ sura: j.sura, aya: j.aya }));
    expect(starts).toEqual([...JUZ_STARTS]);
  });
});
