import { describe, expect, it } from "vitest";
import type { Surah } from "@ummahlibrary/core";
import { filterSurahs } from "./surah-filter";

function surah(partial: Partial<Surah> & Pick<Surah, "number" | "name" | "transliteration" | "englishName">): Surah {
  return {
    revelationPlace: "meccan",
    revelationOrder: 1,
    ayahCount: 7,
    rukus: 1,
    hasBismillah: true,
    ...partial,
  };
}

const SURAHS: Surah[] = [
  surah({ number: 1, name: "الفاتحة", transliteration: "Al-Fatiha", englishName: "The Opening" }),
  surah({ number: 2, name: "البقرة", transliteration: "Al-Baqara", englishName: "The Cow" }),
  surah({ number: 19, name: "مريم", transliteration: "Maryam", englishName: "Mary" }),
  surah({ number: 36, name: "يس", transliteration: "Ya-Sin", englishName: "Ya Sin" }),
  surah({ number: 55, name: "الرحمن", transliteration: "Ar-Rahman", englishName: "The Beneficent" }),
];

describe("filterSurahs", () => {
  it("returns nothing for a blank query", () => {
    expect(filterSurahs(SURAHS, "")).toEqual([]);
    expect(filterSurahs(SURAHS, "   ")).toEqual([]);
  });

  it("matches an exact surah number", () => {
    expect(filterSurahs(SURAHS, "36").map((s) => s.number)).toEqual([36]);
  });

  it("matches a numeric prefix", () => {
    expect(filterSurahs(SURAHS, "1").map((s) => s.number)).toEqual([1, 19]);
  });

  it("matches transliteration ignoring separators", () => {
    expect(filterSurahs(SURAHS, "albaqara").map((s) => s.number)).toEqual([2]);
  });

  it("matches the English meaning", () => {
    expect(filterSurahs(SURAHS, "the cow").map((s) => s.number)).toEqual([2]);
  });

  it("matches a partial, case-insensitive query", () => {
    expect(filterSurahs(SURAHS, "rahm").map((s) => s.number)).toEqual([55]);
  });

  it("matches the Arabic name", () => {
    expect(filterSurahs(SURAHS, "مريم").map((s) => s.number)).toEqual([19]);
  });

  it("does not return every surah for an Arabic query (empty-Latin guard)", () => {
    expect(filterSurahs(SURAHS, "البقرة").map((s) => s.number)).toEqual([2]);
  });

  it("honours the result limit", () => {
    expect(filterSurahs(SURAHS, "a", 2)).toHaveLength(2);
  });
});
