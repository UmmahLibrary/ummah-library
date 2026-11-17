import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { QURAN_SAMPLES } from "./quran-samples";

const DATA = resolve(__dirname, "../../../../packages/data/datasets");
const load = (f: string) =>
  JSON.parse(readFileSync(resolve(DATA, f), "utf8")) as {
    verses: { sura: number; aya: number; text: string }[];
  };

describe("Quran samples shown in the interface", () => {
  const arabic = load("arabic-uthmani.json");
  const english = load("translations/eng-khattab.json");
  const find = (d: typeof arabic, s: number, a: number) =>
    d.verses.find((v) => v.sura === s && v.aya === a)?.text;

  it.each(QURAN_SAMPLES.map((s) => [`${s.sura}:${s.aya}`, s] as const))(
    "%s matches the dataset exactly, every letter and ḥaraka",
    (_key, sample) => {
      // Exact code-point equality. Never NFC-normalize Quranic text: Tanzil
      // stores shadda before fatḥa (e.g. لِلَّهِ) and NFC would reorder them.
      expect(sample.arabic).toBe(find(arabic, sample.sura, sample.aya));
      expect(sample.english).toBe(find(english, sample.sura, sample.aya));
    },
  );

  it("documents why display text is never NFC-normalized", () => {
    const allah = find(arabic, 1, 2)!;
    expect(allah.normalize("NFC")).not.toBe(allah);
  });
});
