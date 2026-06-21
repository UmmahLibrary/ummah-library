import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearHistory, readHistory, writeHistory } from "./search-history-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("search-history-store", () => {
  it("reads an empty history by default", () => {
    expect(readHistory()).toEqual([]);
  });

  it("round-trips and clears the history", () => {
    writeHistory(["fatiha", "ayatul kursi"]);
    expect(readHistory()).toEqual(["fatiha", "ayatul kursi"]);
    clearHistory();
    expect(readHistory()).toEqual([]);
  });

  it("falls back to empty on a malformed value", () => {
    localStorage.setItem("ul.searchHistory", "{nope");
    expect(readHistory()).toEqual([]);
  });
});
