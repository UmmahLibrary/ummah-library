import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurahIndex } from "./SurahIndex";

const surahs = [
  { number: 1, name: "الفاتحة", transliteration: "Al-Fātiḥah", englishName: "The Opening", ayahCount: 7 },
  { number: 2, name: "البقرة", transliteration: "Al-Baqarah", englishName: "The Cow", ayahCount: 286 },
  { number: 112, name: "الإخلاص", transliteration: "Al-Ikhlāṣ", englishName: "Sincerity", ayahCount: 4 },
];

describe("SurahIndex", () => {
  it("filters by English meaning, number prefix, or name", async () => {
    render(<SurahIndex surahs={surahs} />);
    const search = screen.getByRole("searchbox", { name: "Search surahs" });

    // By English meaning.
    await userEvent.type(search, "cow");
    expect(screen.getByRole("link", { name: /Al-Baqarah/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Al-Fātiḥah/ })).not.toBeInTheDocument();

    // By surah number.
    await userEvent.clear(search);
    await userEvent.type(search, "112");
    expect(screen.getByRole("link", { name: /Al-Ikhlāṣ/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Al-Baqarah/ })).not.toBeInTheDocument();

    // No match → empty state.
    await userEvent.clear(search);
    await userEvent.type(search, "zzz");
    expect(screen.getByText(/No surahs match/)).toBeInTheDocument();
  });
});
