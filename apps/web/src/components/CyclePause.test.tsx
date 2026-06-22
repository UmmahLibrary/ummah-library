import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CyclePause } from "./CyclePause";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("CyclePause", () => {
  it("starts a pause, persisting an open period to ul.haid", async () => {
    render(<CyclePause />);

    await userEvent.click(await screen.findByRole("button", { name: "Start cycle pause" }));

    await waitFor(() => {
      const log = JSON.parse(localStorage.getItem("ul.haid") ?? "[]");
      expect(log).toHaveLength(1);
      expect(log[0].end).toBeUndefined();
    });
    // Button flips to the end action.
    expect(screen.getByRole("button", { name: "End cycle pause" })).toBeInTheDocument();
  });

  it("reflects an existing ongoing pause", async () => {
    localStorage.setItem("ul.haid", JSON.stringify([{ start: "2026-06-10" }]));
    render(<CyclePause />);
    expect(await screen.findByRole("button", { name: "End cycle pause" })).toBeInTheDocument();
    expect(screen.getByText(/Paused — day/)).toBeInTheDocument();
  });
});
