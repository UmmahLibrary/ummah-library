import { describe, expect, it } from "vitest";
import {
  type HadithPlugin,
  PluginRegistry,
  type ReciterPlugin,
  type TafsirPlugin,
  type TranslationPlugin,
  fillVerseTemplate,
  hadithSectionUrl,
  quranComAudioUrl,
  reciterAudioUrl,
  tafsirSurahUrl,
  validatePlugin,
} from "./plugins";

const bukhari: HadithPlugin = {
  kind: "hadith",
  id: "eng-bukhari",
  name: "Sahih al-Bukhari",
  language: "en",
  direction: "ltr",
  collection: "eng-bukhari",
  sectionUrlTemplate: "https://cdn.example/hadith/eng-bukhari/sections/{section}.json",
};

const khattab: TranslationPlugin = {
  kind: "translation",
  id: "eng-khattab",
  name: "The Clear Quran",
  author: "Mustafa Khattab",
  language: "en",
  direction: "ltr",
  source: "eng-mustafakhattaba",
};
const alafasy: ReciterPlugin = {
  kind: "reciter",
  id: "alafasy",
  name: "Mishary Alafasy",
  language: "ar",
  audioUrlTemplate: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
};
const ibnKathir: TafsirPlugin = {
  kind: "tafsir",
  id: "en-ibn-kathir",
  name: "Tafsir Ibn Kathir",
  author: "Ibn Kathir",
  language: "en",
  direction: "ltr",
  surahUrlTemplate: "https://cdn.example/tafsir/ibn-kathir/{surah}.json",
};

describe("fillVerseTemplate", () => {
  it("fills plain and zero-padded placeholders", () => {
    expect(fillVerseTemplate("{surah}:{ayah}", { sura: 2, aya: 255 })).toBe("2:255");
    expect(fillVerseTemplate("{surah:3}{ayah:3}", { sura: 1, aya: 1 })).toBe("001001");
  });
});

describe("url helpers", () => {
  it("builds EveryAyah audio urls", () => {
    expect(reciterAudioUrl(alafasy, { sura: 1, aya: 1 })).toBe(
      "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
    );
  });
  it("resolves quran.com timing audio paths (relative, protocol-relative, absolute)", () => {
    // Relative path → resolved against the CDN host.
    expect(quranComAudioUrl("Alafasy/mp3/001001.mp3")).toBe(
      "https://verses.quran.com/Alafasy/mp3/001001.mp3",
    );
    // Protocol-relative (as Husary returns) → keeps its own host, not verses.quran.com.
    expect(quranComAudioUrl("//mirrors.quranicaudio.com/everyayah/Husary_128kbps/001001.mp3")).toBe(
      "https://mirrors.quranicaudio.com/everyayah/Husary_128kbps/001001.mp3",
    );
    // Already-absolute → unchanged.
    expect(quranComAudioUrl("https://cdn.example/x.mp3")).toBe("https://cdn.example/x.mp3");
  });
  it("builds tafsir surah urls", () => {
    expect(tafsirSurahUrl(ibnKathir, 2)).toBe("https://cdn.example/tafsir/ibn-kathir/2.json");
  });
  it("builds hadith section urls", () => {
    expect(hadithSectionUrl(bukhari, 3)).toBe(
      "https://cdn.example/hadith/eng-bukhari/sections/3.json",
    );
  });
});

describe("validatePlugin", () => {
  it("accepts well-formed plugins", () => {
    expect(validatePlugin(khattab)).toEqual([]);
    expect(validatePlugin(alafasy)).toEqual([]);
    expect(validatePlugin(ibnKathir)).toEqual([]);
    expect(validatePlugin(bukhari)).toEqual([]);
  });
  it("reports problems", () => {
    expect(validatePlugin({ ...khattab, source: "" })).toContain("translation: missing source");
    expect(
      validatePlugin({ ...ibnKathir, surahUrlTemplate: "https://x/no-placeholder" }),
    ).toContain("tafsir: surahUrlTemplate must contain {surah}");
    expect(validatePlugin({ ...bukhari, sectionUrlTemplate: "https://x/none" })).toContain(
      "hadith: sectionUrlTemplate must contain {section}",
    );
  });
});

describe("PluginRegistry", () => {
  it("registers, looks up, filters by kind, and respects enabled", () => {
    const registry = new PluginRegistry([
      khattab,
      alafasy,
      ibnKathir,
      { ...khattab, id: "off", enabled: false },
    ]);
    expect(registry.get("eng-khattab")).toBe(khattab);
    expect(registry.byKind("translation").map((p) => p.id)).toEqual(["eng-khattab"]); // "off" excluded
    expect(registry.byKind("reciter")).toHaveLength(1);
    expect(registry.all()).toHaveLength(4);
  });
});
