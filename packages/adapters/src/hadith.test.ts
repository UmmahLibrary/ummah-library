import { type HadithPlugin, PluginRegistry } from "@ummahlibrary/core";
import { describe, expect, it } from "vitest";
import { HttpHadithRepository } from "./hadith";

const bukhari: HadithPlugin = {
  kind: "hadith",
  id: "eng-bukhari",
  name: "Sahih al-Bukhari",
  language: "en",
  direction: "ltr",
  collection: "eng-bukhari",
  sectionUrlTemplate: "https://cdn.example/hadith/eng-bukhari/sections/{section}.json",
};

const COLLECTION = {
  metadata: { name: "Sahih al Bukhari", sections: { "1": "Revelation", "2": "Belief" } },
  hadiths: [
    {
      hadithnumber: 1,
      text: "Actions are by intentions…",
      grades: [{ name: "Bukhari", grade: "Sahih" }],
      reference: { book: 1, hadith: 1 },
    },
  ],
};

const SECTION_1 = {
  metadata: { name: "Sahih al Bukhari", section: { "1": "Revelation" } },
  hadiths: [
    {
      hadithnumber: 1,
      text: "Actions are by intentions…",
      grades: [{ name: "Bukhari", grade: "Sahih" }],
      reference: { book: 1, hadith: 1 },
    },
    { hadithnumber: 2, text: "…", grades: [], reference: { book: 1, hadith: 2 } },
  ],
};

function fakeFetch(payload: unknown, ok = true) {
  const calls: string[] = [];
  const fn = ((url: string) => {
    calls.push(url);
    return Promise.resolve({ ok, json: () => Promise.resolve(payload) } as Response);
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe("HttpHadithRepository", () => {
  it("fetches a section and maps it (name + hadiths + flattened grades)", async () => {
    const { fn, calls } = fakeFetch(SECTION_1);
    const repo = new HttpHadithRepository(new PluginRegistry([bukhari]), fn);

    const section = await repo.getSection("eng-bukhari", 1);
    expect(calls).toEqual(["https://cdn.example/hadith/eng-bukhari/sections/1.json"]);
    expect(section?.name).toBe("Revelation");
    expect(section?.hadiths).toHaveLength(2);
    expect(section?.hadiths[0]).toMatchObject({
      collectionId: "eng-bukhari",
      number: 1,
      grades: ["Bukhari: Sahih"],
      reference: { book: 1, hadith: 1 },
    });
  });

  it("returns null for an unknown collection", async () => {
    const { fn } = fakeFetch(SECTION_1);
    const repo = new HttpHadithRepository(new PluginRegistry([bukhari]), fn);
    expect(await repo.getSection("nope", 1)).toBeNull();
  });

  it("returns null on a failed fetch", async () => {
    const { fn } = fakeFetch(SECTION_1, false);
    const repo = new HttpHadithRepository(new PluginRegistry([bukhari]), fn);
    expect(await repo.getSection("eng-bukhari", 1)).toBeNull();
  });

  it("fetches a whole collection (derives the URL, maps name + sections + hadiths)", async () => {
    const { fn, calls } = fakeFetch(COLLECTION);
    const repo = new HttpHadithRepository(new PluginRegistry([bukhari]), fn);

    const collection = await repo.getCollection("eng-bukhari");
    expect(calls).toEqual(["https://cdn.example/hadith/eng-bukhari.json"]);
    expect(collection).toMatchObject({
      collectionId: "eng-bukhari",
      name: "Sahih al Bukhari",
      sections: { "1": "Revelation", "2": "Belief" },
    });
    expect(collection?.hadiths[0]).toMatchObject({ number: 1, grades: ["Bukhari: Sahih"] });
  });

  it("defaults sections to empty when the collection metadata omits them", async () => {
    const { fn } = fakeFetch({ metadata: { name: "Sahih al Bukhari" }, hadiths: [] });
    const repo = new HttpHadithRepository(new PluginRegistry([bukhari]), fn);
    expect(await repo.getCollection("eng-bukhari")).toMatchObject({ sections: {}, hadiths: [] });
  });

  it("returns null for an unknown collection or a failed fetch", async () => {
    const ok = fakeFetch(COLLECTION);
    const repo = new HttpHadithRepository(new PluginRegistry([bukhari]), ok.fn);
    expect(await repo.getCollection("nope")).toBeNull();

    const bad = fakeFetch(COLLECTION, false);
    const repo2 = new HttpHadithRepository(new PluginRegistry([bukhari]), bad.fn);
    expect(await repo2.getCollection("eng-bukhari")).toBeNull();
  });
});
