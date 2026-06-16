import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => localStorage.clear());

describe("TasbihPageClient", () => {
  it("counts up when the dial is tapped", async () => {
    render(<TasbihPageClient />);

    expect(await screen.findByRole("button", { name: /Count/ })).toHaveAccessibleName(/0 of 33/);
    await userEvent.click(dial());
    expect(dial()).toHaveAccessibleName(/1 of 33/);
  });

  it("switching the dhikr preset resets the count and its target", async () => {
    render(<TasbihPageClient />);

    await userEvent.click(await screen.findByRole("button", { name: /Count/ })); // count → 1
    await userEvent.click(screen.getByRole("button", { name: "Allāhu Akbar" }));

    expect(dial()).toHaveAccessibleName(/0 of 34/); // reset, target 34
  });

  it("the Reset button clears the running count and persists it", async () => {
    render(<TasbihPageClient />);

    const d = await screen.findByRole("button", { name: /Count/ });
    await userEvent.click(d);
    await userEvent.click(d);
    expect(dial()).toHaveAccessibleName(/2 of 33/);

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(dial()).toHaveAccessibleName(/0 of 33/);
    expect(JSON.parse(localStorage.getItem("ul.tasbih2") ?? "{}").total).toBe(0);
  });
});
