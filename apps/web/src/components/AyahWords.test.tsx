import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { AyahWords } from "./AyahWords";

/** A fetch mock that answers the IndoPak and transliteration quran.com calls by
 *  their `word_fields` (both hit verses/by_chapter; IndoPak is display-only now). */
function mockFetch(opts: { indopak?: unknown; translit?: unknown }) {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = String(input);
    const body = url.includes("text_indopak") ? opts.indopak : opts.translit;
    return Promise.resolve(new Response(JSON.stringify(body ?? {}), { status: 200 }));
  });
}

/** quran.com `verses/by_chapter?words=true` payload for one āyah's IndoPak words. */
function indopakResp(aya: number, words: string[]) {
  return {
    verses: [
      {
        verse_key: `1:${aya}`,
        words: words.map((w) => ({ char_type_name: "word", text_indopak: w })),
      },
    ],
  };
}

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

  it("renders IndoPak words with data-w hooks (aligned to audio) when selected", async () => {
    localStorage.setItem("ul.script", "indopak");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(indopakResp(1, ["بِسۡمِ", "اللهِ"])), { status: 200 }),
    );

    const { container } = render(<AyahWords surah={1} aya={1} text="بِسْمِ ٱللَّهِ" />);
    await waitFor(() =>
      expect(container.querySelector('.w[data-w="0"]')?.textContent).toBe("بِسۡمِ"),
    );
    // IndoPak words now carry data-w (ADR 0035 §5) so highlighting / tap-to-hear work.
    expect(container.querySelector('.w[data-w="1"]')?.textContent).toBe("اللهِ");
    expect(container.querySelector(".w-tr")).toBeNull();
  });

  it("stacks transliteration under IndoPak words when both are on (ADR 0036)", async () => {
    localStorage.setItem("ul.script", "indopak");
    localStorage.setItem("ul.wbwTranslit", "true");
    mockFetch({
      indopak: indopakResp(1, ["بِسۡمِ", "اللهِ"]),
      translit: {
        verses: [
          {
            verse_key: "1:1",
            words: [
              { char_type_name: "word", transliteration: { text: "bis'mi" } },
              { char_type_name: "word", transliteration: { text: "l-lahi" } },
            ],
          },
        ],
      },
    });

    // Fresh surah number — the translit/IndoPak fetch caches are module-level and
    // persist across tests, so reusing surah 1 would hit another test's cache.
    const { container } = render(<AyahWords surah={12} aya={1} text="بِسْمِ ٱللَّهِ" />);
    await waitFor(() => expect(container.querySelectorAll(".w-tr")).toHaveLength(2));
    // The IndoPak word is the Arabic line of each stacked unit, Latin beneath it.
    expect(container.querySelector('.w-unit .w[data-w="0"]')?.textContent).toBe("بِسۡمِ");
    expect([...container.querySelectorAll(".w-tr")].map((el) => el.textContent)).toEqual([
      "bis'mi",
      "l-lahi",
    ]);
  });

  it("drops the transliteration row when it doesn't line up 1:1 (length guard)", async () => {
    localStorage.setItem("ul.wbwTranslit", "true");
    // One transliteration for a two-word āyah — a mismatch. Without the guard the
    // stacked branch would render misaligned rows; with it, no row is shown.
    mockFetch({
      translit: {
        verses: [
          { verse_key: "1:1", words: [{ char_type_name: "word", transliteration: { text: "bis'mi" } }] },
        ],
      },
    });

    const { container } = render(<AyahWords surah={13} aya={1} text="بِسْمِ ٱللَّهِ" />);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    // Let the resolved fetch apply its state, then confirm it stayed plain.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(container.querySelectorAll(".w")).toHaveLength(2);
    expect(container.querySelector(".w-tr")).toBeNull();
  });
});
