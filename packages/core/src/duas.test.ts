import { describe, expect, it } from "vitest";
import { DUAS, DUA_CATEGORIES, duaOfToday } from "./duas";

describe("DUAS", () => {
  it("every entry is well-formed and uses a known category", () => {
    const categories = new Set<string>(DUA_CATEGORIES);
    expect(DUAS.length).toBeGreaterThan(0);
    for (const dua of DUAS) {
      expect(dua.ar.length).toBeGreaterThan(0);
      expect(dua.en.length).toBeGreaterThan(0);
      expect(dua.ref.length).toBeGreaterThan(0);
      expect(categories.has(dua.category)).toBe(true);
    }
  });
});

describe("duaOfToday", () => {
  it("is deterministic for a given date", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    expect(duaOfToday(date)).toEqual(duaOfToday(date));
  });

  it("always returns one of the curated duʿās", () => {
    const date = new Date("2026-03-21T08:00:00Z");
    expect(DUAS).toContain(duaOfToday(date));
  });

  it("cycles through the collection across consecutive days", () => {
    const refs = new Set<string>();
    for (let i = 0; i < DUAS.length; i++) {
      // UTC instants so the day-of-year stepping is deterministic across hosts.
      const date = new Date(Date.UTC(2026, 0, 1 + i));
      refs.add(duaOfToday(date).ref);
    }
    expect(refs.size).toBe(DUAS.length);
  });

  it("defaults to the current date when called without an argument", () => {
    expect(DUAS).toContain(duaOfToday());
  });

  it("is timezone-independent: the same instant maps to the same duʿā in any TZ (core purity)", () => {
    // A just-after-UTC-midnight instant: a local clock west of UTC is still on
    // the previous day, so a local-time computation would pick a different duʿā.
    const instant = new Date("2026-01-01T00:30:00Z");
    const original = process.env.TZ;
    try {
      process.env.TZ = "UTC";
      const utc = duaOfToday(instant).ref;
      process.env.TZ = "America/Los_Angeles";
      const west = duaOfToday(instant).ref;
      process.env.TZ = "Pacific/Kiritimati";
      const east = duaOfToday(instant).ref;
      expect(west).toBe(utc);
      expect(east).toBe(utc);
    } finally {
      process.env.TZ = original;
    }
  });
});
