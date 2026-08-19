import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { today } from "../lib/reading-goals";
import { ReadingGoalsView } from "./ReadingGoalsView";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("ReadingGoalsView", () => {
  it("reflects the stored goal and today's pages", async () => {
    localStorage.setItem("ul.readingGoal", JSON.stringify({ target: 8 }));
    localStorage.setItem("ul.readingLog", JSON.stringify({ [today()]: 3 }));

    render(<ReadingGoalsView />);

    expect(await screen.findByText("of 8 pages today")).toBeInTheDocument();
    expect(await screen.findByText(/5 pages to reach today/)).toBeInTheDocument();
  });

  it("changes the daily goal when a pill is clicked, and persists it", async () => {
    render(<ReadingGoalsView />);
    await userEvent.click(await screen.findByRole("button", { name: "16 pages" }));

    expect(await screen.findByText("of 16 pages today")).toBeInTheDocument();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("ul.readingGoal") ?? "{}").target).toBe(16),
    );
  });

  it("shows a completion message instead of 'Resume' once the khatm is finished", async () => {
    localStorage.setItem(
      "ul.khatma",
      JSON.stringify({ totalPages: 604, currentPage: 604, targetDate: "2026-09-18" }),
    );

    render(<ReadingGoalsView />);

    expect(await screen.findByText(/khatm complete/i)).toBeInTheDocument();
    expect(screen.queryByText(/Resume p/)).not.toBeInTheDocument();
    expect(screen.queryByText(/d left/)).not.toBeInTheDocument();
  });
});
