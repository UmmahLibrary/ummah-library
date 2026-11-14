import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "../../i18n/I18nProvider";

vi.mock("next/navigation", () => ({ usePathname: () => "/prayer-times" }));

import { TabBar } from "./TabBar";

describe("TabBar", () => {
  it("renders the five places, each with a word", () => {
    render(<TabBar />, { wrapper: I18nProvider });
    for (const label of ["Today", "Quran", "Prayer", "Learn", "More"]) {
      expect(screen.getByRole("link", { name: new RegExp(`^${label}$`) })).toBeInTheDocument();
    }
  });

  it("lights up the destination that owns the current page", () => {
    render(<TabBar />, { wrapper: I18nProvider });
    expect(screen.getByRole("link", { name: /^Prayer$/ })).toHaveAttribute("aria-current", "page");
  });
});
