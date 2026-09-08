import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "../i18n/I18nProvider";
import userEvent from "@testing-library/user-event";
import { ThemePicker } from "./ThemePicker";

describe("ThemePicker", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "obsidian";
  });

  it("lists all eight themes and marks the active one", () => {
    render(<ThemePicker />, { wrapper: I18nProvider });
    for (const name of [
      "Obsidian",
      "Midnight",
      "Emerald",
      "Ocean",
      "Ivory",
      "Sepia",
      "Mint",
      "Rose",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Obsidian/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("applies and persists a chosen theme", async () => {
    render(<ThemePicker />, { wrapper: I18nProvider });
    await userEvent.click(screen.getByRole("button", { name: /Ocean/ }));

    expect(document.documentElement.dataset.theme).toBe("ocean");
    expect(document.documentElement.dataset.mode).toBe("dark");
    expect(localStorage.getItem("ul.theme")).toBe("ocean");
    expect(screen.getByRole("button", { name: /Ocean/ })).toHaveAttribute("aria-pressed", "true");
  });
});
