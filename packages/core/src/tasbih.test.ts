import { describe, expect, it } from "vitest";
import { DHIKR_PHRASES, TASBIH_TARGETS, tasbihState } from "./tasbih";

describe("tasbihState", () => {
  it("cycles the count within a round and counts rounds", () => {
    expect(tasbihState(0, 33)).toEqual({ count: 0, rounds: 0, total: 0 });
    expect(tasbihState(1, 33)).toEqual({ count: 1, rounds: 0, total: 1 });
    expect(tasbihState(33, 33)).toEqual({ count: 0, rounds: 1, total: 33 });
    expect(tasbihState(34, 33)).toEqual({ count: 1, rounds: 1, total: 34 });
    expect(tasbihState(100, 33)).toEqual({ count: 1, rounds: 3, total: 100 });
  });
  it("guards against bad inputs", () => {
    expect(tasbihState(-5, 33)).toEqual({ count: 0, rounds: 0, total: 0 });
    expect(tasbihState(5, 0)).toEqual({ count: 0, rounds: 5, total: 5 });
  });
});

describe("catalogues", () => {
  it("offers the core dhikr phrases and targets", () => {
    expect(DHIKR_PHRASES.map((p) => p.id)).toContain("subhanallah");
    expect(DHIKR_PHRASES).toHaveLength(5);
    expect(TASBIH_TARGETS).toContain(33);
  });
});
