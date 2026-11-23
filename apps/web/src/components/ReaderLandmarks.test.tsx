import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KidsReader } from "./KidsReader";

/**
 * Full-screen readers render without the app shell, so they must provide the
 * page's `main` landmark (and the `#main` target of "Skip to content") themselves.
 */
describe("full-screen readers expose the main landmark and a page heading", () => {
  it("Kids reader", () => {
    render(
      <KidsReader
        surah={{
          number: 112,
          name: "الإخلاص",
          transliteration: "Al-Ikhlaas",
          englishName: "Sincerity",
        }}
        ayahs={[{ aya: 1, text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" }]}
        reciters={[]}
        bismillah={null}
      />,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toHaveTextContent("قُلْ هُوَ ٱللَّهُ أَحَدٌ");
    expect(screen.getByRole("heading", { level: 1, name: "Al-Ikhlaas" })).toBeInTheDocument();
  });
});
