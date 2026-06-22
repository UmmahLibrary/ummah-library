import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QadaTracker } from "./QadaTracker";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("QadaTracker", () => {
  it("records a missed prayer then makes it up, persisting to ul.qada", async () => {
    render(<QadaTracker />);

    await userEvent.click(await screen.findByRole("button", { name: "Record a missed Fajr" }));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("ul.qada") ?? "{}").fajr).toBe(1),
    );

    await userEvent.click(screen.getByRole("button", { name: "Make up one Fajr" }));
    await waitFor(() => expect(localStorage.getItem("ul.qada")).toBe("{}"));
  });

  it("reflects an existing backlog and its total", async () => {
    localStorage.setItem("ul.qada", JSON.stringify({ fajr: 2, isha: 1 }));
    render(<QadaTracker />);
    // Total owed (2 + 1) is shown once.
    expect(await screen.findByText("3")).toBeInTheDocument();
  });
});
