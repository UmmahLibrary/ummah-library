import { describe, expect, it } from "vitest";
import {
  HIJRI_MONTHS,
  type HijriDate,
  formatHijri,
  gregorianToHijri,
  hijriMonthLength,
  hijriToGregorian,
  isHijriLeapYear,
} from "./hijri";

describe("gregorianToHijri", () => {
  // Reference dates cross-checked against ICU `islamic-civil` (the tabular calendar).
  const cases: [string, [number, number, number], HijriDate][] = [
    ["epoch", [622, 7, 19], { year: 1, month: 1, day: 1 }], // Julian 622-07-16 = proleptic Gregorian 622-07-19
    ["2000-01-01", [2000, 1, 1], { year: 1420, month: 9, day: 24 }],
    ["2024-03-11", [2024, 3, 11], { year: 1445, month: 9, day: 1 }],
    ["2026-06-07", [2026, 6, 7], { year: 1447, month: 12, day: 21 }],
  ];

  for (const [name, [y, m, d], expected] of cases) {
    it(`converts ${name}`, () => {
      expect(gregorianToHijri({ year: y, month: m, day: d })).toEqual(expected);
    });
  }

  it("applies a positive day adjustment", () => {
    const base = gregorianToHijri({ year: 2026, month: 6, day: 7 });
    const plus1 = gregorianToHijri({ year: 2026, month: 6, day: 7 }, 1);
    expect(plus1.day).toBe(base.day + 1);
  });
});

describe("hijriToGregorian", () => {
  it("round-trips every month start across a century", () => {
    for (let year = 1400; year < 1500; year++) {
      for (let month = 1; month <= 12; month++) {
        const h = { year, month, day: 1 };
        const g = hijriToGregorian(h);
        expect(gregorianToHijri(g)).toEqual(h);
      }
    }
  });

  it("undoes the adjustment it was given", () => {
    const g = { year: 2026, month: 6, day: 7 };
    const h = gregorianToHijri(g, 1);
    expect(hijriToGregorian(h, 1)).toEqual(g);
  });
});

describe("isHijriLeapYear / hijriMonthLength", () => {
  it("marks the known leap years in a 30-year cycle", () => {
    // Type II ("Kuwaiti") tabular leap years.
    const leaps = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    for (let y = 1; y <= 30; y++) {
      expect(isHijriLeapYear(y)).toBe(leaps.includes(y));
    }
  });

  it("alternates 30/29 and lengthens Dhū al-Ḥijjah in leap years", () => {
    expect(hijriMonthLength(1447, 1)).toBe(30); // Muḥarram
    expect(hijriMonthLength(1447, 2)).toBe(29); // Ṣafar
    expect(hijriMonthLength(1442, 12)).toBe(30); // 1442 is leap
    expect(hijriMonthLength(1443, 12)).toBe(29); // 1443 is not
  });
});

describe("formatHijri", () => {
  it("formats transliterated and Arabic names", () => {
    const h = { year: 1447, month: 9, day: 12 };
    expect(formatHijri(h)).toBe("12 Ramaḍān 1447 AH");
    expect(formatHijri(h, { arabic: true })).toBe("12 رمضان 1447 AH");
  });

  it("has twelve months", () => {
    expect(HIJRI_MONTHS).toHaveLength(12);
  });
});
