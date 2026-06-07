import { describe, expect, it } from "vitest";
import { nextPrayer } from "@ummahlibrary/core";
import { AdhanPrayerTimes } from "./prayer-times";

const MAKKAH = { latitude: 21.4225, longitude: 39.8262 };

describe("AdhanPrayerTimes", () => {
  const calc = new AdhanPrayerTimes();

  it("computes six ordered timings for a location and date", async () => {
    const t = await calc.calculate({
      coordinates: MAKKAH,
      date: "2026-01-01",
      method: "UmmAlQura",
      madhab: "shafi",
    });
    const order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map((s) =>
      new Date(s).getTime(),
    );
    expect(order.every((v) => Number.isFinite(v))).toBe(true);
    for (let i = 1; i < order.length; i++) expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    // Regression-pin the Umm al-Qura Fajr for Makkah on this date.
    expect(t.fajr).toBe("2026-01-01T02:37:00.000Z");
  });

  it("places Asr later under the Hanafi madhab", async () => {
    const q = { coordinates: MAKKAH, date: "2026-01-01", method: "UmmAlQura" } as const;
    const shafi = await calc.calculate({ ...q, madhab: "shafi" });
    const hanafi = await calc.calculate({ ...q, madhab: "hanafi" });
    expect(new Date(hanafi.asr).getTime()).toBeGreaterThan(new Date(shafi.asr).getTime());
  });

  it("produces timings the core nextPrayer helper can read", async () => {
    const t = await calc.calculate({
      coordinates: MAKKAH,
      date: "2026-01-01",
      method: "UmmAlQura",
      madhab: "shafi",
    });
    const r = nextPrayer(t, new Date("2026-01-01T00:00:00Z"));
    expect(r?.name).toBe("fajr");
  });

  it("falls back to the default method for an unknown id", async () => {
    const t = await calc.calculate({
      coordinates: MAKKAH,
      date: "2026-01-01",
      method: "BogusMethod",
      madhab: "shafi",
    });
    expect(Number.isFinite(new Date(t.fajr).getTime())).toBe(true);
  });
});
