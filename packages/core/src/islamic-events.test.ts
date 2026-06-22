import { describe, expect, it } from "vitest";
import {
  ISLAMIC_EVENTS,
  islamicEventsInMonth,
  upcomingIslamicEvents,
} from "./islamic-events";

describe("ISLAMIC_EVENTS", () => {
  it("has unique ids and valid Hijri month/day", () => {
    const ids = ISLAMIC_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ISLAMIC_EVENTS) {
      expect(e.month).toBeGreaterThanOrEqual(1);
      expect(e.month).toBeLessThanOrEqual(12);
      expect(e.day).toBeGreaterThanOrEqual(1);
      expect(e.day).toBeLessThanOrEqual(30);
    }
  });

  it("is ordered by Hijri month then day", () => {
    const keys = ISLAMIC_EVENTS.map((e) => e.month * 100 + e.day);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });
});

describe("islamicEventsInMonth", () => {
  it("returns the observances for a month, in day order", () => {
    const m1 = islamicEventsInMonth(1).map((e) => e.id);
    expect(m1).toEqual(["islamic-new-year", "ashura"]);
    expect(islamicEventsInMonth(12).map((e) => e.id)).toEqual(["arafah", "eid-al-adha"]);
  });

  it("returns nothing for a month with no major observance", () => {
    expect(islamicEventsInMonth(2)).toEqual([]);
  });
});

describe("upcomingIslamicEvents", () => {
  const today = { year: 2026, month: 6, day: 22 };

  it("resolves the next events soonest-first with a day countdown", () => {
    const up = upcomingIslamicEvents(today, 3);
    expect(up.map((u) => u.event.id)).toEqual(["ashura", "mawlid", "isra-miraj"]);
    const next = up[0]!;
    expect(next.daysUntil).toBe(4);
    expect(next.gregorian).toEqual({ year: 2026, month: 6, day: 26 });
    expect(next.hijri).toEqual({ year: 1448, month: 1, day: 10 });
  });

  it("never returns a past event and stays sorted", () => {
    const up = upcomingIslamicEvents(today);
    expect(up).toHaveLength(ISLAMIC_EVENTS.length);
    for (const u of up) expect(u.daysUntil).toBeGreaterThanOrEqual(0);
    const days = up.map((u) => u.daysUntil);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("keeps each resolved date on the event's own Hijri month/day", () => {
    for (const u of upcomingIslamicEvents(today)) {
      expect(u.hijri.month).toBe(u.event.month);
      expect(u.hijri.day).toBe(u.event.day);
    }
  });

  it("counts an event that falls today as zero days away", () => {
    // ʿĀshūrāʾ 1448 lands on 2026-06-26 (computed above).
    const onAshura = { year: 2026, month: 6, day: 26 };
    const first = upcomingIslamicEvents(onAshura, 1)[0]!;
    expect(first.event.id).toBe("ashura");
    expect(first.daysUntil).toBe(0);
  });

  it("respects the requested count and is deterministic", () => {
    expect(upcomingIslamicEvents(today, 2)).toHaveLength(2);
    expect(upcomingIslamicEvents(today, 0)).toHaveLength(0);
    expect(upcomingIslamicEvents(today, 5)).toEqual(upcomingIslamicEvents(today, 5));
  });

  it("threads the sighting adjustment through to the resolved dates", () => {
    const base = upcomingIslamicEvents(today, 1, 0)[0]!;
    const shifted = upcomingIslamicEvents(today, 1, 1)[0]!;
    // A +1-day adjustment moves the Gregorian date of the same event one day earlier.
    expect(shifted.event.id).toBe(base.event.id);
    expect(shifted.gregorian).toEqual({ year: 2026, month: 6, day: 25 });
  });
});
