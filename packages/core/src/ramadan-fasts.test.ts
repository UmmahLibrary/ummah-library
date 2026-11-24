import { describe, expect, it } from "vitest";
import {
  keptFastDays,
  migrateRamadanFasts,
  pagesReadBetween,
  ramadanDateRange,
  ramadanYearFor,
  toggleRamadanFast,
} from "./ramadan-fasts";

describe("ramadan fasts", () => {
  it("refers to this year's Ramaḍān from Ramaḍān on, and last year's before it", () => {
    expect(ramadanYearFor({ year: 1448, month: 6, day: 13 })).toBe(1447);
    expect(ramadanYearFor({ year: 1448, month: 9, day: 1 })).toBe(1448);
    expect(ramadanYearFor({ year: 1448, month: 10, day: 2 })).toBe(1448);
  });

  it("does not carry last year's fasts into the next Ramaḍān", () => {
    let fasts = toggleRamadanFast({}, 1447, 5);
    fasts = toggleRamadanFast(fasts, 1447, 6);
    expect([...keptFastDays(fasts, 1447)].sort()).toEqual([5, 6]);
    expect(keptFastDays(fasts, 1448).size).toBe(0);
    fasts = toggleRamadanFast(fasts, 1448, 5);
    expect([...keptFastDays(fasts, 1448)]).toEqual([5]);
    expect(keptFastDays(toggleRamadanFast(fasts, 1447, 5), 1447).has(5)).toBe(false);
  });

  it("moves year-less legacy entries to the given year", () => {
    const migrated = migrateRamadanFasts({ "3": true, "30": true, "1446:1": true }, 1447);
    expect(migrated).toEqual({ "1447:3": true, "1447:30": true, "1446:1": true });
  });
});

describe("ramadan reading", () => {
  it("counts only the pages read during that Ramaḍān", () => {
    const range = ramadanDateRange(1447);
    expect(range.start < range.end).toBe(true);
    const log = {
      "2025-01-01": 40, // long before
      [range.start]: 20,
      [range.end]: 10,
      "2099-01-01": 99, // after
    };
    expect(pagesReadBetween(log, range)).toBe(30);
  });

  it("moves with the sighting adjustment", () => {
    const base = ramadanDateRange(1447);
    const later = ramadanDateRange(1447, -1);
    expect(later.start > base.start).toBe(true);
  });
});

describe("legacy fasts", () => {
  it("stay in Ramaḍān 1447 even when first read during Ramaḍān 1448", () => {
    // Read for the first time on 1 Ramaḍān 1448: still last year's, not this year's.
    const migrated = migrateRamadanFasts({ "1": true, "2": true });
    expect(keptFastDays(migrated, 1448).size).toBe(0);
    expect([...keptFastDays(migrated, 1447)].sort()).toEqual([1, 2]);
  });
});
