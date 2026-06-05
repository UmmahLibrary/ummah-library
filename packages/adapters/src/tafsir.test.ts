import { PluginRegistry, type TafsirPlugin } from "@ummahlibrary/core";
import { describe, expect, it } from "vitest";
import { HttpTafsirRepository } from "./tafsir";

const ibnKathir: TafsirPlugin = {
  kind: "tafsir",
  id: "en-ibn-kathir",
  name: "Tafsir Ibn Kathir",
  author: "Ibn Kathir",
  language: "en",
  direction: "ltr",
  surahUrlTemplate: "https://cdn.example/tafsir/{surah}.json",
};

const SURAH_1 = [
  { surah: 1, ayah: 1, text: "Commentary on 1:1" },
  { surah: 1, ayah: 2, text: "Commentary on 1:2" },
];

/** A fake `fetch` that records the URL and returns canned JSON. */
function fakeFetch(payload: unknown, ok = true) {
  const calls: string[] = [];
  const fn = ((url: string) => {
    calls.push(url);
    return Promise.resolve({ ok, json: () => Promise.resolve(payload) } as Response);
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe("HttpTafsirRepository", () => {
  it("fetches a surah's tafsir from the plugin's URL and maps it", async () => {
    const { fn, calls } = fakeFetch(SURAH_1);
    const repo = new HttpTafsirRepository(new PluginRegistry([ibnKathir]), fn);

    const entries = await repo.getSurahTafsir("en-ibn-kathir", 1);
    expect(calls).toEqual(["https://cdn.example/tafsir/1.json"]);
    expect(entries).toEqual([
      { sura: 1, aya: 1, tafsirId: "en-ibn-kathir", text: "Commentary on 1:1" },
      { sura: 1, aya: 2, tafsirId: "en-ibn-kathir", text: "Commentary on 1:2" },
    ]);
  });

  it("resolves a single ayah's tafsir", async () => {
    const { fn } = fakeFetch(SURAH_1);
    const repo = new HttpTafsirRepository(new PluginRegistry([ibnKathir]), fn);
    expect(await repo.getAyahTafsir("en-ibn-kathir", { sura: 1, aya: 2 })).toMatchObject({
      aya: 2,
      text: "Commentary on 1:2",
    });
  });

  it("returns [] for an unknown tafsir id", async () => {
    const { fn } = fakeFetch(SURAH_1);
    const repo = new HttpTafsirRepository(new PluginRegistry([ibnKathir]), fn);
    expect(await repo.getSurahTafsir("nope", 1)).toEqual([]);
  });
});
