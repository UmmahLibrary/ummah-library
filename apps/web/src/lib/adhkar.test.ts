import { describe, expect, it } from "vitest";
import { adhkarToday, readAdhkarCounts, writeAdhkarCounts } from "./adhkar";

describe("adhkar daily counts", () => {
  it("formats today as local YYYY-MM-DD", () => {
    expect(adhkarToday(new Date(2026, 5, 3))).toBe("2026-06-03");
  });

  it("is empty by default", () => {
    expect(readAdhkarCounts()).toEqual({});
  });

  it("round-trips today's tallies", () => {
    writeAdhkarCounts({ a: 3, b: 1 });
    expect(readAdhkarCounts()).toEqual({ a: 3, b: 1 });
  });

  it("resets when the stored day is not today", () => {
    localStorage.setItem("ul.adhkar", JSON.stringify({ date: "2000-01-01", counts: { a: 5 } }));
    expect(readAdhkarCounts()).toEqual({});
  });
});
