import { describe, expect, it } from "vitest";
import {
  PluginRegistry,
  type ReciterPlugin,
  type TafsirPlugin,
  type TranslationPlugin,
  fillVerseTemplate,
  reciterAudioUrl,
  tafsirSurahUrl,
  validatePlugin,
} from "./plugins";

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
  it("builds tafsir surah urls", () => {
    expect(tafsirSurahUrl(ibnKathir, 2)).toBe("https://cdn.example/tafsir/ibn-kathir/2.json");
  });
});

describe("validatePlugin", () => {
  it("accepts well-formed plugins", () => {
    expect(validatePlugin(khattab)).toEqual([]);
    expect(validatePlugin(alafasy)).toEqual([]);
    expect(validatePlugin(ibnKathir)).toEqual([]);
  });
  it("reports problems", () => {
    expect(validatePlugin({ ...khattab, source: "" })).toContain("translation: missing source");
    expect(
      validatePlugin({ ...ibnKathir, surahUrlTemplate: "https://x/no-placeholder" }),
    ).toContain("tafsir: surahUrlTemplate must contain {surah}");
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
