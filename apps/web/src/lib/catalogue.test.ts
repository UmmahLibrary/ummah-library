import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCatalogue, fetchEditionSurah } from "./catalogue";

afterEach(() => vi.unstubAllGlobals());

describe("translation catalogue", () => {
  it("fetches and parses the editions catalogue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              translations: [
                { id: "eng-sahih", name: "Sahih", author: "X", language: "en", direction: "ltr" },
              ],
            }),
            { status: 200 },
          ),
      ),
    );

    await expect(fetchCatalogue()).resolves.toEqual([
      { id: "eng-sahih", name: "Sahih", author: "X", language: "en", direction: "ltr" },
    ]);
  });

  it("fetches and maps one edition's surah text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ayahs: [
                { aya: 1, text: "In the name of Allah" },
                { aya: 2, text: "All praise is for Allah" },
              ],
            }),
            { status: 200 },
          ),
      ),
    );

    const map = await fetchEditionSurah("eng-sahih", 1);
    expect(map.get(1)).toBe("In the name of Allah");
    expect(map.get(2)).toBe("All praise is for Allah");
  });
});
