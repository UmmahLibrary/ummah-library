import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("toggles the document theme and persists the choice", async () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);

    // Dark by default → the control offers to switch to light.
    await userEvent.click(screen.getByRole("button", { name: /Switch to light theme/ }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("ul.theme")).toBe("light");
    expect(screen.getByRole("button", { name: /Switch to dark theme/ })).toBeInTheDocument();
  });
});
