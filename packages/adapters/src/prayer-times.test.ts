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

  it("derives the supplementary night markers", async () => {
    const t = await calc.calculate({
      coordinates: MAKKAH,
      date: "2026-01-01",
      method: "UmmAlQura",
      madhab: "shafi",
    });
    // Imsāk is a fixed 10 minutes before Fajr.
    expect(new Date(t.fajr).getTime() - new Date(t.imsak).getTime()).toBe(10 * 60_000);
    // Midnight and the last third fall after Maghrib and run into the next day.
    const maghrib = new Date(t.maghrib).getTime();
    expect(new Date(t.midnight).getTime()).toBeGreaterThan(maghrib);
    expect(new Date(t.lastThird).getTime()).toBeGreaterThan(new Date(t.midnight).getTime());
  });

  it("reshapes Isha at high latitude via the night-portion rule", async () => {
    // London in midsummer: the standard angle pushes Isha very late; the
    // one-seventh-of-the-night rule pulls it earlier into a real night.
    const LONDON = { latitude: 51.5074, longitude: -0.1278 };
    const q = { coordinates: LONDON, date: "2026-06-21", method: "MuslimWorldLeague", madhab: "shafi" } as const;
    const standard = await calc.calculate(q);
    const ruled = await calc.calculate({ ...q, highLatitudeRule: "SeventhOfTheNight" });
    expect(Number.isFinite(new Date(standard.isha).getTime())).toBe(true);
    expect(Number.isFinite(new Date(ruled.isha).getTime())).toBe(true);
    // The rule changes the result, moving Isha earlier.
    expect(ruled.isha).not.toBe(standard.isha);
    expect(new Date(ruled.isha).getTime()).toBeLessThan(new Date(standard.isha).getTime());
  });

  it("degrades to empty strings at a polar latitude instead of throwing (polar day)", async () => {
    // Svalbard in midsummer: adhan returns Invalid Date for Fajr/sunrise/Isha.
    // `.toISOString()` throws on those, so the whole request used to reject —
    // the five prayers + sunrise must degrade like the Sunnah markers do.
    const SVALBARD = { latitude: 78.9, longitude: 11.9 };
    const t = await calc.calculate({
      coordinates: SVALBARD,
      date: "2026-06-21",
      method: "MuslimWorldLeague",
      madhab: "shafi",
    });
    expect(t.fajr).toBe(""); // invalid → empty, not a thrown RangeError
    expect(t.imsak).toBe(""); // never synthesised from an empty Fajr (no 1970)
    expect(Number.isFinite(new Date(t.dhuhr).getTime())).toBe(true); // dhuhr still valid
  });

  it("leaves the result unchanged at a normal latitude when a rule is set", async () => {
    const q = { coordinates: MAKKAH, date: "2026-01-01", method: "UmmAlQura", madhab: "shafi" } as const;
    const plain = await calc.calculate(q);
    const ruled = await calc.calculate({ ...q, highLatitudeRule: "TwilightAngle" });
    expect(ruled.isha).toBe(plain.isha);
    expect(ruled.fajr).toBe(plain.fajr);
  });
});
