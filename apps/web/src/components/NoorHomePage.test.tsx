import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

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
  screen.getAllByRole("link").filter((a) => /^\/juz\/\d+$/.test(a.getAttribute("href") ?? ""));

const positionOf = (re: RegExp) =>
  screen.getAllByRole("link").findIndex((a) => re.test(a.textContent ?? ""));

describe("NoorHomePage tabs", () => {
  it("Surah tab lists surahs in order and shows no juzʾ links", () => {
    render(<NoorHomePage surahs={surahs} variant="quran" />);

    expect(juzLinks()).toHaveLength(0);
    // by-number order: Al-Fātiḥah (1) precedes Al-ʿAlaq (96)
    expect(positionOf(/Al-Fātiḥah/)).toBeLessThan(positionOf(/Al-ʿAlaq/));
  });

  it("Juzʾ tab reveals all 30 ajzāʾ, each linking to its reader", async () => {
    render(<NoorHomePage surahs={surahs} variant="quran" />);

    await userEvent.click(screen.getByRole("button", { name: "Juzʾ" }));

    const hrefs = juzLinks().map((a) => a.getAttribute("href"));
    expect(hrefs).toHaveLength(30);
    expect(hrefs).toContain("/juz/1");
    expect(hrefs).toContain("/juz/30");
  });

  it("Revelation tab groups surahs into Meccan and Medinan", async () => {
    render(<NoorHomePage surahs={surahs} variant="quran" />);

    await userEvent.click(screen.getByRole("button", { name: "Revelation" }));

    // Both place-of-revelation sections are present.
    expect(screen.getByText("Meccan")).toBeInTheDocument();
    expect(screen.getByText("Medinan")).toBeInTheDocument();
    // Within the Meccan group, surahs keep surah-number order (Al-Fātiḥah 1 before Al-ʿAlaq 96)
    // — the opposite of the old chronological ordering, which proves the regrouping.
    expect(positionOf(/Al-Fātiḥah/)).toBeLessThan(positionOf(/Al-ʿAlaq/));
  });
});

describe("NoorHomePage Today card", () => {
  afterEach(() => localStorage.clear());

  it("resumes at the stored āyah via a #sura:aya deep link (not the surah start)", async () => {
    localStorage.setItem("ul.lastRead", JSON.stringify({ surah: 2, aya: 153, total: 286 }));
    render(<NoorHomePage surahs={surahs} />);

    const resume = await screen.findByRole("link", { name: /^Continue$/ });
    expect(resume.getAttribute("href")).toBe("/surah/2#2:153");
    // Listening is an equal second path, from the same āyah.
    const listen = screen.getByRole("link", { name: /Listen instead/ });
    expect(listen.getAttribute("href")).toBe("/listen/2#153");
  });

  it("offers a gentle start when nothing has been read yet", async () => {
    render(<NoorHomePage surahs={surahs} />);

    const start = await screen.findByRole("link", { name: /Read Al-Fātiḥah/ });
    expect(start.getAttribute("href")).toBe("/surah/1");
  });

  it("never shows a fire-emoji streak", async () => {
    render(<NoorHomePage surahs={surahs} />);
    await screen.findByRole("link", { name: /Read Al-Fātiḥah/ });
    expect(document.body.textContent).not.toContain("🔥");
  });

  it("keeps the full surah index off the Today screen", () => {
    render(<NoorHomePage surahs={surahs} />);
    expect(screen.queryByText("Juzʾ")).toBeNull();
  });
});

describe("NoorHomePage in Easy mode", () => {
  afterEach(() => localStorage.clear());

  it("the Quran index is one big list — no feature chips or index tabs", async () => {
    localStorage.setItem("ul.comfort", JSON.stringify({ mode: "easy" }));
    const { container } = render(<NoorHomePage surahs={surahs} variant="quran" />);

    // The list switches to a single column once the mode is read.
    await vi.waitFor(() => expect(container.querySelector('[data-easy="true"]')).not.toBeNull());
    expect(screen.queryByRole("navigation", { name: "Quran" })).toBeNull();
    expect(screen.queryByText("Juzʾ")).toBeNull();
    expect(screen.getByText("Al-Fātiḥah")).toBeInTheDocument();
  });

  it("standard mode keeps the chips and tabs", () => {
    render(<NoorHomePage surahs={surahs} variant="quran" />);
    expect(screen.getByRole("navigation", { name: "Quran" })).toBeInTheDocument();
    expect(screen.getByText("Juzʾ")).toBeInTheDocument();
  });
});
