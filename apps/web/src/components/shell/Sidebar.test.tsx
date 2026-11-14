import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "../../i18n/I18nProvider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("groups the app into the same five places as the phone tabs", () => {
    render(<Sidebar />, { wrapper: I18nProvider });

    for (const group of ["Today", "Quran", "Prayer", "Learn", "More"]) {
      expect(
        screen.getAllByRole("link", { name: new RegExp(`^${group}$`) }).length,
      ).toBeGreaterThan(0);
    }
    expect(screen.getByRole("link", { name: /Prayer Times/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /99 Names/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Settings/ }).length).toBeGreaterThan(0);
  });
});
