import { describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL,
  activeDates,
  clearKhatma,
  markActivity,
  pagesToday,
  readGoal,
  readKhatma,
  readingLog,
  recordMushafPage,
  today,
  writeGoal,
  writeKhatma,
} from "./reading-goals";

describe("reading-goals storage", () => {
  it("formats today as local YYYY-MM-DD", () => {
    expect(today(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  it("goal defaults to DEFAULT_GOAL and floors to >= 1", () => {
    expect(readGoal()).toBe(DEFAULT_GOAL);
    writeGoal(8);
    expect(readGoal()).toBe(8);
    writeGoal(0);
    expect(readGoal()).toBe(DEFAULT_GOAL);
  });

  it("records today's activity exactly once", () => {
    markActivity();
    markActivity();
    expect(activeDates()).toEqual([today()]);
  });

  it("logs distinct Mushaf pages read today and marks activity", () => {
    recordMushafPage(3);
    recordMushafPage(3); // duplicate — ignored
    recordMushafPage(4);

    expect(pagesToday()).toBe(2);
    expect(readingLog()[today()]).toBe(2);
    expect(activeDates()).toContain(today());
  });

  it("advances the khatma cursor as later pages are read, and clears", () => {
    writeKhatma({ totalPages: 604, currentPage: 0, targetDate: "2030-01-01" });
    recordMushafPage(10);
    expect(readKhatma()?.currentPage).toBe(10);

    clearKhatma();
    expect(readKhatma()).toBeNull();
  });
});
