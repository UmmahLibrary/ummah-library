import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

describe("HijriCalendar — observance reminders", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the bell's name fixed (aria-pressed carries on/off) and flags blocked notifications", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 1, 10, 12)); // Shaʿbān 1447 — Ramaḍān begins this month's view
    vi.stubGlobal(
      "Notification",
      Object.assign(function Notification() {}, {
        permission: "denied",
        requestPermission: async () => "denied",
      }),
    );
    render(<HijriCalendar />);
    const bells = await screen.findAllByRole("button", { name: /^Remind me about / });
    expect(bells[0]).toHaveAttribute("aria-pressed", "false");
    await act(async () => bells[0]!.click());
    expect(bells[0]).toHaveAttribute("aria-pressed", "true");
    expect(bells[0]!.getAttribute("aria-label")).toMatch(/^Remind me about /);
    expect(await screen.findByText(/Notifications are blocked/)).toBeInTheDocument();
  });
});
