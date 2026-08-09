import { describe, expect, it } from "vitest";
import { directionsUrl, distanceKm, formatDistanceKm, sortByDistance } from "./geo";

const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const PARIS = { latitude: 48.8566, longitude: 2.3522 };

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm(LONDON, LONDON)).toBe(0);
  });

  it("matches the known great-circle distance London → Paris (~344 km)", () => {
    expect(distanceKm(LONDON, PARIS)).toBeCloseTo(344, -1);
  });

  it("is symmetric", () => {
    expect(distanceKm(LONDON, PARIS)).toBeCloseTo(distanceKm(PARIS, LONDON), 6);
  });

  it("never throws for antipodal points (float rounding at asin domain edge)", () => {
    const antipode = { latitude: -LONDON.latitude, longitude: LONDON.longitude + 180 };
    expect(Number.isFinite(distanceKm(LONDON, antipode))).toBe(true);
  });
});

describe("sortByDistance", () => {
  it("orders items nearest-first from the origin", () => {
    const far = { id: "far", coordinates: PARIS };
    const near = { id: "near", coordinates: { latitude: 51.51, longitude: -0.12 } };
    const sorted = sortByDistance(LONDON, [far, near]);
    expect(sorted.map((p) => p.id)).toEqual(["near", "far"]);
  });

  it("does not mutate the input array", () => {
    const items = [
      { id: "b", coordinates: PARIS },
      { id: "a", coordinates: LONDON },
    ];
    const original = [...items];
    sortByDistance(LONDON, items);
    expect(items).toEqual(original);
  });
});

describe("formatDistanceKm", () => {
  it("renders sub-kilometre distances in metres", () => {
    expect(formatDistanceKm(0.45)).toBe("450 m");
  });

  it("renders larger distances in kilometres, 1dp under 10km", () => {
    expect(formatDistanceKm(3.456)).toBe("3.5 km");
  });

  it("drops the decimal at 10km and beyond", () => {
    expect(formatDistanceKm(12.3)).toBe("12 km");
  });

  it("degrades to a dash for a non-finite or negative distance", () => {
    expect(formatDistanceKm(NaN)).toBe("—");
    expect(formatDistanceKm(-1)).toBe("—");
  });
});

describe("directionsUrl", () => {
  it("builds a Google Maps directions URL with the destination coordinates", () => {
    expect(directionsUrl(LONDON)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=51.5074,-0.1278",
    );
  });
});
