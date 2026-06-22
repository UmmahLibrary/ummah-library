import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { addDays, type PrayerDayLog } from "@ummahlibrary/core";
import { PrayerTracker } from "./PrayerTracker";

const COMPLETE: PrayerDayLog = {
  fajr: "ontime",
  dhuhr: "ontime",
  asr: "ontime",
  maghrib: "ontime",
  isha: "ontime",
};

// Mirror lib/prayer-tracker's local-date helper so the seeded dates line up with
// the "today" the component reads from the real clock.
function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("PrayerTracker × ḥayḍ pause", () => {
  it("keeps the streak alive across a pause instead of breaking on the gap", async () => {
    const t = todayStr();
    // Complete today & yesterday, a 3-day pause, then two more complete days.
    localStorage.setItem(
      "ul.prayerLog",
      JSON.stringify({
        [t]: COMPLETE,
        [addDays(t, -1)]: COMPLETE,
        [addDays(t, -5)]: COMPLETE,
        [addDays(t, -6)]: COMPLETE,
      }),
    );
    localStorage.setItem(
      "ul.haid",
      JSON.stringify([{ start: addDays(t, -4), end: addDays(t, -2) }]),
    );

    render(<PrayerTracker />);

    // 4 complete days, bridged by the pause → streak 4 (would be 2 without it).
    expect(await screen.findByText("4 🔥")).toBeInTheDocument();
  });

  it("shows a Paused legend for the history grid", async () => {
    render(<PrayerTracker />);
    expect(await screen.findByText("Paused")).toBeInTheDocument();
  });
});
