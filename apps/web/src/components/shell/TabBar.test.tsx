import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { TabBar } from "./TabBar";

describe("TabBar", () => {
  it("renders all five tabs", () => {
    render(<TabBar />);
    for (const label of ["Home", "Read", "Tools", "Memorize", "More"]) {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });
});
