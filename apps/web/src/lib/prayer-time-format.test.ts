import { describe, expect, it } from "vitest";
import { fmtPrayerTime, timeZoneFor } from "./prayer-time-format";

const LONDON = { latitude: 51.5074, longitude: -0.1278 };

describe("timeZoneFor", () => {
  it("resolves the IANA zone for known coordinates", () => {
    expect(timeZoneFor(LONDON)).toBe("Europe/London");
  });

  it("returns undefined for null/undefined coordinates", () => {
    expect(timeZoneFor(null)).toBeUndefined();
    expect(timeZoneFor(undefined)).toBeUndefined();
  });

  it("returns undefined instead of throwing for out-of-range coordinates", () => {
    expect(timeZoneFor({ latitude: 999, longitude: 999 })).toBeUndefined();
  });
});

describe("fmtPrayerTime", () => {
  it("renders in the timezone of the given coordinates, not the device's", () => {
    const instant = "2026-06-21T12:00:00Z";
    const expected = new Date(instant).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    });
    expect(fmtPrayerTime(instant, LONDON)).toBe(expected);
  });

  it("falls back to the device timezone when coordinates are unknown", () => {
    const instant = "2026-06-21T12:00:00Z";
    const expected = new Date(instant).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    expect(fmtPrayerTime(instant, null)).toBe(expected);
  });

  it("dashes an empty/invalid instant (polar timing) instead of throwing", () => {
    expect(fmtPrayerTime("", LONDON)).toBe("—");
    expect(fmtPrayerTime(new Date("nope"), LONDON)).toBe("—");
  });
});
