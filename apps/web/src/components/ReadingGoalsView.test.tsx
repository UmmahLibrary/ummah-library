import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { today } from "../lib/reading-goals";
import { ReadingGoalsView } from "./ReadingGoalsView";

describe("ReadingGoalsView", () => {
  it("reflects the stored goal and today's pages", () => {
    localStorage.setItem("ul.readingGoal", JSON.stringify({ target: 8 }));
    localStorage.setItem("ul.readingLog", JSON.stringify({ [today()]: 3 }));

    render(<ReadingGoalsView />);

    expect(screen.getByText("of 8 pages today")).toBeInTheDocument();
    expect(screen.getByText(/5 pages to reach today/)).toBeInTheDocument();
  });

  it("changes the daily goal when a pill is clicked, and persists it", async () => {
    render(<ReadingGoalsView />);

    await userEvent.click(screen.getByRole("button", { name: "16 pages" }));

    expect(screen.getByText("of 16 pages today")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("ul.readingGoal") ?? "{}").target).toBe(16);
  });
});
