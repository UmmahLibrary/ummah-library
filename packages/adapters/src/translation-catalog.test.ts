import { describe, expect, it } from "vitest";
import { HttpTranslationCatalog } from "./translation-catalog";

const EDITIONS = {
  eng_khattab: {
    name: "eng-mustafakhattaba",
    author: "Mustafa Khattab",
    language: "English",
    direction: "ltr",
  },
  urd_jalandhri: {
    name: "urd-fatehmuhammadjalandhri",
    author: "Fateh Muhammad Jalandhri",
    language: "Urdu",
    direction: "rtl",
  },
};

const SURAH_1 = {
  chapter: [
    { chapter: 1, verse: 1, text: "In the Name of Allah" },
    { chapter: 1, verse: 2, text: "All praise is for Allah" },
  ],
};

function fakeFetch(byUrl: Record<string, unknown>) {
  const calls: string[] = [];
  const fn = ((url: string) => {
    calls.push(url);
    const payload = byUrl[url];
    return Promise.resolve({
      ok: payload !== undefined,
      json: () => Promise.resolve(payload),
    } as Response);
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const BASE = "https://cdn.example/quran";

describe("HttpTranslationCatalog", () => {
  it("lists editions sorted by language then name, mapping author→name", async () => {
    const { fn } = fakeFetch({ [`${BASE}/editions.json`]: EDITIONS });
    const catalog = new HttpTranslationCatalog(fn, BASE);
    const list = await catalog.listTranslations();
    expect(list).toEqual([
      {
        id: "eng-mustafakhattaba",
        name: "Mustafa Khattab",
        author: "Mustafa Khattab",
        language: "English",
        direction: "ltr",
      },
      {
        id: "urd-fatehmuhammadjalandhri",
        name: "Fateh Muhammad Jalandhri",
        author: "Fateh Muhammad Jalandhri",
        language: "Urdu",
        direction: "rtl",
      },
    ]);
  });

  it("caches the edition list across calls (one fetch)", async () => {
    const { fn, calls } = fakeFetch({ [`${BASE}/editions.json`]: EDITIONS });
    const catalog = new HttpTranslationCatalog(fn, BASE);
    await catalog.listTranslations();
    await catalog.listTranslations();
    expect(calls).toEqual([`${BASE}/editions.json`]);
  });

  it("fetches a surah's translation and maps the chapter rows", async () => {
    const { fn } = fakeFetch({ [`${BASE}/editions/eng-mustafakhattaba/1.json`]: SURAH_1 });
    const catalog = new HttpTranslationCatalog(fn, BASE);
    const ayahs = await catalog.getSurahTranslation("eng-mustafakhattaba", 1);
    expect(ayahs).toEqual([
      { sura: 1, aya: 1, translationId: "eng-mustafakhattaba", text: "In the Name of Allah" },
      { sura: 1, aya: 2, translationId: "eng-mustafakhattaba", text: "All praise is for Allah" },
    ]);
  });

  it("returns [] when the edition or surah is unavailable", async () => {
    const { fn } = fakeFetch({});
    const catalog = new HttpTranslationCatalog(fn, BASE);
    expect(await catalog.getSurahTranslation("nope", 1)).toEqual([]);
  });
});
