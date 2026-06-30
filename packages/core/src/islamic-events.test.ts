import { describe, expect, it } from "vitest";
import {
  ISLAMIC_EVENTS,
  islamicEventsForMonth,
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

  it("exposes the full event roster with non-empty names and notes", () => {
    expect(ISLAMIC_EVENTS.map((e) => e.id)).toEqual([
      "islamic-new-year",
      "tasua",
      "ashura",
      "mawlid",
      "isra-miraj",
      "laylat-al-baraah",
      "ramadan-begins",
      "laylat-al-qadr",
      "eid-al-fitr",
      "dhul-hijjah-begins",
      "tarwiyah",
      "arafah",
      "eid-al-adha",
      "tashriq",
    ]);
    for (const e of ISLAMIC_EVENTS) {
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.note.length).toBeGreaterThan(0);
    }
  });
});

describe("islamicEventsInMonth", () => {
  it("returns the observances for a month, in day order", () => {
    const m1 = islamicEventsInMonth(1).map((e) => e.id);
    expect(m1).toEqual(["islamic-new-year", "tasua", "ashura"]);
    expect(islamicEventsInMonth(12).map((e) => e.id)).toEqual([
      "dhul-hijjah-begins",
      "tarwiyah",
      "arafah",
      "eid-al-adha",
      "tashriq",
    ]);
  });

  it("returns nothing for a month with no major observance", () => {
    expect(islamicEventsInMonth(2)).toEqual([]);
  });
});

describe("upcomingIslamicEvents", () => {
  const today = { year: 2026, month: 6, day: 22 };

  it("resolves the next events soonest-first with a day countdown", () => {
    const up = upcomingIslamicEvents(today, 3);
    expect(up.map((u) => u.event.id)).toEqual(["tasua", "ashura", "mawlid"]);
    const next = up[0]!;
    expect(next.daysUntil).toBe(3);
    expect(next.gregorian).toEqual({ year: 2026, month: 6, day: 25 });
    expect(next.hijri).toEqual({ year: 1448, month: 1, day: 9 });
  });

  it("never returns a past event and stays sorted", () => {
    const up = upcomingIslamicEvents(today);
    expect(up).toHaveLength(ISLAMIC_EVENTS.length);
    for (const u of up) expect(u.daysUntil).toBeGreaterThanOrEqual(0);
    const days = up.map((u) => u.daysUntil);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("resolves the whole year to exact Gregorian dates and day counts", () => {
    // A golden pin of the full roster across Gregorian month and year boundaries
    // (Jun 2026 → Jun 2027). Earlier daysUntil assertions compare two same-month
    // dates, so the Julian-day arithmetic cancels; spanning months/years here makes
    // any +/-/*// flip in `dayNumber` change at least one count. Computed from the
    // tabular calendar (hijri.ts) — regenerate with the same fixed `today` if events change.
    const rows = upcomingIslamicEvents(today).map((u) => ({
      id: u.event.id,
      g: `${u.gregorian.year}-${u.gregorian.month}-${u.gregorian.day}`,
      d: u.daysUntil,
    }));
    expect(rows).toEqual([
      { id: "tasua", g: "2026-6-25", d: 3 },
      { id: "ashura", g: "2026-6-26", d: 4 },
      { id: "mawlid", g: "2026-8-26", d: 65 },
      { id: "isra-miraj", g: "2027-1-6", d: 198 },
      { id: "laylat-al-baraah", g: "2027-1-24", d: 216 },
      { id: "ramadan-begins", g: "2027-2-8", d: 231 },
      { id: "laylat-al-qadr", g: "2027-3-6", d: 257 },
      { id: "eid-al-fitr", g: "2027-3-10", d: 261 },
      { id: "dhul-hijjah-begins", g: "2027-5-8", d: 320 },
      { id: "tarwiyah", g: "2027-5-15", d: 327 },
      { id: "arafah", g: "2027-5-16", d: 328 },
      { id: "eid-al-adha", g: "2027-5-17", d: 329 },
      { id: "tashriq", g: "2027-5-18", d: 330 },
      { id: "islamic-new-year", g: "2027-6-6", d: 349 },
    ]);
  });

  it("resolves exact dates from a second anchor in a different month regime", () => {
    // A second golden pin from a December `today` (a Gregorian month whose Julian-day
    // month-term parity differs from June). This catches the `floor((153*m±2)/5)` and
    // term-sign mutations the June anchor leaves cancelling. Regenerate with this fixed today.
    const fromDecember = { year: 2026, month: 12, day: 15 };
    const rows = upcomingIslamicEvents(fromDecember).map((u) => ({
      id: u.event.id,
      g: `${u.gregorian.year}-${u.gregorian.month}-${u.gregorian.day}`,
      d: u.daysUntil,
    }));
    expect(rows).toEqual([
      { id: "isra-miraj", g: "2027-1-6", d: 22 },
      { id: "laylat-al-baraah", g: "2027-1-24", d: 40 },
      { id: "ramadan-begins", g: "2027-2-8", d: 55 },
      { id: "laylat-al-qadr", g: "2027-3-6", d: 81 },
      { id: "eid-al-fitr", g: "2027-3-10", d: 85 },
      { id: "dhul-hijjah-begins", g: "2027-5-8", d: 144 },
      { id: "tarwiyah", g: "2027-5-15", d: 151 },
      { id: "arafah", g: "2027-5-16", d: 152 },
      { id: "eid-al-adha", g: "2027-5-17", d: 153 },
      { id: "tashriq", g: "2027-5-18", d: 154 },
      { id: "islamic-new-year", g: "2027-6-6", d: 173 },
      { id: "tasua", g: "2027-6-14", d: 181 },
      { id: "ashura", g: "2027-6-15", d: 182 },
      { id: "mawlid", g: "2027-8-15", d: 243 },
    ]);
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
    expect(shifted.gregorian).toEqual({ year: 2026, month: 6, day: 24 });
  });
});

describe("islamicEventsForMonth", () => {
  const today = { year: 2026, month: 6, day: 22 };

  it("resolves a month's observances with a signed countdown", () => {
    // Muḥarram 1448: New Year (1) has passed; ʿĀshūrāʾ (10) is 4 days away.
    const m = islamicEventsForMonth(1448, 1, today);
    expect(m.map((e) => e.event.id)).toEqual(["islamic-new-year", "tasua", "ashura"]);
    expect(m[0]!.daysUntil).toBeLessThan(0); // New Year already passed
    const ashura = m.find((e) => e.event.id === "ashura")!;
    expect(ashura.daysUntil).toBe(4);
    expect(ashura.gregorian).toEqual({ year: 2026, month: 6, day: 26 });
  });

  it("stays in day order and is empty for a month with no observance", () => {
    expect(islamicEventsForMonth(1448, 12, today).map((e) => e.event.id)).toEqual([
      "dhul-hijjah-begins",
      "tarwiyah",
      "arafah",
      "eid-al-adha",
      "tashriq",
    ]);
    expect(islamicEventsForMonth(1448, 2, today)).toEqual([]);
  });

  it("resolves the same event later in a future Hijri year", () => {
    const pick = (year: number) =>
      islamicEventsForMonth(year, 1, today).find((e) => e.event.id === "ashura")!;
    const thisYear = pick(1448);
    const nextYear = pick(1449);
    expect(nextYear.daysUntil).toBeGreaterThan(thisYear.daysUntil);
    expect(nextYear.gregorian.year).toBe(2027);
  });
});
