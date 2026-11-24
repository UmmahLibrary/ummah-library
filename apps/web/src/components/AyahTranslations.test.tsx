import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const surahs: Record<string, Map<number, string>> = {
  "urd-tahirulqadri": new Map([
    [1, ""], // the source is blank here (all of Al-Aʿrāf in the real data)
    [2, "ترجمہ"],
  ]),
  "eng-khattab": new Map(), // failed to load
};
vi.mock("../lib/catalogue", () => ({
  fetchCatalogue: async () => [
    { id: "urd-tahirulqadri", name: "Irfan-ul-Quran", language: "Urdu", direction: "rtl" },
  ],
  fetchEditionSurah: async (id: string) => surahs[id] ?? new Map(),
}));

const { AyahTranslations } = await import("./AyahTranslations");

afterEach(() => localStorage.clear());

describe("AyahTranslations", () => {
  it("says when the chosen translation has no text for an āyah, instead of showing nothing", async () => {
    localStorage.setItem("ul.editions", JSON.stringify(["urd-tahirulqadri"]));
    render(<AyahTranslations surah={7} aya={1} />);
    expect(
      await screen.findByText("Irfan-ul-Quran has no translation for this āyah."),
    ).toBeInTheDocument();
  });

  it("still skips an edition that failed to load", async () => {
    localStorage.setItem("ul.editions", JSON.stringify(["eng-khattab"]));
    const { container } = render(<AyahTranslations surah={7} aya={1} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.textContent).not.toMatch(/no translation/);
  });
});
