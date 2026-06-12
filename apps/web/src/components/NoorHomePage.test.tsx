import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoorHomePage } from "./NoorHomePage";

type Surah = Parameters<typeof NoorHomePage>[0]["surahs"][number];

// Listed in surah-number order (1, 2, 96), but a different order of revelation —
// Al-ʿAlaq (96) was revealed first. This lets us prove the Revelation tab
// actually re-sorts rather than just re-styling the active chip.
const surahs: Surah[] = [
  {
    number: 1,
    name: "الفاتحة",
    transliteration: "Al-Fātiḥah",
    englishName: "The Opening",
    ayahCount: 7,
    revelationPlace: "meccan",
    revelationOrder: 5,
  },
  {
    number: 2,
    name: "البقرة",
    transliteration: "Al-Baqarah",
    englishName: "The Cow",
    ayahCount: 286,
    revelationPlace: "medinan",
    revelationOrder: 87,
  },
  {
    number: 96,
    name: "العلق",
    transliteration: "Al-ʿAlaq",
    englishName: "The Clot",
    ayahCount: 19,
    revelationPlace: "meccan",
    revelationOrder: 1,
  },
];

const juzLinks = () =>
  screen
    .getAllByRole("link")
    .filter((a) => /^\/juz\/\d+$/.test(a.getAttribute("href") ?? ""));

const positionOf = (re: RegExp) =>
  screen.getAllByRole("link").findIndex((a) => re.test(a.textContent ?? ""));

describe("NoorHomePage tabs", () => {
  it("Surah tab lists surahs in order and shows no juzʾ links", () => {
    render(<NoorHomePage surahs={surahs} />);

    expect(juzLinks()).toHaveLength(0);
    // by-number order: Al-Fātiḥah (1) precedes Al-ʿAlaq (96)
    expect(positionOf(/Al-Fātiḥah/)).toBeLessThan(positionOf(/Al-ʿAlaq/));
  });

  it("Juzʾ tab reveals all 30 ajzāʾ, each linking to its reader", async () => {
    render(<NoorHomePage surahs={surahs} />);

    await userEvent.click(screen.getByRole("button", { name: "Juzʾ" }));

    const hrefs = juzLinks().map((a) => a.getAttribute("href"));
    expect(hrefs).toHaveLength(30);
    expect(hrefs).toContain("/juz/1");
    expect(hrefs).toContain("/juz/30");
  });

  it("Revelation tab re-orders surahs by order of revelation", async () => {
    render(<NoorHomePage surahs={surahs} />);

    await userEvent.click(screen.getByRole("button", { name: "Revelation" }));

    // Al-ʿAlaq (revealed #1) now precedes Al-Fātiḥah (revealed #5).
    expect(positionOf(/Al-ʿAlaq/)).toBeLessThan(positionOf(/Al-Fātiḥah/));
    expect(screen.getByText(/Revealed #1\b/)).toBeInTheDocument();
  });
});
