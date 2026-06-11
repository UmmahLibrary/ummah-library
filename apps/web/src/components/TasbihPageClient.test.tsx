import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// TasbihPageClient renders NoorPageFrame, which calls useRouter.
const router = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { TasbihPageClient } from "./TasbihPageClient";

const dial = () => screen.getByRole("button", { name: /Count/ });

describe("TasbihPageClient", () => {
  it("counts up when the dial is tapped", async () => {
    render(<TasbihPageClient />);

    expect(dial()).toHaveAccessibleName(/0 of 33/);
    await userEvent.click(dial());
    expect(dial()).toHaveAccessibleName(/1 of 33/);
  });

  it("switching the dhikr preset resets the count and its target", async () => {
    render(<TasbihPageClient />);

    await userEvent.click(dial()); // count → 1
    await userEvent.click(screen.getByRole("button", { name: "Allāhu Akbar" }));

    expect(dial()).toHaveAccessibleName(/0 of 34/); // reset, target 34
  });
});
