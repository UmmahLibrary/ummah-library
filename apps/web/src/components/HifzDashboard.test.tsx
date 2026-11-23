import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HifzDashboard, type SurahMeta } from "./HifzDashboard";

const SURAHS: SurahMeta[] = [
  { number: 1, name: "الفاتحة", transliteration: "Al-Faatiha", ayahCount: 7 },
];

const pastDue = new Date(Date.now() - 86400000).toISOString();
const card = { repetitions: 0, easeFactor: 2.5, intervalDays: 0, due: pastDue, lastReviewed: null };

afterEach(() => localStorage.clear());

describe("HifzDashboard", () => {
  it("uses the correct plural 'āyāt', not 'āyahāt', when more than one āyah is due", async () => {
    localStorage.setItem("ul.hifz", JSON.stringify({ "1:1": card, "1:2": card }));

    render(<HifzDashboard surahs={SURAHS} />);

    expect(await screen.findByText("2 āyāt ready for review")).toBeInTheDocument();
    expect(screen.queryByText(/āyahāt/)).not.toBeInTheDocument();
  });

  it("uses the singular 'āyah' when exactly one āyah is due", async () => {
    localStorage.setItem("ul.hifz", JSON.stringify({ "1:1": card }));

    render(<HifzDashboard surahs={SURAHS} />);

    expect(await screen.findByText("1 āyah ready for review")).toBeInTheDocument();
  });
});

describe("HifzDashboard — gentle consistency (ADR 0041)", () => {
  it("shows review days this week, not a streak or fire emoji, by default", async () => {
    localStorage.setItem("ul.hifz", JSON.stringify({ "1:1": card }));
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("ul.hifz.reviewLog", JSON.stringify({ [today]: 3 }));

    render(<HifzDashboard surahs={SURAHS} />);

    expect(await screen.findByText("Days this week")).toBeInTheDocument();
    expect(screen.getByText("1 of 7")).toBeInTheDocument();
    expect(screen.queryByText(/🔥|streak/i)).toBeNull();
  });

  it("shows the day count when the reader opts in to streaks", async () => {
    localStorage.setItem("ul.hifz", JSON.stringify({ "1:1": card }));
    localStorage.setItem("ul.comfort", JSON.stringify({ showStreaks: true }));

    render(<HifzDashboard surahs={SURAHS} />);

    expect(await screen.findByText("Days in a row")).toBeInTheDocument();
    expect(screen.queryByText(/🔥/)).toBeNull();
  });
});
