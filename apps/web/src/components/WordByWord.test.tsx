import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WordByWord } from "./WordByWord";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.classList.remove("wbw-on");
});

describe("WordByWord", () => {
  it("announces the tapped word's meaning as a live status", async () => {
    document.body.classList.add("wbw-on");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            verse: {
              words: [
                {
                  char_type_name: "word",
                  text_uthmani: "قُلْ",
                  transliteration: { text: "qul" },
                  translation: { text: "Say" },
                },
              ],
            },
          }),
      }),
    );
    render(
      <>
        <div id="112:1" className="ayah">
          <p className="ayah-ar">
            <span className="w">قُلْ</span>
          </p>
        </div>
        <WordByWord />
      </>,
    );
    fireEvent.click(screen.getByText("قُلْ"));
    const pop = await screen.findByRole("status", { name: "Word meaning" });
    expect(pop).toHaveAttribute("aria-live", "polite");
    expect(pop).toHaveTextContent("Say");
  });
});
