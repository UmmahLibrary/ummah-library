import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WORD_TRANSLIT_KEY,
  fetchSurahWordTranslit,
  readWordTranslit,
  writeWordTranslit,
} from "./word-translit";

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("word-transliteration toggle", () => {
  it("defaults to off and round-trips with a change event", async () => {
    expect(await readWordTranslit()).toBe(false);
    const handler = vi.fn();
    window.addEventListener(WORD_TRANSLIT_KEY, handler);

    await writeWordTranslit(true);
    expect(await readWordTranslit()).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
    expect(localStorage.getItem("ul.wbwTranslit")).toBe("true");

    window.removeEventListener(WORD_TRANSLIT_KEY, handler);
  });
});

describe("fetchSurahWordTranslit", () => {
  it("maps each āyah to its per-word transliterations (words only)", async () => {
    const body = {
      verses: [
        {
          verse_key: "1:1",
          words: [
            { char_type_name: "word", transliteration: { text: "bis'mi" } },
            { char_type_name: "word", transliteration: { text: "l-lahi" } },
            { char_type_name: "end", transliteration: { text: null } }, // āyah marker — dropped
          ],
        },
      ],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200 }),
    );

    const map = await fetchSurahWordTranslit(1);
    expect(map.get(1)).toEqual(["bis'mi", "l-lahi"]);
  });

  it("resolves to an empty map on a failed request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));
    // surah 114 (uncached) so the memo from the previous test doesn't mask this.
    const map = await fetchSurahWordTranslit(114);
    expect(map.size).toBe(0);
  });
});
