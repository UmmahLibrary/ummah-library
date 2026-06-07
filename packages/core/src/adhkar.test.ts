import { describe, expect, it } from "vitest";
import type { Dhikr } from "./entities";
import {
  ADHKAR_OCCASIONS,
  filterByOccasion,
  isDhikrComplete,
  nextTally,
  sessionProgress,
} from "./adhkar";

function dhikr(id: string, order: number, occasions: Dhikr["occasions"], repeat = 1): Dhikr {
  return {
    id,
    order,
    occasions,
    repeat,
    arabic: "…",
    translation: "…",
    transliteration: "…",
    repeatLabel: repeat === 1 ? "Once" : `${repeat}×`,
  };
}

const items: Dhikr[] = [
  dhikr("c", 3, ["morning", "evening"], 3),
  dhikr("a", 1, ["morning"], 1),
  dhikr("b", 2, ["evening"], 33),
];

describe("ADHKAR_OCCASIONS", () => {
  it("offers morning then evening", () => {
    expect(ADHKAR_OCCASIONS.map((o) => o.id)).toEqual(["morning", "evening"]);
  });
});

describe("filterByOccasion", () => {
  it("returns matching dhikrs sorted by order", () => {
    expect(filterByOccasion(items, "morning").map((d) => d.id)).toEqual(["a", "c"]);
    expect(filterByOccasion(items, "evening").map((d) => d.id)).toEqual(["b", "c"]);
  });
});

describe("nextTally", () => {
  it("increments but caps at the repeat count", () => {
    expect(nextTally(0, 3)).toBe(1);
    expect(nextTally(2, 3)).toBe(3);
    expect(nextTally(3, 3)).toBe(3);
  });
  it("treats negative current as zero", () => {
    expect(nextTally(-5, 3)).toBe(1);
  });
});

describe("isDhikrComplete", () => {
  it("is true once the count reaches the repeat target", () => {
    expect(isDhikrComplete(2, 3)).toBe(false);
    expect(isDhikrComplete(3, 3)).toBe(true);
    expect(isDhikrComplete(4, 3)).toBe(true);
  });
});

describe("sessionProgress", () => {
  it("counts completed dhikrs against the set total", () => {
    const morning = filterByOccasion(items, "morning"); // a (×1), c (×3)
    expect(sessionProgress(morning, {})).toEqual({ completed: 0, total: 2 });
    expect(sessionProgress(morning, { a: 1 })).toEqual({ completed: 1, total: 2 });
    expect(sessionProgress(morning, { a: 1, c: 3 })).toEqual({ completed: 2, total: 2 });
  });
});
