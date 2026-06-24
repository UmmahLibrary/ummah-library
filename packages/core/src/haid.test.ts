import { describe, expect, it } from "vitest";
import {
  type HaidLog,
  currentPeriod,
  endPause,
  isDatePaused,
  longestPrayerStreakWithPause,
  periodLength,
  prayerStreakWithPause,
  startPause,
  streakWithPauses,
  togglePauseToday,
} from "./haid";
import type { PrayerDayLog, PrayerTrackerLog } from "./prayer-tracker";

const COMPLETE: PrayerDayLog = {
  fajr: "ontime",
  dhuhr: "ontime",
  asr: "ontime",
  maghrib: "ontime",
  isha: "ontime",
};

/** Build a tracker log where every listed date is a complete (all-five) day. */
function completeOn(...dates: string[]): PrayerTrackerLog {
  return Object.fromEntries(dates.map((d) => [d, COMPLETE]));
}

describe("isDatePaused", () => {
  it("matches a closed range inclusively and excludes outside days", () => {
    const log: HaidLog = [{ start: "2026-06-10", end: "2026-06-15" }];
    expect(isDatePaused(log, "2026-06-09")).toBe(false);
    expect(isDatePaused(log, "2026-06-10")).toBe(true);
    expect(isDatePaused(log, "2026-06-13")).toBe(true);
    expect(isDatePaused(log, "2026-06-15")).toBe(true);
    expect(isDatePaused(log, "2026-06-16")).toBe(false);
  });

  it("treats an open period as covering every day from its start onward", () => {
    const log: HaidLog = [{ start: "2026-06-10" }];
    expect(isDatePaused(log, "2026-06-09")).toBe(false);
    expect(isDatePaused(log, "2026-06-10")).toBe(true);
    expect(isDatePaused(log, "2030-01-01")).toBe(true);
  });

  it("is false for an empty log", () => {
    expect(isDatePaused([], "2026-06-10")).toBe(false);
  });
});

describe("currentPeriod", () => {
  it("finds the open period and is undefined when all are closed", () => {
    expect(currentPeriod([{ start: "2026-06-01", end: "2026-06-05" }])).toBeUndefined();
    expect(currentPeriod([{ start: "2026-06-10" }])?.start).toBe("2026-06-10");
  });
});

describe("periodLength", () => {
  it("counts inclusive days for a closed period", () => {
    expect(periodLength({ start: "2026-06-10", end: "2026-06-10" }, "2026-06-20")).toBe(1);
    expect(periodLength({ start: "2026-06-10", end: "2026-06-16" }, "2026-06-20")).toBe(7);
  });

  it("measures an open period up to the asOf date, never below 1", () => {
    expect(periodLength({ start: "2026-06-10" }, "2026-06-12")).toBe(3);
    expect(periodLength({ start: "2026-06-10" }, "2026-06-10")).toBe(1);
    expect(periodLength({ start: "2026-06-10" }, "2026-06-01")).toBe(1);
  });

  it("honours the 'never below 1' contract even for an unparseable date (corrupt/foreign state)", () => {
    // HaidPeriod.start is a plain string; corrupt or externally-synced state can
    // carry a non-date. Math.max(1, NaN) is NaN, so the floor must be explicit.
    expect(periodLength({ start: "not-a-date" }, "2026-06-10")).toBe(1);
    expect(periodLength({ start: "2026-06-10", end: "garbage" }, "2026-06-10")).toBe(1);
  });
});

describe("startPause", () => {
  it("opens a new period when none is active", () => {
    const log = startPause([], "2026-06-10");
    expect(log).toEqual([{ start: "2026-06-10" }]);
  });

  it("keeps the log sorted by start", () => {
    let log = startPause([], "2026-06-10");
    log = endPause(log, "2026-06-12");
    const earlier = startPause(log, "2026-05-01");
    expect(earlier.map((p) => p.start)).toEqual(["2026-05-01", "2026-06-10"]);
  });

  it("is a no-op while a pause is already ongoing", () => {
    const log: HaidLog = [{ start: "2026-06-10" }];
    expect(startPause(log, "2026-06-20")).toBe(log);
  });

  it("is a no-op when the date already sits in a closed period", () => {
    const log: HaidLog = [{ start: "2026-06-10", end: "2026-06-15" }];
    expect(startPause(log, "2026-06-12")).toBe(log);
  });
});

describe("endPause", () => {
  it("closes the ongoing period with the given end date", () => {
    const log = endPause([{ start: "2026-06-10" }], "2026-06-16");
    expect(log).toEqual([{ start: "2026-06-10", end: "2026-06-16" }]);
  });

  it("collapses to a single day when end precedes start", () => {
    const log = endPause([{ start: "2026-06-10" }], "2026-06-05");
    expect(log).toEqual([{ start: "2026-06-10", end: "2026-06-10" }]);
  });

  it("is a no-op when nothing is open", () => {
    const log: HaidLog = [{ start: "2026-06-10", end: "2026-06-15" }];
    expect(endPause(log, "2026-06-20")).toBe(log);
  });
});

describe("togglePauseToday", () => {
  it("starts a pause when none is open, then ends it on the next toggle", () => {
    const started = togglePauseToday([], "2026-06-10");
    expect(currentPeriod(started)?.start).toBe("2026-06-10");
    const ended = togglePauseToday(started, "2026-06-16");
    expect(currentPeriod(ended)).toBeUndefined();
    expect(ended[0]?.end).toBe("2026-06-16");
  });
});

describe("streakWithPauses", () => {
  const paused = (log: HaidLog) => (d: string) => isDatePaused(log, d);

  it("counts consecutive active days ending today", () => {
    const dates = ["2026-06-08", "2026-06-09", "2026-06-10"];
    expect(streakWithPauses(dates, () => false, "2026-06-10")).toBe(3);
  });

  it("uses yesterday as a grace day when today is blank", () => {
    const dates = ["2026-06-08", "2026-06-09"];
    expect(streakWithPauses(dates, () => false, "2026-06-10")).toBe(2);
  });

  it("breaks on a non-active, non-paused day", () => {
    const dates = ["2026-06-06", "2026-06-07", "2026-06-10"];
    // 09 is blank and not paused → streak is just today (10).
    expect(streakWithPauses(dates, () => false, "2026-06-10")).toBe(1);
  });

  it("bridges a pause: active days on both sides keep the streak", () => {
    // Active 06-07, paused 08-10, active 11; today 11.
    const dates = ["2026-06-06", "2026-06-07", "2026-06-11"];
    const log: HaidLog = [{ start: "2026-06-08", end: "2026-06-10" }];
    expect(streakWithPauses(dates, paused(log), "2026-06-11")).toBe(3);
  });

  it("survives an ongoing pause through today with no break", () => {
    const dates = ["2026-06-06", "2026-06-07"];
    const log: HaidLog = [{ start: "2026-06-08" }]; // open, covers today
    expect(streakWithPauses(dates, paused(log), "2026-06-10")).toBe(2);
  });

  it("returns 0 when the grace day is also blank", () => {
    expect(streakWithPauses(["2026-06-01"], () => false, "2026-06-10")).toBe(0);
  });
});

describe("prayerStreakWithPause", () => {
  it("preserves the prayer streak across a ḥayḍ pause", () => {
    const log = completeOn("2026-06-06", "2026-06-07", "2026-06-11");
    const haid: HaidLog = [{ start: "2026-06-08", end: "2026-06-10" }];
    expect(prayerStreakWithPause(log, haid, "2026-06-11")).toBe(3);
    // Without the pause the gap (08–10) would break it down to just today.
    expect(prayerStreakWithPause(log, [], "2026-06-11")).toBe(1);
  });
});

describe("longestPrayerStreakWithPause", () => {
  it("is 0 with no complete days", () => {
    expect(longestPrayerStreakWithPause({}, [])).toBe(0);
  });

  it("bridges fully-paused gaps but resets on an un-paused gap", () => {
    const log = completeOn(
      "2026-06-01",
      "2026-06-02",
      // gap 03 paused → bridged
      "2026-06-04",
      // gap 05 NOT paused → resets
      "2026-06-06",
    );
    const haid: HaidLog = [{ start: "2026-06-03", end: "2026-06-03" }];
    // Run 01,02,(03 paused),04 = 3 ; then 06 starts a new run of 1.
    expect(longestPrayerStreakWithPause(log, haid)).toBe(3);
  });

  it("matches plain consecutive counting when there are no pauses", () => {
    const log = completeOn("2026-06-01", "2026-06-02", "2026-06-03");
    expect(longestPrayerStreakWithPause(log, [])).toBe(3);
  });
});
