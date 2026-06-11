import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Dhikr } from "@ummahlibrary/core";
import { readAdhkarCounts } from "../lib/adhkar";
import { AdhkarView } from "./AdhkarView";

const dhikr: Dhikr[] = [
  {
    id: "ayat-al-kursi",
    order: 1,
    occasions: ["morning", "evening"],
    arabic: "ٱللَّٰهُ لَآ إِلَٰهَ إِلَّا هُوَ",
    translation: "Allah — there is no deity except Him.",
    transliteration: "Ayat al-Kursi",
    repeat: 1,
    repeatLabel: "Once",
    source: "Al-Baqarah 2:255",
  },
  {
    id: "tasbih",
    order: 2,
    occasions: ["morning"],
    arabic: "سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ",
    translation: "Glory and praise be to Allah.",
    transliteration: "Subhan Allah wa bihamdihi",
    repeat: 3,
    repeatLabel: "3×",
  },
  {
    id: "evening-only",
    order: 3,
    occasions: ["evening"],
    arabic: "أَمْسَيْنَا وَأَمْسَى ٱلْمُلْكُ لِلَّٰهِ",
    translation: "We have reached the evening and so has the dominion of Allah.",
    transliteration: "Amsayna wa amsa l-mulku lillah",
    repeat: 1,
    repeatLabel: "Once",
  },
];

describe("AdhkarView", () => {
  it("counts a dhikr to completion and persists the progress", async () => {
    render(<AdhkarView dhikr={dhikr} />);

    // Morning is the default set: two items, none done.
    expect(screen.getByText("0 / 2 done")).toBeInTheDocument();

    // Tapping the once-repeat dhikr completes it and bumps progress.
    await userEvent.click(screen.getByRole("button", { name: /Ayat al-Kursi/ }));
    expect(screen.getByText("1 / 2 done")).toBeInTheDocument();
    expect(readAdhkarCounts()["ayat-al-kursi"]).toBe(1);
  });

  it("switches between the morning and evening sets", async () => {
    render(<AdhkarView dhikr={dhikr} />);

    // Morning contains the tasbīḥ; evening does not.
    expect(screen.getByRole("button", { name: /Subhan Allah/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /Evening/ }));

    expect(screen.queryByRole("button", { name: /Subhan Allah/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Amsayna/ })).toBeInTheDocument();
  });
});
