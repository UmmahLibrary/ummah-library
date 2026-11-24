import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HijriCalendar } from "./HijriCalendar";

afterEach(() => vi.useRealTimers());

describe("HijriCalendar grid", () => {
  it("names every day with its Gregorian date, not just a hover tooltip", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 24, 12)); // 24 Nov 2026 = 13 Jumādā al-Ākhirah 1448 (tabular)
    render(<HijriCalendar />);
    const today = await screen.findByRole("listitem", { current: "date" });
    expect(today).toHaveAccessibleName(/^13 Jumādā al-Ākhirah, .*(Nov 24|24 Nov).*2026, today$/);
    expect(today).toHaveTextContent("24"); // the visible Gregorian cross-reference
  });
});
