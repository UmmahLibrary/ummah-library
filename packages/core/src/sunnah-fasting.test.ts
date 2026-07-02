import { describe, expect, it } from "vitest";
import type { GregorianDate } from "./hijri";
import { addGregorianDays, gregorianToHijri, gregorianWeekday, hijriToGregorian } from "./hijri";
import { nextSunnahFastReminder, upcomingSunnahFasts } from "./sunnah-fasting";

/** Independent oracle: the platform's own UTC weekday for a civil date. */
function utcWeekday(g: GregorianDate): number {
  return new Date(Date.UTC(g.year, g.month - 1, g.day)).getUTCDay();
}

describe("gregorianWeekday", () => {
  it("matches known anchors", () => {
    expect(gregorianWeekday({ year: 2000, month: 1, day: 1 })).toBe(6); // Saturday
    expect(gregorianWeekday({ year: 2026, month: 7, day: 2 })).toBe(4); // Thursday
    expect(gregorianWeekday({ year: 2026, month: 1, day: 1 })).toBe(4); // Thursday
  });

  it("agrees with the platform UTC weekday across a range", () => {
    let g: GregorianDate = { year: 2025, month: 1, day: 1 };
    for (let i = 0; i < 800; i++) {
      expect(gregorianWeekday(g)).toBe(utcWeekday(g));
      g = addGregorianDays(g, 1);
    }
  });
});

describe("addGregorianDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addGregorianDays({ year: 2026, month: 1, day: 1 }, -1)).toEqual({ year: 2025, month: 12, day: 31 });
    expect(addGregorianDays({ year: 2026, month: 2, day: 28 }, 1)).toEqual({ year: 2026, month: 3, day: 1 }); // 2026 not leap
    expect(addGregorianDays({ year: 2026, month: 7, day: 2 }, 7)).toEqual({ year: 2026, month: 7, day: 9 });
  });
});

describe("upcomingSunnahFasts", () => {
  const today: GregorianDate = { year: 2026, month: 7, day: 2 }; // a Thursday

  it("returns fasts sorted soonest-first, all upcoming, with unique dates", () => {
    const fasts = upcomingSunnahFasts(today, 8);
    expect(fasts.length).toBeLessThanOrEqual(8);
    expect(fasts.length).toBeGreaterThan(0);
    for (let i = 1; i < fasts.length; i++) {
      expect(fasts[i]!.daysUntil).toBeGreaterThanOrEqual(fasts[i - 1]!.daysUntil);
    }
    expect(fasts.every((f) => f.daysUntil >= 0)).toBe(true);
    const keys = fasts.map((f) => `${f.gregorian.year}-${f.gregorian.month}-${f.gregorian.day}`);
    expect(new Set(keys).size).toBe(keys.length); // no duplicate dates
  });

  it("labels each fast consistently with its actual date", () => {
    for (const f of upcomingSunnahFasts(today, 12)) {
      if (f.kind === "monday") expect(gregorianWeekday(f.gregorian)).toBe(1);
      if (f.kind === "thursday") expect(gregorianWeekday(f.gregorian)).toBe(4);
      if (f.kind === "white-day") {
        expect([13, 14, 15]).toContain(f.hijri.day);
        // The stored Hijri date resolves back to the stored Gregorian one.
        expect(hijriToGregorian(f.hijri)).toEqual(f.gregorian);
      }
    }
  });

  it("surfaces today's Thursday and the coming Monday", () => {
    const fasts = upcomingSunnahFasts(today, 8);
    expect(fasts.some((f) => f.kind === "thursday" && f.daysUntil === 0)).toBe(true);
    expect(fasts.some((f) => f.kind === "monday" && f.daysUntil === 4)).toBe(true); // Mon 2026-07-06
  });

  it("lists a white day that is also a weekly day once, as the white day", () => {
    const keyOf = (g: GregorianDate) => `${g.year}-${g.month}-${g.day}`;
    // A white day is where the calendar *places* the 13th–15th (via hijriToGregorian);
    // find a real one that also falls on a Monday/Thursday, matching the resolver.
    let probe: GregorianDate = { year: 2026, month: 1, day: 1 };
    let hit: GregorianDate | null = null;
    for (let i = 0; i < 400 && !hit; i++) {
      const h = gregorianToHijri(probe);
      const isWhite = [13, 14, 15].some((d) => keyOf(hijriToGregorian({ ...h, day: d })) === keyOf(probe));
      const wd = gregorianWeekday(probe);
      if (isWhite && (wd === 1 || wd === 4)) hit = probe;
      probe = addGregorianDays(probe, 1);
    }
    expect(hit).not.toBeNull();

    const from = addGregorianDays(hit!, -3);
    const coinciding = upcomingSunnahFasts(from, 30).filter((f) => keyOf(f.gregorian) === keyOf(hit!));
    expect(coinciding).toHaveLength(1); // collapsed to a single entry
    expect(coinciding[0]!.kind).toBe("white-day"); // …and it's the white day, not the weekly one
  });

  it("honours count and the sighting adjustment", () => {
    expect(upcomingSunnahFasts(today, 3)).toHaveLength(3);
    // A white day's Gregorian date is resolved with the same adjustment threaded through.
    const white = upcomingSunnahFasts(today, 12, 1).find((f) => f.kind === "white-day")!;
    expect(white.gregorian).toEqual(hijriToGregorian(white.hijri, 1));
  });
});

describe("nextSunnahFastReminder", () => {
  it("fires at 20:00 the evening before the next fast, in the future", () => {
    const now = new Date(2026, 6, 2, 10, 0, 0); // Thu 2026-07-02, 10:00 local
    const res = nextSunnahFastReminder(now)!;
    expect(res).not.toBeNull();
    expect(res.at.getHours()).toBe(20);
    expect(res.at.getMinutes()).toBe(0);
    expect(res.at.getTime()).toBeGreaterThan(now.getTime());
    // `at` is exactly the day before the fast, locally.
    const eve = addGregorianDays(res.fast.gregorian, -1);
    expect(res.at.getFullYear()).toBe(eve.year);
    expect(res.at.getMonth()).toBe(eve.month - 1);
    expect(res.at.getDate()).toBe(eve.day);
  });

  it("skips a fast whose evening-before has already passed (never reminds for today)", () => {
    // 22:00 on a Thursday: today's fast is over, and its eve (yesterday) is long gone.
    const now = new Date(2026, 6, 2, 22, 0, 0);
    const res = nextSunnahFastReminder(now)!;
    expect(res.fast.daysUntil).toBeGreaterThanOrEqual(1);
    expect(res.at.getTime()).toBeGreaterThan(now.getTime());
  });
});
