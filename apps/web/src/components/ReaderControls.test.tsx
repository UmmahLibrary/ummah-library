import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ReaderControls } from "./ReaderControls";

afterEach(() => localStorage.clear());

describe("ReaderControls", () => {
  it("applies every rapid A+ tap instead of racing on a stale scale", async () => {
    render(<ReaderControls surahNumber={1} />);

    const bigger = await screen.findByRole("button", { name: "Increase text size" });

    // Four taps landing in the same tick (a fast real tap, or several queued
    // clicks before React flushes) should each apply on top of the latest
    // scale, not all read the same pre-tap value.
    act(() => {
      bigger.click();
      bigger.click();
      bigger.click();
      bigger.click();
    });

    expect(document.documentElement.style.getPropertyValue("--reading-scale")).toBe("1.4");
  });

  it("applies every rapid A- tap the same way", async () => {
    render(<ReaderControls surahNumber={1} />);

    const bigger = await screen.findByRole("button", { name: "Increase text size" });
    act(() => bigger.click()); // 1 -> 1.1, so A- has room to move without hitting SCALE_MIN

    const smaller = screen.getByRole("button", { name: "Decrease text size" });
    act(() => {
      smaller.click();
      smaller.click();
      smaller.click();
    });

    expect(document.documentElement.style.getPropertyValue("--reading-scale")).toBe("0.8");
  });
});
