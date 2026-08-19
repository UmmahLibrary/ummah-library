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

  it("switching the dhikr preset shows that phrase's own count, at its own target", async () => {
    render(<TasbihPageClient />);

    await userEvent.click(await screen.findByRole("button", { name: /Count/ })); // count → 1
    await userEvent.click(screen.getByRole("button", { name: "Allāhu Akbar" }));

    // A never-counted phrase starts at zero, at its own default target (34).
    expect(dial()).toHaveAccessibleName(/0 of 34/);
  });

  it("switching phrases and back does not lose the earlier phrase's progress", async () => {
    render(<TasbihPageClient />);

    const d = await screen.findByRole("button", { name: /Count/ });
    await userEvent.click(d);
    await userEvent.click(d);
    expect(dial()).toHaveAccessibleName(/2 of 33/); // SubḥānAllāh at 2

    await userEvent.click(screen.getByRole("button", { name: "Alḥamdulillāh" }));
    expect(dial()).toHaveAccessibleName(/0 of 33/); // a different, uncounted phrase

    await userEvent.click(screen.getByRole("button", { name: "SubḥānAllāh" }));
    expect(dial()).toHaveAccessibleName(/2 of 33/); // SubḥānAllāh's count is still there
  });

  it("the Reset button clears only the current phrase's count, and persists it", async () => {
    render(<TasbihPageClient />);

    const d = await screen.findByRole("button", { name: /Count/ });
    await userEvent.click(d);
    await userEvent.click(d);
    expect(dial()).toHaveAccessibleName(/2 of 33/);

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(dial()).toHaveAccessibleName(/0 of 33/);
    const stored = JSON.parse(localStorage.getItem("ul.tasbih2") ?? "{}");
    expect(stored.phrases.subhanallah.total).toBe(0);
  });
});
