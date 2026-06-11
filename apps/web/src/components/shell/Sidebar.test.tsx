import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders the nav groups and items", () => {
    render(<Sidebar />);

    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("Worship")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quran/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Prayer Times/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /99 Names/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
  });
});
