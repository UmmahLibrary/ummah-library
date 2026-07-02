import { describe, expect, it } from "vitest";
import type { HifzCard } from "./hifz";
import {
  type HifzActivityLog,
  activityHeatmap,
  cardStrength,
  hifzStreaks,
  logReview,
  surahProgressMap,
  weakestSurahs,
} from "./hifz-analytics";

const card = (opts: Partial<HifzCard> = {}): HifzCard => ({
  repetitions: 1,
  easeFactor: 2.5,
  intervalDays: 1,
  due: "2030-01-01T00:00:00.000Z",
  lastReviewed: null,
  ...opts,
});

describe("cardStrength", () => {
  it("is 0 when never reviewed, proportional to interval, capped at 1", () => {
    expect(cardStrength(card())).toBe(0);
    expect(cardStrength(card({ lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 15 }))).toBe(0.5);
    expect(cardStrength(card({ lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 60 }))).toBe(1);
  });
});

describe("surahProgressMap + weakestSurahs", () => {
  const now = new Date("2026-06-14T00:00:00.000Z");
  const records = [
    // Surah 2: one strong+due (strength 1), one fresh not-due (strength 0) → avg 0.5.
    { ref: { sura: 2, aya: 1 }, card: card({ due: "2000-01-01T00:00:00.000Z", lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 30 }) },
    { ref: { sura: 2, aya: 2 }, card: card({ due: "2099-01-01T00:00:00.000Z" }) },
    // Surah 1: a single due, fresh card → avg 0.
    { ref: { sura: 1, aya: 1 }, card: card({ due: "2000-06-01T00:00:00.000Z" }) },
    // Surah 3: one strong card → avg 1.
    { ref: { sura: 3, aya: 5 }, card: card({ due: "2099-01-01T00:00:00.000Z", lastReviewed: "2026-06-01T00:00:00.000Z", intervalDays: 40 }) },
  ];

  it("aggregates tracked/due/strength/earliest-due per surah", () => {
    const map = surahProgressMap(records, now);
    const s2 = map.get(2)!;
    expect(s2.trackedCount).toBe(2);
    expect(s2.dueCount).toBe(1);
    expect(s2.avgStrength).toBe(0.5);
    expect(s2.nextDue).toBe("2000-01-01T00:00:00.000Z");
    expect(map.get(1)!.avgStrength).toBe(0);
    expect(map.get(3)!.avgStrength).toBe(1);
  });

  it("ranks the weakest surahs first, tie-broken by surah number", () => {
    const weak = weakestSurahs(surahProgressMap(records, now).values(), 2);
    expect(weak.map((p) => p.surahNumber)).toEqual([1, 2]); // 0, then 0.5 (before 1.0)
  });
});

describe("logReview", () => {
  it("increments today's UTC day count without mutating the input", () => {
    const log: HifzActivityLog = { "2026-06-13": 2 };
    const next = logReview(log, new Date("2026-06-14T09:30:00.000Z"));
    expect(next["2026-06-14"]).toBe(1);
    expect(logReview(next, new Date("2026-06-14T21:00:00.000Z"))["2026-06-14"]).toBe(2);
    expect(log).toEqual({ "2026-06-13": 2 }); // original untouched
  });
});

describe("activityHeatmap", () => {
  const today = new Date("2026-06-17T12:00:00.000Z"); // a Wednesday

  it("is a Sunday-aligned rectangle ending in the week of `today`", () => {
    const days = activityHeatmap({}, today, 26);
    expect(days).toHaveLength(26 * 7);
    expect(new Date(`${days[0]!.date}T00:00:00.000Z`).getUTCDay()).toBe(0); // starts on a Sunday
    // `today` sits in the final week; days after it are still emitted (level 0).
    expect(days.some((d) => d.date === "2026-06-17")).toBe(true);
    expect(days[days.length - 1]!.date).toBe("2026-06-20"); // Saturday of the current week
  });

  it("buckets counts into levels 0–4", () => {
    const log: HifzActivityLog = { "2026-06-17": 1, "2026-06-16": 3, "2026-06-15": 6, "2026-06-14": 9 };
    const byDate = new Map(activityHeatmap(log, today, 26).map((d) => [d.date, d]));
    expect(byDate.get("2026-06-18")!.level).toBe(0); // future/empty
    expect(byDate.get("2026-06-17")!.level).toBe(1);
    expect(byDate.get("2026-06-16")!.level).toBe(2);
    expect(byDate.get("2026-06-15")!.level).toBe(3);
    expect(byDate.get("2026-06-14")!.level).toBe(4);
  });
});

describe("hifzStreaks", () => {
  it("counts the current run and the longest run", () => {
    const log: HifzActivityLog = {
      // current run: 15, 16, 17 (today) = 3
      "2026-06-17": 1,
      "2026-06-16": 2,
      "2026-06-15": 1,
      // gap on the 14th
      // earlier run of 4: 10, 11, 12, 13
      "2026-06-13": 1,
      "2026-06-12": 1,
      "2026-06-11": 1,
      "2026-06-10": 1,
    };
    const today = new Date("2026-06-17T12:00:00.000Z");
    expect(hifzStreaks(log, today)).toEqual({ current: 3, longest: 4 });
  });

  it("keeps the current streak alive on a not-yet-reviewed today (grace via yesterday)", () => {
    const log: HifzActivityLog = { "2026-06-16": 1, "2026-06-15": 1 };
    expect(hifzStreaks(log, new Date("2026-06-17T08:00:00.000Z")).current).toBe(2);
  });

  it("is zero when there is no recent activity", () => {
    expect(hifzStreaks({ "2026-01-01": 1 }, new Date("2026-06-17T00:00:00.000Z")).current).toBe(0);
    expect(hifzStreaks({}, new Date("2026-06-17T00:00:00.000Z"))).toEqual({ current: 0, longest: 0 });
  });
});
