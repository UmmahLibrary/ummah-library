import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PRAYER_TRACKER_EVENT,
  cyclePrayer,
  readPrayerLog,
  today,
} from "./prayer-tracker";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("prayer-tracker store", () => {
  it("formats today's date as a zero-padded YYYY-MM-DD key", () => {
    expect(today(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(today(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("starts with an empty log", () => {
    expect(readPrayerLog()).toEqual({});
  });

  it("cycles a prayer through none → ontime → late → none and persists", () => {
    const date = "2026-06-14";

    expect(cyclePrayer(date, "fajr")[date]?.fajr).toBe("ontime");
    expect(cyclePrayer(date, "fajr")[date]?.fajr).toBe("late");
    // Cycling back to "none" clears the entry (the absence is the "none" state).
    expect(cyclePrayer(date, "fajr")[date]?.fajr ?? "none").toBe("none");

    // The change survives a fresh read (kept in localStorage).
    cyclePrayer(date, "dhuhr");
    expect(readPrayerLog()[date]?.dhuhr).toBe("ontime");
  });

  it("emits a change event so subscribers can re-render", () => {
    const handler = vi.fn();
    window.addEventListener(PRAYER_TRACKER_EVENT, handler);
    cyclePrayer("2026-06-14", "asr");
    window.removeEventListener(PRAYER_TRACKER_EVENT, handler);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("falls back to an empty log when stored JSON is corrupt", () => {
    localStorage.setItem("ul.prayerLog", "{not json");
    expect(readPrayerLog()).toEqual({});
  });
});
