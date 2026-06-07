import { describe, expect, it } from "vitest";
import {
  type KhatmaPlan,
  addDays,
  computeStreak,
  daysBetween,
  goalMet,
  khatmaDailyTarget,
  progressFraction,
} from "./reading-goals";

describe("date helpers", () => {
  it("daysBetween counts whole days, signed", () => {
    expect(daysBetween("2026-06-01", "2026-06-08")).toBe(7);
    expect(daysBetween("2026-06-08", "2026-06-01")).toBe(-7);
    expect(daysBetween("2026-06-07", "2026-06-07")).toBe(0);
  });
  it("addDays shifts and rolls over months", () => {
    expect(addDays("2026-06-07", 1)).toBe("2026-06-08");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-06-01", -1)).toBe("2026-05-31");
  });
});

describe("computeStreak", () => {
  const today = "2026-06-07";
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-06-05", "2026-06-06", "2026-06-07"], today)).toBe(3);
  });
  it("keeps the streak alive on a grace day (active yesterday, not yet today)", () => {
    expect(computeStreak(["2026-06-05", "2026-06-06"], today)).toBe(2);
  });
  it("is zero when the last activity is older than yesterday", () => {
    expect(computeStreak(["2026-06-04", "2026-06-05"], today)).toBe(0);
  });
  it("ignores gaps before the current run", () => {
    expect(computeStreak(["2026-06-01", "2026-06-06", "2026-06-07"], today)).toBe(2);
  });
  it("is zero with no activity", () => {
    expect(computeStreak([], today)).toBe(0);
  });
});

describe("khatmaDailyTarget", () => {
  const base: KhatmaPlan = { totalPages: 604, currentPage: 0, targetDate: "2026-07-07" };
  it("spreads remaining pages over the days left (inclusive of today)", () => {
    // 604 pages over 31 days (Jun 7 → Jul 7) → ceil(604/31) = 20
    expect(khatmaDailyTarget(base, "2026-06-07")).toBe(20);
  });
  it("uses pages already read", () => {
    expect(khatmaDailyTarget({ ...base, currentPage: 304 }, "2026-06-07")).toBe(Math.ceil(300 / 31));
  });
  it("is zero once finished", () => {
    expect(khatmaDailyTarget({ ...base, currentPage: 604 }, "2026-06-07")).toBe(0);
  });
  it("asks for everything when the target date has passed", () => {
    expect(khatmaDailyTarget({ ...base, currentPage: 600 }, "2026-08-01")).toBe(4);
  });
});

describe("progressFraction & goalMet", () => {
  it("clamps the fraction to 0…1", () => {
    expect(progressFraction(2, 4)).toBe(0.5);
    expect(progressFraction(9, 4)).toBe(1);
    expect(progressFraction(1, 0)).toBe(0);
  });
  it("goalMet needs a positive target reached", () => {
    expect(goalMet(4, 4)).toBe(true);
    expect(goalMet(3, 4)).toBe(false);
    expect(goalMet(1, 0)).toBe(false);
  });
});
