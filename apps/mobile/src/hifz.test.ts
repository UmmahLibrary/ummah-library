import { describe, expect, it } from "vitest";
import type { HifzCard, VerseKey } from "@ummahlibrary/core";
import { advanceStreak, cardStrength, surahProgressMap, toDateStr } from "./hifz";

const card = (over: Partial<HifzCard> = {}): HifzCard => ({
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 0,
  due: "2025-01-01T00:00:00.000Z",
  lastReviewed: null,
  ...over,
});

const rec = (sura: number, aya: number, c: HifzCard) => ({ ref: { sura, aya } as VerseKey, card: c });

describe("cardStrength", () => {
  it("is 0 for a never-reviewed card", () => {
    expect(cardStrength(card())).toBe(0);
  });
  it("scales linearly to 1 at a 30-day interval", () => {
    expect(cardStrength(card({ intervalDays: 15, lastReviewed: "2025-01-02T00:00:00.000Z" }))).toBe(0.5);
    expect(cardStrength(card({ intervalDays: 45, lastReviewed: "2025-01-02T00:00:00.000Z" }))).toBe(1);
  });
});

describe("surahProgressMap", () => {
  it("aggregates tracked / due counts and earliest due per surah", () => {
    const now = new Date("2025-06-14T12:00:00.000Z");
    const map = surahProgressMap(
      [
        rec(1, 1, card({ due: "2025-06-10T00:00:00.000Z" })), // due (past)
        rec(1, 2, card({ due: "2025-06-20T00:00:00.000Z" })), // not due
        rec(112, 1, card({ due: "2025-06-13T00:00:00.000Z" })), // due
      ],
      now,
    );
    expect(map.get(1)).toMatchObject({ trackedCount: 2, dueCount: 1, nextDue: "2025-06-10T00:00:00.000Z" });
    expect(map.get(112)).toMatchObject({ trackedCount: 1, dueCount: 1 });
  });
});

describe("advanceStreak", () => {
  const now = new Date("2025-06-14T12:00:00.000Z");
  it("starts a streak at 1", () => {
    expect(advanceStreak({ count: 0, lastDate: "" }, now)).toEqual({ count: 1, lastDate: "2025-06-14" });
  });
  it("is idempotent within the same day", () => {
    const today = { count: 3, lastDate: "2025-06-14" };
    expect(advanceStreak(today, now)).toBe(today);
  });
  it("continues a streak from yesterday", () => {
    expect(advanceStreak({ count: 3, lastDate: "2025-06-13" }, now)).toEqual({ count: 4, lastDate: "2025-06-14" });
  });
  it("resets after a gap", () => {
    expect(advanceStreak({ count: 9, lastDate: "2025-06-10" }, now)).toEqual({ count: 1, lastDate: "2025-06-14" });
  });
  it("toDateStr formats UTC YYYY-MM-DD", () => {
    expect(toDateStr(now)).toBe("2025-06-14");
  });
});
