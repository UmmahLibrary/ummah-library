import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { writeHijriAdjust } from "../lib/hijri";
import { SunnahFastReminderToggle } from "./SunnahFastReminderToggle";

beforeEach(() => {
  localStorage.clear();
  // Pin "today" so the six-fast window includes the white days (13–15 of the
  // Hijri month); a Hijri adjustment moves those, but never a Monday/Thursday.
  // From some real dates the window is all weekly fasts and nothing changes.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 0, 25, 12));
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
