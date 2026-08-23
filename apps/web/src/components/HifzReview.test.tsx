import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HifzReview } from "./HifzReview";

const pastDue = new Date(Date.now() - 86400000).toISOString();
const card = { repetitions: 0, easeFactor: 2.5, intervalDays: 0, due: pastDue, lastReviewed: null };

const SURAH_NAMES = { 1: { transliteration: "Al-Faatiha", name: "الفاتحة" } };

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("HifzReview", () => {
  it("uses the correct plural 'āyāt', not 'āyahāt', on the completion message after reviewing more than one āyah", async () => {
    localStorage.setItem("ul.hifz", JSON.stringify({ "1:1": card, "1:2": card }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ayahs: [
              { aya: 1, text: "بِسْمِ ٱللَّهِ" },
              { aya: 2, text: "ٱلْحَمْدُ لِلَّهِ" },
            ],
          }),
      }),
    );
    const user = userEvent.setup();

    render(<HifzReview surahNames={SURAH_NAMES} />);

    for (let i = 0; i < 2; i++) {
      await user.click(await screen.findByRole("button", { name: /Reveal āyah/ }));
      await user.click(await screen.findByRole("button", { name: "Good" }));
    }

    expect(await screen.findByText("2 āyāt reviewed · 2 tracked in total.")).toBeInTheDocument();
    expect(screen.queryByText(/āyahāt/)).not.toBeInTheDocument();
  });
});
