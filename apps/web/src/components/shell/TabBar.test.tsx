import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "../../i18n/I18nProvider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { TabBar } from "./TabBar";

describe("TabBar", () => {
  it("renders all five tabs", () => {
    render(<TabBar />, { wrapper: I18nProvider });
    for (const label of ["Home", "Read", "Tools", "Memorize", "More"]) {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });
});
