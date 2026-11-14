import { describe, expect, it } from "vitest";
import { NAV_DESTINATIONS, destinationOf } from "./nav";

describe("navigation model", () => {
  it("has exactly five destinations", () => {
    expect(NAV_DESTINATIONS.map((d) => d.key)).toEqual([
      "today",
      "quran",
      "prayer",
      "learn",
      "more",
    ]);
  });

  it("maps pages to their destination", () => {
    expect(destinationOf("/")).toBe("today");
    expect(destinationOf("/surah/18")).toBe("quran");
    expect(destinationOf("/listen/2")).toBe("quran");
    expect(destinationOf("/prayer-times")).toBe("prayer");
    expect(destinationOf("/qibla")).toBe("prayer");
    expect(destinationOf("/duas")).toBe("learn");
    expect(destinationOf("/settings")).toBe("more");
  });
});
