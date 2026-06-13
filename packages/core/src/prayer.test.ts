import { describe, expect, it } from "vitest";
import {
  CALCULATION_METHODS,
  DEFAULT_CALCULATION_METHOD,
  type PrayerTimings,
  isCalculationMethod,
  nextPrayer,
  prayerReminders,
} from "./prayer";

// A fixed day's timings (UTC instants) for a deterministic clock.
const timings: PrayerTimings = {
  fajr: "2026-06-07T03:00:00.000Z",
  sunrise: "2026-06-07T04:30:00.000Z",
  dhuhr: "2026-06-07T12:00:00.000Z",
  asr: "2026-06-07T15:30:00.000Z",
  maghrib: "2026-06-07T19:30:00.000Z",
  isha: "2026-06-07T21:00:00.000Z",
};

describe("CALCULATION_METHODS", () => {
  it("includes the default method", () => {
    expect(isCalculationMethod(DEFAULT_CALCULATION_METHOD)).toBe(true);
    expect(CALCULATION_METHODS.length).toBeGreaterThan(5);
  });

  it("rejects an unknown method id", () => {
    expect(isCalculationMethod("NotAMethod")).toBe(false);
  });
});

describe("nextPrayer", () => {
  it("returns the next obligatory prayer after now", () => {
    const r = nextPrayer(timings, new Date("2026-06-07T13:00:00Z"));
    expect(r?.name).toBe("asr");
    expect(r?.at.toISOString()).toBe("2026-06-07T15:30:00.000Z");
  });

  it("skips sunrise (a marker, not a prayer)", () => {
    const r = nextPrayer(timings, new Date("2026-06-07T03:30:00Z"));
    expect(r?.name).toBe("dhuhr");
  });

  it("treats a prayer exactly at now as already passed", () => {
    const r = nextPrayer(timings, new Date("2026-06-07T12:00:00Z"));
    expect(r?.name).toBe("asr");
  });

  it("returns null once the day's prayers have all passed", () => {
    expect(nextPrayer(timings, new Date("2026-06-07T22:00:00Z"))).toBeNull();
  });

  it("returns Fajr before the first prayer", () => {
    expect(nextPrayer(timings, new Date("2026-06-07T01:00:00Z"))?.name).toBe("fajr");
  });
});

describe("prayerReminders", () => {
  const allOn = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };

  it("returns only enabled prayers still ahead of now, in order", () => {
    const r = prayerReminders(timings, allOn, new Date("2026-06-07T13:00:00Z"));
    expect(r.map((x) => x.prayer)).toEqual(["asr", "maghrib", "isha"]);
    expect(r[0]?.at).toBe(timings.asr);
  });

  it("excludes prayers the user has not enabled", () => {
    const r = prayerReminders(
      timings,
      { fajr: true, isha: true },
      new Date("2026-06-07T00:00:00Z"),
    );
    expect(r.map((x) => x.prayer)).toEqual(["fajr", "isha"]);
  });

  it("never includes sunrise (not obligatory)", () => {
    const r = prayerReminders(
      timings,
      { sunrise: true } as Record<"sunrise", boolean>,
      new Date("2026-06-07T00:00:00Z"),
    );
    expect(r).toEqual([]);
  });

  it("treats a prayer exactly at now as already passed", () => {
    const r = prayerReminders(timings, allOn, new Date("2026-06-07T12:00:00Z"));
    expect(r.map((x) => x.prayer)).toEqual(["asr", "maghrib", "isha"]);
  });

  it("returns nothing once the day's prayers have all passed", () => {
    expect(prayerReminders(timings, allOn, new Date("2026-06-07T22:00:00Z"))).toEqual([]);
  });

  it("returns nothing when no prayers are enabled", () => {
    expect(prayerReminders(timings, {}, new Date("2026-06-07T00:00:00Z"))).toEqual([]);
  });
});
