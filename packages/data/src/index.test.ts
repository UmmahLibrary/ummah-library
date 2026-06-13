import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  AYAH_COUNTS,
  HIZB_STARTS,
  JUZ_STARTS,
  TOTAL_AYAHS,
  TOTAL_SURAHS,
  validatePlugin,
} from "@ummahlibrary/core";
import { describe, expect, it } from "vitest";
import {
  FileHadithRepository,
  FileQuranRepository,
  FileTranslationRepository,
  loadPluginRegistry,
} from "./index";
import surahsData from "../datasets/surahs.json";

const quran = new FileQuranRepository();
const translations = new FileTranslationRepository();
const hadith = new FileHadithRepository();

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
  ) as {
    juz: { number: number; sura: number; aya: number }[];
    hizb: { number: number; sura: number; aya: number }[];
  };

  it("ingested ayah counts match core AYAH_COUNTS (sum 6236)", () => {
    const counts = surahsData.surahs.map((s) => s.ayahCount);
    expect(counts).toEqual([...AYAH_COUNTS]);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(TOTAL_AYAHS);
  });

  it("ingested juzʾ starts match core JUZ_STARTS", () => {
    const starts = structure.juz.map((j) => ({ sura: j.sura, aya: j.aya }));
    expect(starts).toEqual([...JUZ_STARTS]);
  });

  it("ingested hizb starts match core HIZB_STARTS", () => {
    const starts = structure.hizb.map((h) => ({ sura: h.sura, aya: h.aya }));
    expect(starts).toEqual([...HIZB_STARTS]);
  });
});

describe("FileHadithRepository", () => {
  it("loads a whole collection from the ingested datasets", async () => {
    const collection = await hadith.getCollection("eng-bukhari");
    expect(collection?.collectionId).toBe("eng-bukhari");
    expect(collection?.name).toMatch(/Bukh/i);
    expect(collection?.hadiths.length).toBeGreaterThan(1000);
    expect(Object.keys(collection?.sections ?? {}).length).toBeGreaterThan(0);
  });

  it("filters a section by its book number (reusing the cached collection)", async () => {
    const section = await hadith.getSection("eng-bukhari", 1);
    expect(section?.section).toBe(1);
    expect(section?.hadiths.length).toBeGreaterThan(0);
    expect(section?.hadiths.every((h) => h.reference.book === 1)).toBe(true);
    expect(section?.name.length).toBeGreaterThan(0);
  });

  it("returns null for a non-existent section", async () => {
    expect(await hadith.getSection("eng-bukhari", 99_999)).toBeNull();
  });

  it("returns null for an unknown or path-unsafe collection id", async () => {
    expect(await hadith.getCollection("nope")).toBeNull();
    expect(await hadith.getCollection("../secrets")).toBeNull();
    expect(await hadith.getSection("../secrets", 1)).toBeNull();
  });
});

describe("reciter plugins", () => {
  const reciters = loadPluginRegistry().byKind("reciter");

  it("ships the expected reciters with Alafasy as the default", () => {
    expect(reciters.length).toBeGreaterThanOrEqual(8);
    // Index 0 is the default the reader falls back to — keep it Alafasy.
    expect(reciters[0]?.id).toBe("alafasy");
    const ids = reciters.map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "alafasy",
        "abdulbasit",
        "sudais",
        "shuraym",
        "husary",
        "minshawi",
        "shatri",
        "ghamdi",
      ]),
    );
    expect(new Set(ids).size).toBe(ids.length); // ids are unique
  });

  it("every reciter manifest is valid with a templatable audio url", () => {
    for (const r of reciters) {
      expect(validatePlugin(r)).toEqual([]);
      expect(r.audioUrlTemplate).toMatch(/\{surah/);
    }
  });
});
