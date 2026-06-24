import { describe, expect, it } from "vitest";
import { ayahCountOf, pageNumberOf } from "./quran-structure";
import { addDays, daysBetween } from "./reading-goals";
import {
  type ActivePlan,
  type PlanTemplate,
  PLAN_TEMPLATES,
  activatePlan,
  advanceCursorToPage,
  catchUpPortion,
  computeTodayPortion,
  cumulativeUnits,
  currentDay,
  daysAheadBehind,
  effectiveToday,
  extendPlan,
  isActivePlan,
  isDayComplete,
  isPaused,
  isPlanComplete,
  isValidDateString,
  materializeDay,
  nextDailyReminder,
  pausePlan,
  percentComplete,
  planDuration,
  planEndDate,
  planReminderContent,
  planWeekWindow,
  projectedFinish,
  rangeOfJuz,
  rangeOfPages,
  rangeOfSurahs,
  rebalance,
  repace,
  reschedule,
  resumePlan,
  setUnitsRead,
  surahList,
  templateById,
  todayProgress,
  toggleDayComplete,
  totalUnits,
  unitWord,
  unitsBehind,
  unitsRemaining,
  validatePlanDraft,
} from "./reading-plans";

const START = "2026-01-01";

/** A fixed one-unit-a-day plan over juzʾ 1…30 (30 days), started on START. */
const ramadan = (): ActivePlan => activatePlan(templateById("ramadan-khatm")!, START);

/** A template helper for ad-hoc plans in tests. */
const tpl = (range: PlanTemplate["range"], schedule: PlanTemplate["schedule"]): PlanTemplate => ({
  id: "t",
  name: "Test",
  tag: "",
  len: "",
  desc: "",
  range,
  schedule,
});

// ── Date helpers ─────────────────────────────────────────────────────────────

describe("date helpers", () => {
  it("counts whole days between dates, signed", () => {
    expect(daysBetween("2026-01-01", "2026-01-08")).toBe(7);
    expect(daysBetween("2026-01-08", "2026-01-01")).toBe(-7);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("adds (and subtracts) days across month boundaries", () => {
    expect(addDays("2026-01-30", 2)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("validates YYYY-MM-DD strings", () => {
    expect(isValidDateString("2026-06-15")).toBe(true);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("nope")).toBe(false);
    // Impossible calendar days must be rejected, not silently rolled into the
    // next month (Feb 30 → Mar 2), which would desync end-date from duration.
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-04-31")).toBe(false);
    expect(isValidDateString("2025-02-29")).toBe(false); // 2025 is not a leap year
    expect(isValidDateString("2024-02-29")).toBe(true); // 2024 is a leap year
  });

  it("isActivePlan accepts a real plan and rejects corrupt/peer-synced shapes", () => {
    const good = activatePlan(templateById("ramadan-khatm")!, "2026-03-01");
    expect(isActivePlan(good)).toBe(true);
    for (const bad of [
      null,
      {},
      "oops",
      5,
      [],
      { template: null, startDate: "2026-01-01", unitsRead: 0 },
      { template: { schedule: { kind: "fixed" }, range: { units: [] } }, startDate: "2026-01-01", unitsRead: 0 }, // empty units
      { template: good.template, startDate: "2026-01-01", unitsRead: Number.NaN }, // non-finite cursor
      { template: good.template, startDate: 20260101, unitsRead: 0 }, // non-string date
    ]) {
      expect(isActivePlan(bad)).toBe(false);
    }
  });
});

// ── Catalogue + range builders ───────────────────────────────────────────────

describe("range builders", () => {
  it("builds contiguous and explicit ranges", () => {
    expect(rangeOfJuz(1, 30).units).toHaveLength(30);
    expect(rangeOfSurahs(78, 114).units).toHaveLength(37);
    expect(rangeOfPages(1, 604).units).toHaveLength(604);
    expect(surahList([1, 36, 55]).units).toEqual([1, 36, 55]);
    expect(totalUnits(rangeOfJuz(1, 5))).toBe(5);
  });
});

describe("PLAN_TEMPLATES", () => {
  it("ships well-formed templates with valid unit indices", () => {
    expect(PLAN_TEMPLATES.length).toBeGreaterThan(0);
    for (const t of PLAN_TEMPLATES) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.range.units.length).toBeGreaterThan(0);
      for (const u of t.range.units) expect(u).toBeGreaterThanOrEqual(1);
    }
  });

  it("looks up a known template and misses gracefully", () => {
    expect(templateById("ramadan-khatm")?.name).toBe("Ramaḍān Khatm");
    expect(templateById("nope")).toBeUndefined();
  });

  it("ships the launch catalogue with the expected pacing", () => {
    const dur = (id: string) => planDuration(activatePlan(templateById(id)!, START));
    expect(dur("ramadan-khatm")).toBe(30);
    expect(dur("juz-sprint")).toBe(30);
    expect(dur("quran-60")).toBe(60); // 60 aḥzāb, one a day
    expect(dur("quran-year")).toBe(302); // 604 pages, two a day
    expect(dur("juz-amma")).toBe(37); // 37 sūrahs of Juzʾ ʿAmma
  });

  it("validates every template against the core types (acceptance)", () => {
    for (const t of PLAN_TEMPLATES) {
      expect(validatePlanDraft({ range: t.range, schedule: t.schedule, startDate: START })).toEqual([]);
      const plan = activatePlan(t, START);
      expect(planDuration(plan)).toBeGreaterThan(0);
      expect(totalUnits(t.range)).toBeGreaterThan(0);
      expect(computeTodayPortion(plan, START).empty).toBe(false);
    }
  });
});

// ── Duration + end date ──────────────────────────────────────────────────────

describe("planDuration", () => {
  it("derives days from a fixed cadence (ceil)", () => {
    expect(planDuration(ramadan())).toBe(30);
    expect(planDuration(activatePlan(tpl(rangeOfJuz(1, 30), { kind: "fixed", unitsPerDay: 4 }), START))).toBe(8);
  });

  it("uses the inclusive span for a target date", () => {
    const plan = activatePlan(tpl(rangeOfJuz(1, 30), { kind: "targetDate", endDate: "2026-01-07" }), START);
    expect(planDuration(plan)).toBe(7);
  });

  it("rejects impossible plans", () => {
    expect(() => planDuration(activatePlan(tpl({ unit: "juz", units: [] }, { kind: "fixed", unitsPerDay: 1 }), START))).toThrow(RangeError);
    expect(() => planDuration(activatePlan(tpl(rangeOfJuz(1, 30), { kind: "fixed", unitsPerDay: 0 }), START))).toThrow(RangeError);
    const past = activatePlan(tpl(rangeOfJuz(1, 30), { kind: "targetDate", endDate: "2025-12-01" }), START);
    expect(() => planDuration(past)).toThrow(/before the start/);
  });
});

describe("planEndDate", () => {
  it("derives the end of a fixed plan", () => {
    expect(planEndDate(ramadan())).toBe("2026-01-30");
  });
  it("returns the chosen date for a target-date plan", () => {
    const plan = activatePlan(tpl(rangeOfJuz(1, 30), { kind: "targetDate", endDate: "2026-02-14" }), START);
    expect(planEndDate(plan)).toBe("2026-02-14");
  });
});

// ── Acceptance: target-date scheduling ───────────────────────────────────────

describe("target-date scheduling (acceptance)", () => {
  it("spreads the work so the plan finishes on or before the end date", () => {
    const endDate = "2026-01-07"; // 7 days
    const plan = activatePlan(tpl(rangeOfJuz(1, 30), { kind: "targetDate", endDate }), START);
    const dur = planDuration(plan);

    // The daily amounts sum to the whole range and never exceed the ceil pace.
    const perDay = ceilPace(30, dur);
    let sum = 0;
    for (let d = 1; d <= dur; d++) {
      const amount = cumulativeUnits(plan, d) - cumulativeUnits(plan, d - 1);
      expect(amount).toBeLessThanOrEqual(perDay);
      sum += amount;
    }
    expect(sum).toBe(30);

    // Everything is scheduled by the final day, which is on/before the end date.
    expect(cumulativeUnits(plan, dur)).toBe(30);
    expect(daysBetween(planEndDate(plan), endDate)).toBeGreaterThanOrEqual(0);
  });

  it("handles a range shorter than the number of days (idle days, still finishes)", () => {
    const plan = activatePlan(tpl(rangeOfJuz(1, 5), { kind: "targetDate", endDate: "2026-01-10" }), START);
    expect(planDuration(plan)).toBe(10);
    expect(cumulativeUnits(plan, 10)).toBe(5);
    expect(materializeDay(plan, 1).empty).toBe(true); // nothing due on day 1
  });
});

function ceilPace(total: number, days: number): number {
  return Math.ceil(total / days);
}

// ── Cumulative distribution + current day ────────────────────────────────────

describe("cumulativeUnits", () => {
  it("runs from 0 to the total, monotonically", () => {
    const plan = ramadan();
    expect(cumulativeUnits(plan, 0)).toBe(0);
    expect(cumulativeUnits(plan, 30)).toBe(30);
    expect(cumulativeUnits(plan, 31)).toBe(30); // clamps past the end
    for (let d = 1; d <= 30; d++) {
      expect(cumulativeUnits(plan, d)).toBeGreaterThanOrEqual(cumulativeUnits(plan, d - 1));
    }
  });
});

describe("currentDay", () => {
  const plan = ramadan();
  it("clamps before the start, tracks the calendar, and clamps past the end", () => {
    expect(currentDay(plan, "2025-12-20")).toBe(1);
    expect(currentDay(plan, START)).toBe(1);
    expect(currentDay(plan, "2026-01-10")).toBe(10);
    expect(currentDay(plan, "2026-03-01")).toBe(30);
  });
});

// ── Progress metrics ─────────────────────────────────────────────────────────

describe("unitsRemaining + percentComplete", () => {
  it("reflects the cursor", () => {
    const plan = setUnitsRead(ramadan(), 12);
    expect(unitsRemaining(plan)).toBe(18);
    expect(percentComplete(plan)).toBe(40);
  });

  it("clamps an over-total cursor (a deserialized plan can exceed total) to 100% / 0 left", () => {
    // ActivePlan is local-first state with no runtime validation; a shrunk
    // template total can leave unitsRead > total. Pins the Math.min / Math.max guards.
    const over = { ...ramadan(), unitsRead: 999 };
    expect(percentComplete(over)).toBe(100);
    expect(unitsRemaining(over)).toBe(0);
  });
  it("is 0% fresh and 100% done", () => {
    expect(percentComplete(ramadan())).toBe(0);
    expect(percentComplete(setUnitsRead(ramadan(), 30))).toBe(100);
  });
});

describe("isDayComplete", () => {
  it("is true once the cursor reaches the day's cumulative target", () => {
    const plan = setUnitsRead(ramadan(), 3);
    expect(isDayComplete(plan, 3)).toBe(true);
    expect(isDayComplete(plan, 4)).toBe(false);
  });
});

describe("daysAheadBehind", () => {
  const plan = ramadan();
  it("is 0 when on track for today", () => {
    expect(daysAheadBehind(plan, START)).toBe(0); // day 1, nothing read yet
    expect(daysAheadBehind(setUnitsRead(plan, 1), "2026-01-02")).toBe(0); // day 2, 1 read
  });
  it("is negative when behind", () => {
    expect(daysAheadBehind(setUnitsRead(plan, 1), "2026-01-03")).toBe(-1);
  });
  it("is positive when ahead", () => {
    expect(daysAheadBehind(setUnitsRead(plan, 2), START)).toBe(1);
  });
});

describe("projectedFinish", () => {
  const plan = ramadan();
  it("falls back to the planned end date before any progress", () => {
    expect(projectedFinish(plan, START)).toBe("2026-01-30");
  });
  it("returns today once complete", () => {
    expect(projectedFinish(setUnitsRead(plan, 30), "2026-01-15")).toBe("2026-01-15");
  });
  it("projects later than planned when behind pace", () => {
    const behind = setUnitsRead(plan, 5);
    expect(daysBetween("2026-01-30", projectedFinish(behind, "2026-01-11"))).toBeGreaterThan(0);
  });
  it("projects earlier than planned when ahead of pace", () => {
    const ahead = setUnitsRead(plan, 6); // 6 juzʾ by day 3 → 2/day
    expect(daysBetween(projectedFinish(ahead, "2026-01-03"), "2026-01-30")).toBeGreaterThan(0);
  });
});

// ── Portions + labels (unit conversions) ─────────────────────────────────────

describe("materializeDay", () => {
  it("labels a single juzʾ and deep-links to it", () => {
    const day = materializeDay(ramadan(), 1);
    expect(day.label).toBe("Juzʾ 1");
    expect(day.target).toEqual({ kind: "juz", juz: 1 });
    expect(day.startRef).toEqual({ sura: 1, aya: 1 });
    expect(day.endRef).toEqual({ sura: 2, aya: 141 }); // verse before juzʾ 2
    expect(day.est).toBe("~16 min"); // 148 ayahs × ~6.3s — pins the estimate formula
    expect(day.empty).toBe(false);
  });

  it("ends a juzʾ that closes on a sūrah boundary at that sūrah's last verse", () => {
    // Juzʾ 13 ends where juzʾ 14 begins (15:1), i.e. the last verse of Sūrah Ibrāhīm (14).
    const plan = activatePlan(tpl(rangeOfJuz(13, 13), { kind: "fixed", unitsPerDay: 1 }), START);
    expect(materializeDay(plan, 1).endRef).toEqual({ sura: 14, aya: ayahCountOf(14) });
  });

  it("labels a single sūrah using the structure's ayah count", () => {
    const plan = activatePlan(templateById("juz-amma")!, START);
    const day = materializeDay(plan, 1);
    expect(day.label).toBe("Sūrah 78");
    expect(day.target).toEqual({ kind: "surah", surah: 78 });
    expect(day.endRef).toEqual({ sura: 78, aya: ayahCountOf(78) });
  });

  it("labels a contiguous multi-unit portion as a range", () => {
    const plan = activatePlan(tpl(rangeOfJuz(1, 6), { kind: "fixed", unitsPerDay: 3 }), START);
    expect(materializeDay(plan, 1).label).toBe("Juzʾ 1–3");
  });

  it("lists a non-contiguous multi-unit portion", () => {
    const plan = activatePlan(tpl(surahList([1, 36, 55]), { kind: "fixed", unitsPerDay: 3 }), START);
    const day = materializeDay(plan, 1);
    expect(day.label).toBe("Sūrah 1, Sūrah 36, Sūrah 55");
    // Estimate sums the three short sūrahs (7+83+78 = 168 ayahs), not the linear
    // mushaf span Sūrah 1 → Sūrah 55, which would be ~30× larger.
    expect(day.est).toBe("~18 min");
  });

  it("resolves page and ayah units", () => {
    const pages = activatePlan(tpl(rangeOfPages(1, 3), { kind: "fixed", unitsPerDay: 1 }), START);
    const p1 = materializeDay(pages, 1);
    expect(p1.label).toBe("Page 1");
    expect(p1.startRef).toEqual({ sura: 1, aya: 1 });

    const ayat = activatePlan(tpl({ unit: "ayah", units: [1, 2, 3] }, { kind: "fixed", unitsPerDay: 1 }), START);
    const a1 = materializeDay(ayat, 1);
    expect(a1.label).toBe("Ayah 1:1");
    expect(a1.target).toEqual({ kind: "ayah", ref: { sura: 1, aya: 1 } });

    const hizb = activatePlan(tpl({ unit: "hizb", units: [1, 2] }, { kind: "fixed", unitsPerDay: 1 }), START);
    const h1 = materializeDay(hizb, 1);
    expect(h1.label).toBe("Ḥizb 1");
    expect(h1.target).toEqual({ kind: "hizb", hizb: 1 });
  });

  it("returns an empty portion when nothing is scheduled", () => {
    const plan = activatePlan(tpl(rangeOfJuz(1, 5), { kind: "targetDate", endDate: "2026-01-10" }), START);
    const day = materializeDay(plan, 1);
    expect(day.empty).toBe(true);
    expect(day.count).toBe(0);
    expect(day.label).toBe("Nothing scheduled");
  });
});

describe("computeTodayPortion", () => {
  it("points at the next unread unit for an on-track reader", () => {
    const onTrack = setUnitsRead(ramadan(), 4); // juzʾ 1–4 done by day 5
    expect(computeTodayPortion(onTrack, "2026-01-05").label).toBe("Juzʾ 5");
  });
  it("points at the next unread unit when behind — never skips ahead", () => {
    // Nothing read by day 5: the next portion is juzʾ 1, not the calendar's juzʾ 5.
    expect(computeTodayPortion(ramadan(), "2026-01-05").label).toBe("Juzʾ 1");
  });
});

describe("catch-up + re-pace (#70)", () => {
  // Behind: by day 10 of a 30-day juzʾ-a-day plan, only 5 juzʾ have been read.
  const behind = () => setUnitsRead(ramadan(), 5);
  const T10 = "2026-01-10";

  it("reports how far behind, in days and units", () => {
    expect(daysAheadBehind(behind(), T10)).toBeLessThan(0);
    expect(unitsBehind(behind(), T10)).toBe(5); // due 10, read 5
  });

  it("catch-up portion spans the backlog through today", () => {
    const portion = catchUpPortion(behind(), T10);
    expect(portion.fromUnit).toBe(6); // the next unread juzʾ
    expect(portion.toUnit).toBe(10); // through today
    expect(portion.count).toBe(5);
  });

  it("rebalance keeps the end date, re-paces, and lands the reader on track", () => {
    const plan = rebalance(behind(), T10);
    expect(planEndDate(plan)).toBe("2026-01-30"); // unchanged
    expect(daysAheadBehind(plan, T10)).toBe(0); // on track right after
    expect(cumulativeUnits(plan, planDuration(plan))).toBe(30); // still finishable
    // 25 juzʾ over the remaining ~21 days is steeper than 1/day — some day reads 2.
    let maxAmount = 0;
    for (let d = 11; d <= planDuration(plan); d++) {
      maxAmount = Math.max(maxAmount, cumulativeUnits(plan, d) - cumulativeUnits(plan, d - 1));
    }
    expect(maxAmount).toBe(2);
  });

  it("extend moves the end date later and eases the pace", () => {
    const plan = extendPlan(behind(), T10, 10);
    expect(daysBetween("2026-01-30", planEndDate(plan))).toBe(10); // +10 days
    expect(daysAheadBehind(plan, T10)).toBeGreaterThanOrEqual(0); // no longer behind
    expect(cumulativeUnits(plan, planDuration(plan))).toBe(30); // finishable
  });

  it("preserves overall progress through a re-pace", () => {
    const plan = rebalance(behind(), T10);
    expect(plan.unitsRead).toBe(5);
    expect(percentComplete(plan)).toBe(17); // 5/30 ≈ 17%, unchanged
  });

  it("rejects an end date before today", () => {
    expect(() => repace(behind(), T10, "2026-01-05")).toThrow(RangeError);
  });
});

describe("reader auto-advance (#69)", () => {
  const pagePlan = () => activatePlan(tpl(rangeOfPages(1, 10), { kind: "fixed", unitsPerDay: 2 }), START);

  it("advances the cursor through page-units as pages are read", () => {
    expect(advanceCursorToPage(pagePlan(), 4).unitsRead).toBe(4); // pages 1–4 read
    expect(advanceCursorToPage(pagePlan(), 0).unitsRead).toBe(0); // nothing yet
  });

  it("advances a juzʾ plan when the juzʾ's last page is reached", () => {
    const juz1EndPage = pageNumberOf({ sura: 2, aya: 141 }); // last verse of juzʾ 1
    expect(advanceCursorToPage(ramadan(), juz1EndPage).unitsRead).toBe(1);
    expect(advanceCursorToPage(ramadan(), juz1EndPage - 1).unitsRead).toBe(0);
  });

  it("never retreats the cursor (monotonic)", () => {
    expect(advanceCursorToPage(setUnitsRead(pagePlan(), 6), 3).unitsRead).toBe(6);
  });

  it("reports today's portion progress for the chip", () => {
    expect(todayProgress(setUnitsRead(ramadan(), 2), "2026-01-03")).toEqual({ done: 0, total: 1 });
    expect(todayProgress(setUnitsRead(ramadan(), 3), "2026-01-03")).toEqual({ done: 1, total: 1 });
  });
});

// ── Week window ──────────────────────────────────────────────────────────────

describe("planWeekWindow", () => {
  const plan = ramadan();
  it("centres a seven-day window", () => {
    expect(planWeekWindow(plan, 10)).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });
  it("clamps to the start and the end", () => {
    expect(planWeekWindow(plan, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(planWeekWindow(plan, 30)).toEqual([24, 25, 26, 27, 28, 29, 30]);
  });
  it("shrinks for short plans", () => {
    const jewels = activatePlan(templateById("jewels")!, START);
    expect(planWeekWindow(jewels, 1)).toEqual([1, 2, 3, 4, 5]);
  });
});

// ── Lifecycle ────────────────────────────────────────────────────────────────

describe("activatePlan + setUnitsRead", () => {
  it("starts fresh and clamps the cursor", () => {
    const plan = ramadan();
    expect(plan.unitsRead).toBe(0);
    expect(setUnitsRead(plan, -5).unitsRead).toBe(0);
    expect(setUnitsRead(plan, 999).unitsRead).toBe(30);
    expect(setUnitsRead(plan, 3.7).unitsRead).toBe(3);
  });
});

describe("toggleDayComplete", () => {
  it("marks a day done, completing earlier days, and un-marks it", () => {
    const done = toggleDayComplete(ramadan(), 3);
    expect(done.unitsRead).toBe(3);
    expect(toggleDayComplete(done, 3).unitsRead).toBe(2); // back to end of day 2
  });
});

describe("reschedule", () => {
  it("changes the cadence while keeping progress and start date", () => {
    const plan = setUnitsRead(ramadan(), 4);
    const faster = reschedule(plan, { kind: "fixed", unitsPerDay: 2 });
    expect(planDuration(faster)).toBe(15);
    expect(faster.unitsRead).toBe(4);
    expect(faster.startDate).toBe(START);
  });
  it("moves to a target date", () => {
    const plan = reschedule(ramadan(), { kind: "targetDate", endDate: "2026-01-15" });
    expect(planEndDate(plan)).toBe("2026-01-15");
  });
  it("rejects impossible changes", () => {
    expect(() => reschedule(ramadan(), { kind: "targetDate", endDate: "2025-01-01" })).toThrow(RangeError);
    expect(() => reschedule(ramadan(), { kind: "fixed", unitsPerDay: 0 })).toThrow(RangeError);
  });
});

// ── Validation ───────────────────────────────────────────────────────────────

describe("validatePlanDraft", () => {
  it("accepts a sound draft", () => {
    expect(validatePlanDraft({ range: rangeOfJuz(1, 30), schedule: { kind: "fixed", unitsPerDay: 1 }, startDate: START })).toEqual([]);
    expect(validatePlanDraft({ range: rangeOfJuz(1, 30), schedule: { kind: "targetDate", endDate: "2026-06-01" }, startDate: START })).toEqual([]);
  });

  it("flags an empty range", () => {
    expect(validatePlanDraft({ range: { unit: "juz", units: [] }, schedule: { kind: "fixed", unitsPerDay: 1 }, startDate: START })).toContain(
      "Choose at least one portion to read.",
    );
  });

  it("flags a non-positive cadence", () => {
    expect(validatePlanDraft({ range: rangeOfJuz(1, 30), schedule: { kind: "fixed", unitsPerDay: 0 }, startDate: START })).toContain(
      "Read at least one unit per day.",
    );
  });

  it("flags a malformed or past end date", () => {
    expect(validatePlanDraft({ range: rangeOfJuz(1, 30), schedule: { kind: "targetDate", endDate: "nope" }, startDate: START })).toContain(
      "Pick a valid end date.",
    );
    expect(validatePlanDraft({ range: rangeOfJuz(1, 30), schedule: { kind: "targetDate", endDate: "2025-12-01" }, startDate: START })).toContain(
      "The end date can’t be before the start date.",
    );
  });
});

// ── Daily reminders (#71) ────────────────────────────────────────────────────

describe("daily reminders", () => {
  it("pluralises unit words sensibly", () => {
    expect(unitWord("page", 1)).toBe("page");
    expect(unitWord("page", 3)).toBe("pages");
    expect(unitWord("surah", 1)).toBe("sūrah");
    expect(unitWord("surah", 2)).toBe("sūrahs");
    expect(unitWord("juz", 5)).toBe("juzʾ");
    expect(unitWord("hizb", 2)).toBe("ḥizb");
  });

  it("schedules today when the reminder time is still ahead", () => {
    const now = new Date(2026, 0, 1, 12, 0, 0);
    const at = nextDailyReminder("20:00", now);
    expect(at?.getDate()).toBe(1);
    expect(at?.getHours()).toBe(20);
    expect(at?.getMinutes()).toBe(0);
  });

  it("rolls to tomorrow when the time has passed or equals now", () => {
    const now = new Date(2026, 0, 1, 12, 0, 0);
    expect(nextDailyReminder("08:00", now)?.getDate()).toBe(2);
    expect(nextDailyReminder("12:00", now)?.getDate()).toBe(2);
  });

  it("rejects malformed reminder times", () => {
    const now = new Date(2026, 0, 1, 12, 0, 0);
    expect(nextDailyReminder("nope", now)).toBeNull();
    expect(nextDailyReminder("25:00", now)).toBeNull();
    expect(nextDailyReminder("12:60", now)).toBeNull();
  });

  it("shows today's portion when on track", () => {
    const c = planReminderContent(ramadan(), START); // day 1, nothing read yet
    expect(c.title).toContain("Today’s reading");
    expect(c.body).toContain("1 juzʾ today");
  });

  it("celebrates a completed daily portion", () => {
    const c = planReminderContent(setUnitsRead(ramadan(), 1), START);
    expect(c.title).toContain("done");
    expect(c.body).toContain("on track");
  });

  it("nudges gently when behind — never guilt-framed", () => {
    const c = planReminderContent(setUnitsRead(ramadan(), 2), "2026-01-05"); // day 5, only 2 read
    expect(c.title).toContain("pick up where you left off");
    expect(c.body).toContain("3 juzʾ");
    expect(c.body.toLowerCase()).not.toMatch(/missed|failed|behind|should/);
  });
});

// ── Pause / resume (#68) ─────────────────────────────────────────────────────

describe("pause and resume", () => {
  it("is not paused by default", () => {
    const p = ramadan();
    expect(isPaused(p)).toBe(false);
    expect(effectiveToday(p, "2026-01-10")).toBe("2026-01-10");
  });

  it("pausing freezes the clock so a break never accrues 'behind'", () => {
    const onTrack = setUnitsRead(ramadan(), 4); // completed through day 4
    const p = pausePlan(onTrack, "2026-01-05");
    expect(isPaused(p)).toBe(true);
    expect(p.pausedOn).toBe("2026-01-05");
    expect(effectiveToday(p, "2026-01-20")).toBe("2026-01-05");
    expect(currentDay(p, effectiveToday(p, "2026-01-20"))).toBe(5);
    expect(daysAheadBehind(p, effectiveToday(p, "2026-01-20"))).toBe(0);
    // without the freeze, a long break would read as deeply behind
    expect(daysAheadBehind(p, "2026-01-20")).toBeLessThan(0);
  });

  it("pausing is idempotent", () => {
    const p = pausePlan(ramadan(), "2026-01-05");
    expect(pausePlan(p, "2026-01-09")).toBe(p);
  });

  it("resuming shifts the timeline forward by the break, preserving the day", () => {
    const paused = pausePlan(ramadan(), "2026-01-05");
    const resumed = resumePlan(paused, "2026-01-12"); // a 7-day break
    expect(isPaused(resumed)).toBe(false);
    expect(resumed.pausedOn).toBeUndefined();
    expect(resumed.startDate).toBe("2026-01-08");
    expect(currentDay(resumed, "2026-01-12")).toBe(5); // back where we left off
    expect(planEndDate(resumed)).toBe("2026-02-06"); // deadline pushed out 7 days
  });

  it("resume is a no-op when not paused", () => {
    const p = ramadan();
    expect(resumePlan(p, "2026-01-12")).toBe(p);
  });

  it("resume shifts the re-pace anchor too", () => {
    const anchored: ActivePlan = {
      ...ramadan(),
      anchor: { date: "2026-01-03", units: 2 },
      pausedOn: "2026-01-05",
    };
    const resumed = resumePlan(anchored, "2026-01-12");
    expect(resumed.anchor).toEqual({ date: "2026-01-10", units: 2 }); // +7 days
    expect(resumed.pausedOn).toBeUndefined();
  });
});

// ── Completion (#63) ─────────────────────────────────────────────────────────

describe("completion", () => {
  it("is complete only when every unit is read", () => {
    const p = ramadan(); // 30 juzʾ
    expect(isPlanComplete(p)).toBe(false);
    expect(isPlanComplete(setUnitsRead(p, 29))).toBe(false);
    expect(isPlanComplete(setUnitsRead(p, 30))).toBe(true);
    expect(percentComplete(setUnitsRead(p, 30))).toBe(100);
  });
});
