import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { writeHijriAdjust } from "../lib/hijri";
import { SunnahFastReminderToggle } from "./SunnahFastReminderToggle";

/**
 * The clock is pinned because this assertion is only meaningful on some dates.
 * The sighting adjustment shifts the *Hijri* calendar, so it moves the white
 * days (13–15 of the month) but never the Mondays and Thursdays, which are
 * Gregorian. On a date whose next six fasts happen to be all Mon/Thu — e.g.
 * 2026-09-03, where the window is Thu 3, Mon 7, Thu 10, Mon 14, Thu 17, Mon 21 —
 * the adjustment changes nothing on screen and the test fails though the
 * component is correct. Pinning to 2026-01-01 puts three white days in the
 * window, so an adjustment provably has something to move.
 *
 * Only `Date` is faked: testing-library's `findBy*` polls on real timers.
 */
const PINNED = new Date(2026, 0, 1, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], shouldAdvanceTime: true });
  vi.setSystemTime(PINNED);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("SunnahFastReminderToggle", () => {
  it("recomputes the upcoming-fasts list when the Hijri sighting adjustment changes elsewhere on the page", async () => {
    render(<SunnahFastReminderToggle />);
    await screen.findByText("Upcoming fasts");

    const before = screen.getByText("Upcoming fasts").parentElement?.textContent;

    // Mirrors what HijriCalendar's adjustment buttons do — a page-wide broadcast,
    // not a prop change into this component.
    act(() => writeHijriAdjust(2));

    const after = screen.getByText("Upcoming fasts").parentElement?.textContent;
    expect(after).not.toBe(before);
  });
});
