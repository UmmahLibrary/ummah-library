import { describe, expect, it } from "vitest";
import { COMPASS_POINTS, KAABA, compassPoint, qiblaDirection } from "./qibla";

describe("qiblaDirection", () => {
  // Reference bearings cross-checked against the adhan library (Qibla()).
  const cases: [string, number, number, number][] = [
    ["Washington DC", 38.9072, -77.0369, 56.56],
    ["London", 51.5074, -0.1278, 118.99],
    ["Jakarta", -6.2088, 106.8456, 295.15],
    ["New York", 40.7128, -74.006, 58.48],
  ];

  for (const [name, latitude, longitude, expected] of cases) {
    it(`points toward Makkah from ${name}`, () => {
      expect(qiblaDirection({ latitude, longitude })).toBeCloseTo(expected, 1);
    });
  }

  it("is in the range [0, 360)", () => {
    for (const [, lat, lng] of cases) {
      const b = qiblaDirection({ latitude: lat, longitude: lng });
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });

  it("returns 0 at the Kaaba itself (bearing undefined)", () => {
    expect(qiblaDirection(KAABA)).toBe(0);
  });

  it("points due south from straight north of the Kaaba", () => {
    expect(qiblaDirection({ latitude: 60, longitude: KAABA.longitude })).toBeCloseTo(180, 5);
  });
});

describe("compassPoint", () => {
  it("maps cardinal bearings to their labels", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(90)).toBe("E");
    expect(compassPoint(180)).toBe("S");
    expect(compassPoint(270)).toBe("W");
  });

  it("rounds to the nearest of the eight points and wraps 360→N", () => {
    expect(compassPoint(45)).toBe("NE");
    expect(compassPoint(359)).toBe("N");
    expect(compassPoint(360)).toBe("N");
    expect(COMPASS_POINTS).toContain(compassPoint(123.4));
  });
});
