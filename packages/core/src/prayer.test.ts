import { describe, expect, it } from "vitest";
import {
  CALCULATION_METHODS,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_HIGH_LATITUDE_RULE,
  HIGH_LATITUDE_RULES,
  IMSAK_OFFSET_MINUTES,
  MADHABS,
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerTimings,
  SUPPLEMENTARY_TIMING_LABELS,
  SUPPLEMENTARY_TIMING_NAMES,
  TIMING_NAMES,
  imsakFromFajr,
  isCalculationMethod,
  isHighLatitudeRule,
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

  it("exposes the full method catalogue with adapter-matching ids and non-empty labels", () => {
    // These ids must match the adapter's `adhan` preset names exactly — a blanked
    // or dropped id silently breaks the real prayer calculation, so pin them all.
    expect(CALCULATION_METHODS.map((m) => m.id)).toEqual([
      "MuslimWorldLeague",
      "Egyptian",
      "Karachi",
      "UmmAlQura",
      "Dubai",
      "Qatar",
      "Kuwait",
      "Singapore",
      "Turkey",
      "Tehran",
      "NorthAmerica",
      "MoonsightingCommittee",
    ]);
    for (const m of CALCULATION_METHODS) {
      expect(isCalculationMethod(m.id)).toBe(true);
      expect(m.label.length).toBeGreaterThan(0);
    }
  });
});

describe("catalogue integrity (load-bearing tables)", () => {
  it("labels every prayer marker in PRAYER_LABELS", () => {
    for (const name of TIMING_NAMES) {
      expect(PRAYER_LABELS[name].length).toBeGreaterThan(0);
    }
  });

  it("lists the six markers in chronological order, with the five obligatory prayers", () => {
    expect(TIMING_NAMES).toEqual(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]);
    // Obligatory = the markers minus sunrise, order preserved.
    expect(OBLIGATORY_PRAYERS).toEqual(["fajr", "dhuhr", "asr", "maghrib", "isha"]);
    expect(OBLIGATORY_PRAYERS).not.toContain("sunrise");
  });

  it("offers both madhabs with their adapter ids and non-empty labels", () => {
    expect(MADHABS.map((m) => m.id)).toEqual(["shafi", "hanafi"]);
    for (const m of MADHABS) expect(m.label.length).toBeGreaterThan(0);
  });

  it("labels every high-latitude rule", () => {
    for (const r of HIGH_LATITUDE_RULES) expect(r.label.length).toBeGreaterThan(0);
  });
});

describe("imsakFromFajr", () => {
  it("places Imsāk the default offset before Fajr", () => {
    expect(imsakFromFajr(timings.fajr)).toBe("2026-06-07T02:50:00.000Z");
  });

  it("honours a custom offset", () => {
    expect(imsakFromFajr(timings.fajr, 30)).toBe("2026-06-07T02:30:00.000Z");
  });

  it("defaults to the published offset constant", () => {
    const expected = new Date(
      new Date(timings.fajr).getTime() - IMSAK_OFFSET_MINUTES * 60_000,
    ).toISOString();
    expect(imsakFromFajr(timings.fajr)).toBe(expected);
  });
});

describe("HIGH_LATITUDE_RULES", () => {
  it("offers the default rule and rejects unknown ids", () => {
    expect(isHighLatitudeRule(DEFAULT_HIGH_LATITUDE_RULE)).toBe(true);
    expect(isHighLatitudeRule("NotARule")).toBe(false);
  });

  it("includes the three adhan rules plus 'none'", () => {
    expect(HIGH_LATITUDE_RULES.map((r) => r.id)).toEqual([
      "none",
      "MiddleOfTheNight",
      "SeventhOfTheNight",
      "TwilightAngle",
    ]);
  });
});

describe("supplementary timings", () => {
  it("labels every supplementary marker", () => {
    for (const name of SUPPLEMENTARY_TIMING_NAMES) {
      expect(SUPPLEMENTARY_TIMING_LABELS[name]).toBeTruthy();
    }
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
