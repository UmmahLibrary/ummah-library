import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { writeHijriAdjust } from "../lib/hijri";
import { SunnahFastReminderToggle } from "./SunnahFastReminderToggle";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

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
