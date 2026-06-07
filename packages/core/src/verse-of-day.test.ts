import { describe, expect, it } from "vitest";
import { TOTAL_AYAHS, isValidVerseRef, ordinalToRef, verseOfDay } from "./quran-structure";

describe("ordinalToRef", () => {
  it("maps boundaries across surah edges", () => {
    expect(ordinalToRef(1)).toEqual({ sura: 1, aya: 1 });
    expect(ordinalToRef(7)).toEqual({ sura: 1, aya: 7 }); // Al-Fatiha has 7
    expect(ordinalToRef(8)).toEqual({ sura: 2, aya: 1 });
    expect(ordinalToRef(TOTAL_AYAHS)).toEqual({ sura: 114, aya: 6 });
  });
  it("clamps out-of-range ordinals", () => {
    expect(ordinalToRef(0)).toEqual({ sura: 1, aya: 1 });
    expect(ordinalToRef(99999)).toEqual({ sura: 114, aya: 6 });
  });
});

describe("verseOfDay", () => {
  it("is deterministic for a date and always a valid ayah", () => {
    const a = verseOfDay("2026-06-07");
    expect(verseOfDay("2026-06-07")).toEqual(a);
    expect(isValidVerseRef(a.sura, a.aya)).toBe(true);
  });
  it("varies across days", () => {
    const days = ["2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11"];
    const keys = new Set(days.map((d) => `${verseOfDay(d).sura}:${verseOfDay(d).aya}`));
    expect(keys.size).toBeGreaterThan(1);
  });
});
