import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchView } from "./SearchView";

const MATCHES = 75;

function mockCorpus() {
  const quran = Array.from({ length: MATCHES }, (_, i) => ({
    chapter: 2,
    verse: i + 1,
    text: `A verse about mercy number ${i + 1}`,
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = url.includes("/search/corpus")
        ? { verses: [] }
        : url.includes("/names")
          ? { names: [] }
          : url.includes("/adhkar")
            ? { dhikr: [] }
            : { quran };
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("SearchView", () => {
  it("reports every match, not just the first page, and pages the rest in", async () => {
    mockCorpus();
    window.history.replaceState(null, "", "/search?q=mercy");
    render(
      <SearchView
        surahs={[
          {
            number: 2,
            name: "البقرة",
            transliteration: "Al-Baqara",
            englishName: "The Cow",
            ayahCount: 286,
          },
        ]}
      />,
    );

    expect(
      await screen.findByText((_, el) => el?.textContent === `${MATCHES} results for “mercy”`),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /mercy number/ })).toHaveLength(60);

    await userEvent.click(screen.getByRole("button", { name: /Show more \(15 more\)/ }));
    expect(screen.getAllByRole("link", { name: /mercy number/ })).toHaveLength(MATCHES);
    expect(screen.queryByRole("button", { name: /Show more/ })).toBeNull();
  });
});
