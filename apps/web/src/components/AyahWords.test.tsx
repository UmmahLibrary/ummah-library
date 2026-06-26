import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AyahWords } from "./AyahWords";

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("AyahWords", () => {
  it("renders plain word spans with the toggle off (highlighting untouched)", async () => {
    const { container } = render(<AyahWords surah={1} aya={1} text="بِسْمِ ٱللَّهِ" />);
    await waitFor(() => expect(container.querySelectorAll(".w")).toHaveLength(2));
    expect(container.querySelector(".w-tr")).toBeNull();
    // data-w indices preserved for the audio highlighter.
    expect(container.querySelector('.w[data-w="0"]')).not.toBeNull();
  });

  it("stacks each word over its transliteration when enabled", async () => {
    localStorage.setItem("ul.wbwTranslit", "true");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verses: [
            {
              verse_key: "1:1",
              words: [
                { char_type_name: "word", transliteration: { text: "bis'mi" } },
                { char_type_name: "word", transliteration: { text: "l-lahi" } },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { container } = render(<AyahWords surah={1} aya={1} text="بِسْمِ ٱللَّهِ" />);
    await waitFor(() => expect(container.querySelectorAll(".w-tr")).toHaveLength(2));
    const trs = [...container.querySelectorAll(".w-tr")].map((el) => el.textContent);
    expect(trs).toEqual(["bis'mi", "l-lahi"]);
    // The .w spans (and their data-w) still exist inside the stacked units.
    expect(container.querySelector('.w-unit .w[data-w="1"]')).not.toBeNull();
  });

  it("renders the IndoPak verse text (no data-w hooks) when the IndoPak script is selected", async () => {
    localStorage.setItem("ul.script", "indopak");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ayahs: [{ sura: 1, aya: 1, text: "بِسۡمِ اللهِ" }] }), {
        status: 200,
      }),
    );

    const { container } = render(<AyahWords surah={1} aya={1} text="بِسْمِ ٱللَّهِ" />);
    await waitFor(() => expect(container.querySelector(".w")?.textContent).toBe("بِسۡمِ"));
    // v1 is reading-view only: the per-word audio/translit hooks are absent.
    expect(container.querySelector(".w[data-w]")).toBeNull();
    expect(container.querySelector(".w-tr")).toBeNull();
  });
});
