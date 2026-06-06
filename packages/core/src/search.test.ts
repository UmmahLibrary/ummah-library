import { describe, expect, it } from "vitest";
import { type SearchEntry, normalizeForSearch, searchVerses } from "./search";

const entries: SearchEntry[] = [
  { key: "1:1", sura: 1, aya: 1, source: "en", text: "In the name of Allah, the Most Merciful" },
  { key: "1:2", sura: 1, aya: 2, source: "en", text: "All praise is for Allah, Lord of the worlds" },
  { key: "2:255", sura: 2, aya: 255, source: "en", text: "Allah! There is no god but He, the Ever-Living" },
  { key: "1:1", sura: 1, aya: 1, source: "ar", text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" },
];

describe("normalizeForSearch", () => {
  it("strips Latin diacritics and lowercases", () => {
    expect(normalizeForSearch("Jalāl")).toBe("jalal");
  });

  it("strips Arabic harakat and unifies alef variants", () => {
    expect(normalizeForSearch("ٱلْحَمْدُ")).toBe(normalizeForSearch("الحمد"));
  });
});

describe("searchVerses", () => {
  it("returns [] for a blank query", () => {
    expect(searchVerses(entries, "   ")).toEqual([]);
  });

  it("finds verses by a single token, case-insensitively", () => {
    const r = searchVerses(entries, "merciful");
    expect(r).toHaveLength(1);
    expect(r[0]!.key).toBe("1:1");
    expect(r[0]!.source).toBe("en");
  });

  it("requires all tokens to be present (AND match)", () => {
    expect(searchVerses(entries, "praise worlds")).toHaveLength(1);
    expect(searchVerses(entries, "praise nonexistent")).toHaveLength(0);
  });

  it("ranks a whole-phrase match above scattered tokens", () => {
    const data: SearchEntry[] = [
      { key: "3:1", sura: 3, aya: 1, source: "en", text: "patience is light and light is patience" },
      { key: "3:2", sura: 3, aya: 2, source: "en", text: "have patience in light hardship of light" },
    ];
    const r = searchVerses(data, "patience light");
    expect(r[0]!.key).toBe("3:1");
  });

  it("matches Arabic regardless of tashkeel", () => {
    const r = searchVerses(entries, "الرحمن");
    expect(r.map((x) => x.source)).toContain("ar");
  });

  it("honours the limit", () => {
    expect(searchVerses(entries, "allah", 2)).toHaveLength(2);
  });
});
