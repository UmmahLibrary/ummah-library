import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileView } from "./ProfileView";

afterEach(() => localStorage.clear());

describe("ProfileView — gentle consistency (ADR 0041)", () => {
  it("shows no streak counters, streak badges or fire emoji by default", async () => {
    render(<ProfileView />);

    expect(await screen.findByText("Āyāt memorized")).toBeInTheDocument();
    expect(screen.queryByText("Hifz streak")).toBeNull();
    expect(screen.queryByText("Prayer streak")).toBeNull();
    expect(screen.queryByText("7-day streak")).toBeNull();
    expect(screen.queryByText("Steadfast")).toBeNull();
    expect(screen.queryByText(/🔥/)).toBeNull();
  });

  it("shows them once the reader opts in to streaks", async () => {
    localStorage.setItem("ul.comfort", JSON.stringify({ showStreaks: true }));

    render(<ProfileView />);

    expect(await screen.findByText("Hifz streak")).toBeInTheDocument();
    expect(screen.getByText("Prayer streak")).toBeInTheDocument();
    expect(screen.getByText("7-day streak")).toBeInTheDocument();
  });
});

describe("ProfileView — locked achievements stay readable", () => {
  it("dims only the glyph, not the card holding the 'Locked' caption", async () => {
    render(<ProfileView />);
    const caption = (await screen.findAllByText("Locked"))[0]!;
    const card = caption.parentElement as HTMLElement;
    expect(card.style.opacity).toBe("");
    const glyph = card.firstElementChild as HTMLElement;
    expect(glyph.style.opacity).toBe("0.55");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ProfileView — counts", () => {
  it("says 'Āyah memorized' and 'Surah started' for exactly one", async () => {
    const card = {
      repetitions: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      due: new Date().toISOString(),
      lastReviewed: null,
    };
    localStorage.setItem("ul.hifz", JSON.stringify({ "1:1": card }));
    render(<ProfileView />);
    expect(await screen.findByText("Āyah memorized")).toBeInTheDocument();
    expect(screen.getByText("Surah started")).toBeInTheDocument();
  });
});
