import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { isTracked } from "../lib/hifz-store";
import { HifzButton } from "./HifzButton";

describe("HifzButton", () => {
  it("toggles memorization tracking for an āyah, persisting both ways", async () => {
    render(<HifzButton surah={2} aya={255} />);
    const btn = screen.getByRole("button");

    // Starts untracked.
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(isTracked({ sura: 2, aya: 255 })).toBe(false);

    // First tap tracks it.
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(isTracked({ sura: 2, aya: 255 })).toBe(true);

    // Second tap removes it.
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(isTracked({ sura: 2, aya: 255 })).toBe(false);
  });
});
