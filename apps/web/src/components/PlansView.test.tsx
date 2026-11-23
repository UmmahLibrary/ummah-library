import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlansView } from "./PlansView";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const planCard = (name: RegExp) => screen.findByRole("button", { name });

async function startJewelsAndFinishDayOne() {
  render(<PlansView />);
  await userEvent.click(await planCard(/Jewels of the Quran.*Start plan/));
  await userEvent.click(await screen.findByRole("button", { name: "Mark Day 1 done" }));
  await screen.findByRole("button", { name: "✓ Day done" });
}

describe("PlansView — active plan card", () => {
  it("after marking today done, labels the shown portion as next, not today's", async () => {
    render(<PlansView />);
    await userEvent.click(await planCard(/Jewels of the Quran.*Start plan/));

    expect(await screen.findByText(/^Today:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read today/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Mark Day 1 done" }));

    expect(await screen.findByRole("button", { name: "✓ Day done" })).toBeInTheDocument();
    expect(screen.getByText(/^Next:/)).toBeInTheDocument();
    expect(screen.queryByText(/^Today:/)).toBeNull();
    expect(screen.getByRole("link", { name: /Read ahead/ })).toBeInTheDocument();
  });
});

describe("PlansView — never drops progress without asking", () => {
  it("asks before switching to another plan, and keeps the current one on Cancel", async () => {
    await startJewelsAndFinishDayOne();
    const ask = vi.spyOn(window, "confirm").mockReturnValue(false);

    await userEvent.click(await planCard(/Quran in 60 Days.*Start plan/));

    expect(ask).toHaveBeenCalledWith(expect.stringMatching(/Jewels of the Quran.*20%.*lost/));
    expect(screen.getByRole("button", { name: "✓ Day done" })).toBeInTheDocument();
  });

  it("asks before leaving a plan with progress", async () => {
    await startJewelsAndFinishDayOne();
    const ask = vi.spyOn(window, "confirm").mockReturnValue(false);

    await userEvent.click(screen.getByRole("button", { name: "Leave plan" }));

    expect(ask).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "✓ Day done" })).toBeInTheDocument();
  });

  it("doesn't ask when there's no progress to lose", async () => {
    const ask = vi.spyOn(window, "confirm");
    render(<PlansView />);
    await userEvent.click(await planCard(/Jewels of the Quran.*Start plan/));
    await screen.findByRole("button", { name: "Mark Day 1 done" });

    await userEvent.click(await planCard(/Quran in 60 Days.*Start plan/));

    expect(ask).not.toHaveBeenCalled();
    expect(await screen.findByText(/Day 1 of 60/)).toBeInTheDocument();
  });
});
