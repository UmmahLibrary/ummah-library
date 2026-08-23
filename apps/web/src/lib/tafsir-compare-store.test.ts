import { afterEach, describe, expect, it } from "vitest";
import { readTafsirCompare, writeTafsirCompare } from "./tafsir-compare-store";

afterEach(() => localStorage.clear());

describe("tafsir compare store", () => {
  it("returns an empty set when nothing has been chosen", () => {
    expect(readTafsirCompare()).toEqual([]);
  });

  it("round-trips a chosen comparison set", () => {
    writeTafsirCompare(["ibn-kathir", "tabari"]);
    expect(readTafsirCompare()).toEqual(["ibn-kathir", "tabari"]);
  });

  it("falls back to an empty set for corrupt JSON instead of throwing", () => {
    localStorage.setItem("ul.tafsirCompare", "{not json");
    expect(readTafsirCompare()).toEqual([]);
  });

  it("falls back to an empty set for a non-array or non-string-array value", () => {
    localStorage.setItem("ul.tafsirCompare", JSON.stringify({ foo: "bar" }));
    expect(readTafsirCompare()).toEqual([]);
    localStorage.setItem("ul.tafsirCompare", JSON.stringify([1, 2, 3]));
    expect(readTafsirCompare()).toEqual([]);
  });
});
