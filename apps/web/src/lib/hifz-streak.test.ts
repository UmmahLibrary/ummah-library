import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStreak, touchStreak } from "./hifz-streak";

describe("hifz streak", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts empty", () => {
    expect(getStreak()).toEqual({ count: 0, lastDate: "" });
  });

  it("counts the first review as a one-day streak", () => {
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));
    expect(touchStreak()).toEqual({ count: 1, lastDate: "2026-06-14" });
    expect(getStreak().count).toBe(1);
  });

  it("is idempotent within the same day", () => {
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));
    touchStreak();
    expect(touchStreak()).toEqual({ count: 1, lastDate: "2026-06-14" });
  });

  it("increments on a consecutive day, resets after a gap", () => {
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));
    touchStreak();

    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
    expect(touchStreak().count).toBe(2);

    // Skip the 16th — a missed day breaks the streak back to 1.
    vi.setSystemTime(new Date("2026-06-17T12:00:00.000Z"));
    expect(touchStreak().count).toBe(1);
  });

  it("returns the default when stored data is corrupt", () => {
    localStorage.setItem("ul.hifz.streak", "not json");
    expect(getStreak()).toEqual({ count: 0, lastDate: "" });
  });
});
