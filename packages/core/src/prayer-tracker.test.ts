import { describe, expect, it } from "vitest";
import {
  type PrayerTrackerLog,
  isComplete,
  longestStreak,
  nextPrayerStatus,
  onTimeRate,
  prayedCount,
  prayerStreak,
  recentDays,
  setPrayerStatus,
  statusFor,
} from "./prayer-tracker";

const full = { fajr: "ontime", dhuhr: "ontime", asr: "ontime", maghrib: "ontime", isha: "ontime" } as const;

describe("nextPrayerStatus", () => {
  it("cycles none → ontime → late → none", () => {
    expect(nextPrayerStatus("none")).toBe("ontime");
    expect(nextPrayerStatus("ontime")).toBe("late");
    expect(nextPrayerStatus("late")).toBe("none");
  });
});

describe("prayedCount / isComplete", () => {
  it("counts logged prayers and detects a complete day", () => {
    expect(prayedCount(undefined)).toBe(0);
    expect(prayedCount({ fajr: "ontime", dhuhr: "late" })).toBe(2);
    expect(isComplete({ ...full })).toBe(true);
    expect(isComplete({ fajr: "ontime" })).toBe(false);
  });
});

describe("statusFor", () => {
  it("defaults to none", () => {
    expect(statusFor(undefined, "fajr")).toBe("none");
    expect(statusFor({ fajr: "late" }, "fajr")).toBe("late");
  });
});

describe("setPrayerStatus", () => {
  it("sets, removes, and drops an emptied day immutably", () => {
    const log: PrayerTrackerLog = {};
    const a = setPrayerStatus(log, "2026-06-13", "fajr", "ontime");
    expect(a["2026-06-13"]).toEqual({ fajr: "ontime" });
    expect(log).toEqual({}); // original untouched

    const b = setPrayerStatus(a, "2026-06-13", "fajr", "none");
    expect(b["2026-06-13"]).toBeUndefined(); // emptied day removed
  });
});

describe("prayerStreak", () => {
  it("counts consecutive complete days back from today", () => {
    const log: PrayerTrackerLog = {
      "2026-06-11": { ...full },
      "2026-06-12": { ...full },
      "2026-06-13": { ...full },
    };
    expect(prayerStreak(log, "2026-06-13")).toBe(3);
  });

  it("keeps the streak alive on an in-progress today (grace day)", () => {
    const log: PrayerTrackerLog = {
      "2026-06-12": { ...full },
      "2026-06-13": { fajr: "ontime" }, // today incomplete
    };
    expect(prayerStreak(log, "2026-06-13")).toBe(1); // yesterday still counts
  });

  it("is zero when neither today nor yesterday is complete", () => {
    const log: PrayerTrackerLog = { "2026-06-10": { ...full } };
    expect(prayerStreak(log, "2026-06-13")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the longest consecutive complete run", () => {
    const log: PrayerTrackerLog = {
      "2026-06-01": { ...full },
      "2026-06-02": { ...full },
      // gap
      "2026-06-05": { ...full },
      "2026-06-06": { ...full },
      "2026-06-07": { ...full },
    };
    expect(longestStreak(log)).toBe(3);
  });
});

describe("onTimeRate", () => {
  it("is the share of prayed prayers that were on time", () => {
    const log: PrayerTrackerLog = {
      "2026-06-13": { fajr: "ontime", dhuhr: "ontime", asr: "late", maghrib: "late" },
    };
    expect(onTimeRate(log, "2026-06-13", 30)).toBe(50); // 2 of 4 prayed
  });

  it("is zero with nothing logged", () => {
    expect(onTimeRate({}, "2026-06-13")).toBe(0);
  });
});

describe("recentDays", () => {
  it("returns count days oldest → newest with five statuses each", () => {
    const log: PrayerTrackerLog = { "2026-06-13": { fajr: "ontime" } };
    const days = recentDays(log, "2026-06-13", 7);
    expect(days).toHaveLength(7);
    expect(days[0]?.date).toBe("2026-06-07");
    expect(days[6]?.date).toBe("2026-06-13");
    expect(days[6]?.statuses).toEqual(["ontime", "none", "none", "none", "none"]);
  });
});
