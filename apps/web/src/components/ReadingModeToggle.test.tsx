import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
});
