import { describe, expect, it } from "vitest";
import { type SearchEntry, normalizeForSearch, searchText, searchVerses } from "./search";

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

  it("applies each spelling-variant rule exactly (drops tatweel, ى→ي, ة→ه)", () => {
    // Pins the specific substitution targets so a dropped/changed rule is caught.
    expect(normalizeForSearch("ـ")).toBe(""); // tatweel removed, not replaced with junk
    expect(normalizeForSearch("سۆالـ")).toBe(normalizeForSearch("سۆال")); // tatweel is invisible to search
    expect(normalizeForSearch("ى")).toBe("ي"); // alef maqsura → yaa
    expect(normalizeForSearch("ة")).toBe("ه"); // taa marbuta → haa
    expect(normalizeForSearch("صلوة")).toBe("صلوه"); // in-word taa marbuta
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

describe("scoring (exact, mutation-pinned)", () => {
  const byKey = (rows: { key: string; score: number }[], k: string) =>
    rows.find((x) => x.key === k)!;

  it("rewards a word-boundary hit over a mid-word substring hit", () => {
    const data: SearchEntry[] = [
      { key: "5:1", sura: 5, aya: 1, source: "en", text: "light upon light" }, // boundary
      { key: "5:2", sura: 5, aya: 2, source: "en", text: "a delightful day" }, // 'light' inside 'delight'
    ];
    const r = searchVerses(data, "light");
    expect(byKey(r, "5:1").score).toBe(2); // 1 presence + 1 word-boundary
    expect(byKey(r, "5:2").score).toBe(1); // presence only — no boundary bonus
    expect(r[0]!.key).toBe("5:1");
  });

  it("adds a whole-phrase bonus, and only for multi-token queries", () => {
    const data: SearchEntry[] = [
      { key: "6:1", sura: 6, aya: 1, source: "en", text: "patience light always" }, // contiguous phrase
      { key: "6:2", sura: 6, aya: 2, source: "en", text: "patience then some light" }, // scattered
    ];
    const r = searchVerses(data, "patience light");
    expect(byKey(r, "6:1").score).toBe(6); // 2 + 2 + phrase bonus(=tokens.length 2)
    expect(byKey(r, "6:2").score).toBe(4); // 2 + 2, no contiguous phrase
    expect(r[0]!.key).toBe("6:1");
    // A single-token query must NOT receive a phrase bonus (guard is tokens.length > 1).
    expect(byKey(searchVerses(data, "patience"), "6:1").score).toBe(2); // 1 + boundary, not 3
  });

  it("breaks ties deterministically by sura, then aya, then source", () => {
    // Every row scores the same (one boundary token), so ordering is pure tie-break.
    const data: SearchEntry[] = [
      { key: "2:5e", sura: 2, aya: 5, source: "en", text: "light" },
      { key: "1:9e", sura: 1, aya: 9, source: "en", text: "light" },
      { key: "1:9a", sura: 1, aya: 9, source: "ar", text: "light" },
      { key: "1:3e", sura: 1, aya: 3, source: "en", text: "light" },
    ];
    const r = searchVerses(data, "light");
    expect(r.map((x) => x.key)).toEqual(["1:3e", "1:9a", "1:9e", "2:5e"]);
  });
});

describe("searchText", () => {
  const items = [
    { id: 1, text: "Whoever is patient, Allah will grant him patience" },
    { id: 2, text: "Cleanliness is half of faith" },
    { id: 3, text: "Actions are judged by intentions" },
  ];

  it("returns [] for a blank query", () => {
    expect(searchText(items, "")).toEqual([]);
  });

  it("matches and carries the original fields plus a score", () => {
    const r = searchText(items, "patient");
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe(1);
    expect(r[0]!.score).toBeGreaterThan(0);
  });

  it("requires all tokens (AND match)", () => {
    expect(searchText(items, "faith cleanliness")).toHaveLength(1);
    expect(searchText(items, "faith missing")).toHaveLength(0);
  });

  it("sorts by score high-to-low and honours the limit", () => {
    // Input deliberately leads with the lowest-scoring (substring-only) match, so a
    // dropped/symmetric sort would surface it first.
    const ranked = [
      { id: 1, text: "a delightful day" }, // 'light' inside 'delight' → score 1
      { id: 2, text: "morning light here" }, // boundary → score 2
      { id: 3, text: "light of the world" }, // boundary → score 2
    ];
    const r = searchText(ranked, "light");
    expect(r).toHaveLength(3);
    expect(r[0]!.score).toBe(2); // a score-2 row leads, not the input-first score-1 row
    expect(r[0]!.id).not.toBe(1);
    expect(r.at(-1)!.id).toBe(1); // the score-1 row sinks to the bottom
    expect(searchText(ranked, "light", 1)).toHaveLength(1); // limit applied after sort
  });
});
