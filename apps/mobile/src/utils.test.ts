import { describe, expect, it } from "vitest";
import {
  adhkarToday,
  fmtCountdown,
  fmtPrayerTime,
  fmtTime,
  localISODate,
  weekdayOfGregorian,
} from "./utils";

describe("localISODate", () => {
  it("formats a date as YYYY-MM-DD in local time", () => {
    expect(localISODate(new Date(2025, 5, 10))).toBe("2025-06-10");
    expect(localISODate(new Date(2024, 0, 1))).toBe("2024-01-01");
    expect(localISODate(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("adhkarToday", () => {
  it("returns the same YYYY-MM-DD format as localISODate", () => {
    const d = new Date(2025, 5, 10);
    expect(adhkarToday(d)).toBe(localISODate(d));
  });
});

describe("fmtCountdown", () => {
  it("shows only minutes when under an hour", () => {
    const now = new Date(0);
    const target = new Date(25 * 60 * 1000);
    expect(fmtCountdown(target, now)).toBe("25m");
  });

  it("shows hours and minutes when at least one hour away", () => {
    const now = new Date(0);
    const target = new Date((2 * 3600 + 15 * 60) * 1000);
    expect(fmtCountdown(target, now)).toBe("2h 15m");
  });

  it("returns 0m when target is in the past", () => {
    const now = new Date(10000);
    const target = new Date(0);
    expect(fmtCountdown(target, now)).toBe("0m");
  });

  it("returns a dash for an invalid target (a polar empty Fajr → Invalid Date)", () => {
    expect(fmtCountdown(new Date(""), new Date(0))).toBe("—");
  });
});

describe("fmtTime", () => {
  it("formats a valid instant and dashes an empty/invalid one (polar timing)", () => {
    expect(fmtTime("2026-06-21T12:00:00Z")).toMatch(/\d/); // some time rendered
    expect(fmtTime("")).toBe("—"); // empty polar timing, not "Invalid Date"
    expect(fmtTime(new Date("nope"))).toBe("—");
  });
});

describe("fmtPrayerTime", () => {
  const london = { latitude: 51.5074, longitude: -0.1278 };

  it("renders in the timezone of the given coordinates, not the device's", () => {
    // A traveler (or a desktop browser) whose device clock is on some other
    // zone should still see London's own wall-clock time for a London prayer.
    const instant = "2026-06-21T12:00:00Z";
    const expected = new Date(instant).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
    expect(fmtPrayerTime(instant, london)).toBe(expected);
  });

  it("falls back to the device timezone when coordinates are unknown", () => {
    const instant = "2026-06-21T12:00:00Z";
    const expected = new Date(instant).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    expect(fmtPrayerTime(instant, null)).toBe(expected);
  });

  it("dashes an empty/invalid instant (polar timing) instead of throwing", () => {
    expect(fmtPrayerTime("", london)).toBe("—");
    expect(fmtPrayerTime(new Date("nope"), london)).toBe("—");
  });
});

describe("weekdayOfGregorian", () => {
  it("returns 0 for Sunday", () => {
    expect(weekdayOfGregorian(2025, 6, 1)).toBe(0); // 1 June 2025 is Sunday
  });

  it("returns 5 for Friday", () => {
    expect(weekdayOfGregorian(2025, 6, 6)).toBe(5); // 6 June 2025 is Friday
  });

  it("is consistent across DST boundaries", () => {
    // Uses UTC internally, so it never drifts at clock-change midnight
    expect(weekdayOfGregorian(2025, 3, 30)).toBe(0); // 30 Mar 2025 is Sunday (EU DST start)
  });
});
