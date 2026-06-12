import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("flips between dark and light, restoring each mode's theme", async () => {
    localStorage.clear();
    document.documentElement.dataset.theme = "obsidian";
    render(<ThemeToggle />);

    // Dark by default → the control offers to switch to light (defaults to Ivory).
    await userEvent.click(screen.getByRole("button", { name: /Switch to light theme/ }));
    expect(document.documentElement.dataset.theme).toBe("ivory");
    expect(document.documentElement.dataset.mode).toBe("light");
    expect(localStorage.getItem("ul.theme")).toBe("ivory");

    // Back to dark → restores the default dark theme (Obsidian).
    await userEvent.click(screen.getByRole("button", { name: /Switch to dark theme/ }));
    expect(document.documentElement.dataset.theme).toBe("obsidian");
    expect(localStorage.getItem("ul.theme")).toBe("obsidian");
  });
});
