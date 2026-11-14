import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "../../i18n/I18nProvider";

let path = "/";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("shows only the five places on Today, with every section closed", () => {
    path = "/";
    render(<Sidebar />, { wrapper: I18nProvider });
    for (const place of ["Today", "Quran", "Prayer", "Learn", "More"]) {
      expect(screen.getAllByRole("link", { name: new RegExp(`^${place}$`) }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole("link", { name: /99 Names/ })).toBeNull();
  });

  it("opens the section you're in", () => {
    path = "/qibla";
    render(<Sidebar />, { wrapper: I18nProvider });
    expect(screen.getByRole("link", { name: /^Qibla$/ })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: /99 Names/ })).toBeNull();
  });

  it("lets you open another section to look around", () => {
    path = "/";
    render(<Sidebar />, { wrapper: I18nProvider });
    fireEvent.click(screen.getByRole("button", { name: /^Learn: show/ }));
    expect(screen.getByRole("link", { name: /99 Names/ })).toBeInTheDocument();
  });
});
