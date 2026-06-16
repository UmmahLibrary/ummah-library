import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL,
  clearKhatma,
  markActivity,
  readReadingState,
  recordMushafPage,
  today,
  writeGoal,
  writeKhatma,
} from "./reading-goals";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("reading-goals storage", () => {
  it("formats today as local YYYY-MM-DD", () => {
    expect(today(new Date(2026, 0, 9))).toBe("2026-01-09");
  });

  it("goal defaults to DEFAULT_GOAL and floors to >= 1", async () => {
    expect((await readReadingState()).goal).toBe(DEFAULT_GOAL);
    await writeGoal(8);
    expect((await readReadingState()).goal).toBe(8);
    await writeGoal(0);
    expect((await readReadingState()).goal).toBe(DEFAULT_GOAL);
  });

  it("records today's activity exactly once", async () => {
    await markActivity();
    await markActivity();
    expect((await readReadingState()).activeDates).toEqual([today()]);
  });

  it("logs distinct Mushaf pages read today and marks activity", async () => {
    await recordMushafPage(3);
    await recordMushafPage(3); // duplicate — ignored
    await recordMushafPage(4);

    const s = await readReadingState();
    expect(s.pagesToday).toBe(2);
    expect(s.log[today()]).toBe(2);
    expect(s.activeDates).toContain(today());
  });

  it("advances the khatma cursor as later pages are read, and clears", async () => {
    await writeKhatma({ totalPages: 604, currentPage: 0, targetDate: "2030-01-01" });
    await recordMushafPage(10);
    expect((await readReadingState()).khatma?.currentPage).toBe(10);

    await clearKhatma();
    expect((await readReadingState()).khatma).toBeNull();
  });
});
