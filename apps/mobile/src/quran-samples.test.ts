import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SAMPLE_FATIHA_2 } from "./quran-samples";

const DATA = resolve(__dirname, "../../../packages/data/datasets");
const load = (f: string) =>
  JSON.parse(readFileSync(resolve(DATA, f), "utf8")) as {
    verses: { sura: number; aya: number; text: string }[];
  };

describe("Quran sample shown in the size controls", () => {
  it("matches the datasets exactly, every letter and ḥaraka", () => {
    const find = (f: string) =>
      load(f).verses.find((v) => v.sura === SAMPLE_FATIHA_2.sura && v.aya === SAMPLE_FATIHA_2.aya)
        ?.text;
    // Exact code-point equality — Quranic text is never normalized.
    expect(SAMPLE_FATIHA_2.arabic).toBe(find("arabic-uthmani.json"));
    expect(SAMPLE_FATIHA_2.english).toBe(find("translations/eng-khattab.json"));
  });
});
