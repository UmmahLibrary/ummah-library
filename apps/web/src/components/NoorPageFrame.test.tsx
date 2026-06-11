import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// A stable router mock (hoisted so the factory can close over it).
const router = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { NoorPageFrame } from "./NoorPageFrame";

beforeEach(() => {
  router.push.mockClear();
  router.back.mockClear();
});

describe("NoorPageFrame", () => {
  it("renders the title, subtitle and children", () => {
    render(
      <NoorPageFrame title="Settings" sub="Tailor the app" glyph="⚙" back="/">
        <p>body content</p>
      </NoorPageFrame>,
    );

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Tailor the app")).toBeInTheDocument();
    expect(screen.getByText("body content")).toBeInTheDocument();
  });

  it("navigates to the back target when the back button is clicked", async () => {
    render(
      <NoorPageFrame title="Zakat" back="/home">
        x
      </NoorPageFrame>,
    );

    // The back button is the first (and only chrome) button in the frame.
    await userEvent.click(screen.getAllByRole("button")[0]!);
    expect(router.push).toHaveBeenCalledWith("/home");
  });

  it("falls back to router.back() when no back target is given", async () => {
    render(<NoorPageFrame title="Zakat">x</NoorPageFrame>);

    await userEvent.click(screen.getAllByRole("button")[0]!);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });
});
