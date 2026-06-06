import { describe, expect, it } from "vitest";
import type { Translation } from "./entities";
import {
  filterTranslations,
  groupTranslationsByLanguage,
  normalize,
  resolveActiveTranslation,
} from "./translations";

const khattab: Translation = {
  id: "eng-khattab",
  name: "The Clear Quran",
  author: "Mustafa Khattab",
  language: "en",
  direction: "ltr",
};
const haleem: Translation = {
  id: "eng-haleem",
  name: "Abdel Haleem",
  author: "M.A.S. Abdel Haleem",
  language: "en",
  direction: "ltr",
};
const jalandhry: Translation = {
  id: "urd-jalandhry",
  name: "Jalandhry",
  author: "Fateh Muhammad Jalāndhrī",
  language: "ur",
  direction: "rtl",
};
const ahmedali: Translation = {
  id: "urd-ahmedali",
  name: "Ahmed Ali",
  author: "Ahmed Ali",
  language: "ur",
  direction: "rtl",
};
const muhiuddin: Translation = {
  id: "ben-muhiuddinkhan",
  name: "Muhiuddin Khan",
  author: "Muhiuddin Khan",
  language: "bn",
  direction: "ltr",
};

const all = [khattab, jalandhry, muhiuddin, haleem, ahmedali];

describe("normalize", () => {
  it("lowercases, trims, and strips diacritics", () => {
    expect(normalize("  Jalāl  ")).toBe("jalal");
    expect(normalize("Türkçe")).toBe("turkce");
  });
});

describe("groupTranslationsByLanguage", () => {
  it("orders groups by English language name", () => {
    const groups = groupTranslationsByLanguage(all);
    expect(groups.map((g) => g.code)).toEqual(["bn", "en", "ur"]);
    expect(groups.map((g) => g.english)).toEqual(["Bengali", "English", "Urdu"]);
  });

  it("attaches native names and sorts editions within a group by name", () => {
    const groups = groupTranslationsByLanguage(all);
    const urdu = groups.find((g) => g.code === "ur")!;
    expect(urdu.native).toBe("اردو");
    expect(urdu.translations.map((t) => t.id)).toEqual(["urd-ahmedali", "urd-jalandhry"]);
  });

  it("collapses a single-language list into one group", () => {
    const groups = groupTranslationsByLanguage([khattab, haleem]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.translations).toHaveLength(2);
  });

  it("returns an empty array for no translations", () => {
    expect(groupTranslationsByLanguage([])).toEqual([]);
  });
});

describe("filterTranslations", () => {
  it("returns all entries for an empty or whitespace query", () => {
    expect(filterTranslations(all, "")).toEqual(all);
    expect(filterTranslations(all, "   ")).toEqual(all);
  });

  it("matches on edition name, case-insensitively", () => {
    expect(filterTranslations(all, "clear")).toEqual([khattab]);
  });

  it("matches on author", () => {
    expect(filterTranslations(all, "khan").map((t) => t.id)).toEqual(["ben-muhiuddinkhan"]);
  });

  it("matches on language English and native names", () => {
    expect(filterTranslations(all, "urdu").map((t) => t.language)).toEqual(["ur", "ur"]);
    expect(filterTranslations(all, "اردو")).toHaveLength(2);
  });

  it("is diacritic-insensitive (plain query matches accented data)", () => {
    // author is "Fateh Muhammad Jalāndhrī" — searching without accents matches.
    expect(filterTranslations(all, "jalandhri")).toEqual([jalandhry]);
  });

  it("returns nothing when no edition matches", () => {
    expect(filterTranslations(all, "zzzz")).toEqual([]);
  });
});

describe("resolveActiveTranslation", () => {
  it("keeps the saved choice when it is still shortlisted", () => {
    expect(resolveActiveTranslation(["eng-khattab", "urd-jalandhry"], "urd-jalandhry", "x")).toBe(
      "urd-jalandhry",
    );
  });

  it("falls back to the first shortlisted edition when the saved one is gone", () => {
    expect(resolveActiveTranslation(["eng-khattab", "urd-jalandhry"], "ben-removed", "x")).toBe(
      "eng-khattab",
    );
  });

  it("falls back to the first shortlisted edition when nothing is saved", () => {
    expect(resolveActiveTranslation(["eng-khattab"], null, "x")).toBe("eng-khattab");
  });

  it("falls back to the default when nothing is shortlisted", () => {
    expect(resolveActiveTranslation([], "anything", "eng-khattab")).toBe("eng-khattab");
    expect(resolveActiveTranslation([], null, "eng-khattab")).toBe("eng-khattab");
  });
});
