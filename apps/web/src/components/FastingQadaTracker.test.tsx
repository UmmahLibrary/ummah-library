import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hijriToGregorian } from "@ummahlibrary/core";
import { writeHijriAdjust } from "../lib/hijri";
import { FastingQadaTracker } from "./FastingQadaTracker";

// A Ramaḍān (Hijri month 9) day as YYYY-MM-DD, for building a ḥayḍ pause whose
// days fall inside Ramaḍān regardless of the real "today".
const ram = (day: number): string => {
  const d = hijriToGregorian({ year: 1447, month: 9, day });
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
};

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("FastingQadaTracker", () => {
  it("shows the empty state when no ḥayḍ pause fell in Ramaḍān", async () => {
    render(<FastingQadaTracker />);
    expect(await screen.findByText(/No fasts to make up/i)).toBeInTheDocument();
  });

  it("derives owed fasts from a Ramaḍān pause and makes them up", async () => {
    // A closed pause over Ramaḍān 5–7 → three fasts owed.
    localStorage.setItem("ul.haid", JSON.stringify([{ start: ram(5), end: ram(7) }]));
    render(<FastingQadaTracker />);

    const makeUp = await screen.findByRole("button", { name: "Mark one fast made up" });
    expect(screen.getByText(/0 of 3 made up/i)).toBeInTheDocument();

    await userEvent.click(makeUp);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("ul.fastingQada") ?? "{}").madeUp).toBe(1),
    );
    expect(screen.getByText(/1 of 3 made up/i)).toBeInTheDocument();

    // Undo brings it back down.
    await userEvent.click(screen.getByRole("button", { name: "Undo one made-up fast" }));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("ul.fastingQada") ?? "{}").madeUp).toBe(0),
    );
  });

  it("recomputes owed fasts when the Hijri sighting adjustment changes elsewhere on the page", async () => {
    // A pause on Ramaḍān's last day at adjust=0 shifts past month-end (out of
    // Ramaḍān) once the page-wide adjustment moves +2 — so owed should drop to 0.
    localStorage.setItem("ul.haid", JSON.stringify([{ start: ram(29), end: ram(29) }]));
    render(<FastingQadaTracker />);

    expect(await screen.findByText(/0 of 1 made up/i)).toBeInTheDocument();

    act(() => writeHijriAdjust(2));

    expect(await screen.findByText(/No fasts to make up/i)).toBeInTheDocument();
  });
});
