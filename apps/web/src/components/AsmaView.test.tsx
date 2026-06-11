import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DivineName } from "@ummahlibrary/core";
import { AsmaView } from "./AsmaView";

const NAMES: DivineName[] = [
  {
    number: 1,
    arabic: "الرحمن",
    transliteration: "Ar-Rahman",
    meaning: "The Most Compassionate",
    description: "",
    references: [],
  },
  {
    number: 2,
    arabic: "الرحيم",
    transliteration: "Ar-Rahim",
    meaning: "The Most Merciful",
    description: "",
    references: [],
  },
];

describe("AsmaView", () => {
  it("renders each name and toggles 'learned', persisting to localStorage", async () => {
    render(<AsmaView names={NAMES} />);

    expect(screen.getByText("Ar-Rahman")).toBeInTheDocument();
    expect(screen.getByText("The Most Merciful")).toBeInTheDocument();
    // Clean default — no progress line until something is marked.
    expect(screen.queryByText(/marked/)).not.toBeInTheDocument();

    const first = screen.getByRole("button", { name: /Ar-Rahman/ });
    expect(first).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(first);

    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 / 2 marked")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("ul.asmaLearned") ?? "{}")).toEqual({ "1": true });

    await userEvent.click(first); // toggle off
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/marked/)).not.toBeInTheDocument();
  });

  it("restores 'learned' state from localStorage on mount", () => {
    localStorage.setItem("ul.asmaLearned", JSON.stringify({ "2": true }));
    render(<AsmaView names={NAMES} />);

    expect(screen.getByText("1 / 2 marked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ar-Rahim/ })).toHaveAttribute("aria-pressed", "true");
  });
});
