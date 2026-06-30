import { describe, expect, it } from "vitest";
import { hijriToGregorian } from "./hijri";
import { addDays } from "./reading-goals";
import type { HaidLog } from "./haid";
import {
  EMPTY_FASTING_QADA,
  adjustFastingMadeUp,
  fastingMadeUp,
  fastingQadaOwed,
  fastingQadaRemaining,
  isRamadanDate,
  ramadanPauseDays,
} from "./fasting-qada";

// Build YYYY-MM-DD fixtures from the calendar itself, so the tests track the
// tabular conversion rather than hard-coded magic dates.
const iso = (d: { year: number; month: number; day: number }): string =>
  `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
const ram = (day: number, year = 1447): string => iso(hijriToGregorian({ year, month: 9, day }));
const shaban = (day: number, year = 1447): string => iso(hijriToGregorian({ year, month: 8, day }));
const shawwal = (day: number, year = 1447): string => iso(hijriToGregorian({ year, month: 10, day }));

describe("isRamadanDate", () => {
  it("is true inside Ramaḍān and false outside it", () => {
    expect(isRamadanDate(ram(10))).toBe(true);
    expect(isRamadanDate(shaban(10))).toBe(false);
    expect(isRamadanDate(shawwal(1))).toBe(false);
  });

  it("rejects a malformed date string", () => {
    expect(isRamadanDate("not-a-date")).toBe(false);
    expect(isRamadanDate("")).toBe(false);
  });

  it("rejects a date with the wrong number of parts even when the prefix is Ramaḍān", () => {
    // A 4-part string whose first three components are a valid Ramaḍān date: the
    // `parts.length !== 3` guard must reject it (not silently use the first three).
    expect(isRamadanDate(ram(10) + "-5")).toBe(false);
    expect(isRamadanDate(ram(10).replace("-", "/"))).toBe(false); // 2 parts after split
  });

  it("rejects a non-integer day/month/year on an otherwise-Ramaḍān date", () => {
    const [y, m, d] = ram(10).split("-");
    expect(isRamadanDate(`${y}-${m}-${d}.5`)).toBe(false); // fractional day
    expect(isRamadanDate(`${y}-${Number(m) + 0.5}-${d}`)).toBe(false); // fractional month
    expect(isRamadanDate(`${Number(y) + 0.5}-${m}-${d}`)).toBe(false); // fractional year
  });

  it("honours the Hijri adjustment", () => {
    // The Gregorian day before Ramaḍān 1 reads as Shaʿbān normally, but with a
    // +1 adjustment the tabular month shifts so it reads as Ramaḍān 1.
    const dayBeforeRamadan = addDays(ram(1), -1);
    expect(isRamadanDate(dayBeforeRamadan)).toBe(false);
    expect(isRamadanDate(dayBeforeRamadan, 1)).toBe(true);
  });
});

describe("fastingQadaOwed", () => {
  const today = ram(20);

  it("is zero with no pauses", () => {
    expect(fastingQadaOwed([], today)).toBe(0);
  });

  it("ignores a pause entirely outside Ramaḍān", () => {
    const log: HaidLog = [{ start: shaban(5), end: shaban(9) }];
    expect(fastingQadaOwed(log, today)).toBe(0);
  });

  it("counts every paused day inside Ramaḍān", () => {
    const log: HaidLog = [{ start: ram(5), end: ram(9) }]; // 5,6,7,8,9 → 5 days
    expect(fastingQadaOwed(log, today)).toBe(5);
  });

  it("counts only the Ramaḍān portion of a straddling pause", () => {
    const log: HaidLog = [{ start: shaban(27), end: ram(3) }]; // Ramaḍān 1,2,3 → 3
    expect(fastingQadaOwed(log, today)).toBe(3);
  });

  it("bounds an open (ongoing) pause to today", () => {
    const log: HaidLog = [{ start: ram(8) }]; // no end → ongoing
    // Counts Ramaḍān days from the start up to the injected "today" (ram 10).
    expect(fastingQadaOwed(log, ram(10))).toBe(3); // 8, 9, 10
  });

  it("does not double-count overlapping periods", () => {
    const log: HaidLog = [
      { start: ram(5), end: ram(9) },
      { start: ram(8), end: ram(11) },
    ];
    expect(ramadanPauseDays(log, today)).toHaveLength(7); // 5..11 distinct
  });

  it("skips a corrupt range (end before start)", () => {
    const log: HaidLog = [{ start: ram(9), end: ram(5) }];
    expect(fastingQadaOwed(log, today)).toBe(0);
  });

  it("counts a single-day pause (start === end) inside Ramaḍān", () => {
    // span === 0 must be processed (one day), pinning the `span < 0` bound against
    // a `<= 0` regression that would silently drop every single-day pause.
    expect(ramadanPauseDays([{ start: ram(10), end: ram(10) }], today)).toEqual([ram(10)]);
  });

  it("skips an absurdly long range rather than looping over it", () => {
    // A span beyond MAX_SPAN_DAYS (corrupt/foreign data) is skipped entirely — even
    // though it straddles many Ramaḍāns — bounding the loop.
    const log: HaidLog = [{ start: ram(1, 1440), end: ram(1, 1447) }]; // ~7 years > 1000 days
    expect(ramadanPauseDays(log, today)).toEqual([]);
  });
});

describe("EMPTY_FASTING_QADA", () => {
  it("is a zeroed log", () => {
    expect(EMPTY_FASTING_QADA).toEqual({ madeUp: 0 });
  });
});

describe("made-up accounting", () => {
  it("clamps the made-up count into [0, owed]", () => {
    expect(fastingMadeUp({ madeUp: -3 }, 5)).toBe(0);
    expect(fastingMadeUp({ madeUp: 9 }, 5)).toBe(5);
    expect(fastingMadeUp({ madeUp: 2 }, 5)).toBe(2);
    expect(fastingMadeUp({ madeUp: NaN }, 5)).toBe(0);
  });

  it("remaining is owed minus made-up, never negative", () => {
    expect(fastingQadaRemaining(EMPTY_FASTING_QADA, 5)).toBe(5);
    expect(fastingQadaRemaining({ madeUp: 2 }, 5)).toBe(3);
    expect(fastingQadaRemaining({ madeUp: 9 }, 5)).toBe(0);
  });

  it("adjust makes one up / undoes, clamped to [0, owed]", () => {
    let log = EMPTY_FASTING_QADA;
    log = adjustFastingMadeUp(log, 1, 3); // make up one
    expect(log.madeUp).toBe(1);
    log = adjustFastingMadeUp(log, 1, 3);
    log = adjustFastingMadeUp(log, 1, 3); // all three
    expect(log.madeUp).toBe(3);
    log = adjustFastingMadeUp(log, 1, 3); // can't exceed owed
    expect(log.madeUp).toBe(3);
    log = adjustFastingMadeUp(log, -1, 3); // undo one
    expect(log.madeUp).toBe(2);
  });
});
