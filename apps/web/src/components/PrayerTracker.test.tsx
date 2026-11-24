import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

    // Streak counts are opt-in (ADR 0041).
    localStorage.setItem("ul.comfort", JSON.stringify({ showStreaks: true }));

    render(<PrayerTracker />);

    // 4 complete days, bridged by the pause → streak 4 (would be 2 without it).
    const label = await screen.findByText("Days in a row");
    expect(label.previousElementSibling).toHaveTextContent(/^4$/);
  });

  it("shows no streak counts or fire emoji unless the reader opts in", async () => {
    const t = todayStr();
    localStorage.setItem("ul.prayerLog", JSON.stringify({ [t]: COMPLETE }));

    render(<PrayerTracker />);

    expect(await screen.findByText("Prayed today")).toBeInTheDocument();
    expect(screen.queryByText("Days in a row")).toBeNull();
    expect(screen.queryByText("Best streak")).toBeNull();
    expect(screen.queryByText(/🔥/)).toBeNull();
  });

  it("shows a Paused legend for the history grid", async () => {
    render(<PrayerTracker />);
    expect(await screen.findByText("Paused")).toBeInTheDocument();
  });
});

describe("PrayerTracker × history grid", () => {
  it("lets you tap a past day in the grid to log a prayer, not just today", async () => {
    render(<PrayerTracker />);

    // The grid runs oldest → newest over 7 days; index 5 is yesterday.
    const fajrCells = await screen.findAllByRole("button", { name: /^Fajr ·/ });
    expect(fajrCells).toHaveLength(7);
    const yesterdayCell = fajrCells[5]!;
    expect(yesterdayCell.getAttribute("aria-label")).toMatch(/Not yet — tap to change$/);

    // Named with the full date, not the grid's ambiguous initial ("T", "S").
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yName = y.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    expect(yesterdayCell.getAttribute("aria-label")).toContain(`Fajr · ${yName}:`);

    fireEvent.click(yesterdayCell);

    expect(await screen.findByLabelText(/^Fajr ·.*On time — tap to change$/)).toBeInTheDocument();
  });
});
