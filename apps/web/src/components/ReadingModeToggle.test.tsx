import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { READING_MODE_EVENT } from "../lib/reader-prefs";
import { ReadingModeToggle } from "./ReadingModeToggle";

describe("ReadingModeToggle", () => {
  it("switches reading mode, reflecting it on <html> and in storage", async () => {
    document.documentElement.dataset.readingMode = "translation";
    render(<ReadingModeToggle />);

    // Defaults to verse-by-verse.
    expect(screen.getByRole("button", { name: "Verse by verse" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Switch to continuous reading (Arabic only).
    await userEvent.click(screen.getByRole("button", { name: "Reading" }));
    expect(document.documentElement.dataset.readingMode).toBe("reading");
    expect(localStorage.getItem("ul.readingMode")).toBe("reading");

    // The sub-control now offers Arabic + translations.
    await userEvent.click(screen.getByRole("button", { name: "Translations" }));
    expect(document.documentElement.dataset.readingMode).toBe("reading-tr");
    expect(localStorage.getItem("ul.readingMode")).toBe("reading-tr");
  });

  it("picks up a synced mode change live, updating the DOM and the highlighted button", () => {
    document.documentElement.dataset.readingMode = "translation";
    render(<ReadingModeToggle />);

    act(() => {
      window.dispatchEvent(new CustomEvent(READING_MODE_EVENT, { detail: "reading" }));
    });

    expect(document.documentElement.dataset.readingMode).toBe("reading");
    expect(screen.getByRole("button", { name: "Reading" })).toHaveAttribute("aria-pressed", "true");
  });
});
