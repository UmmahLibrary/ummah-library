import { afterEach, describe, expect, it, vi } from "vitest";
import { SCRIPT_KEY, fetchSurahIndopak, readScript, writeScript } from "./script";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("script selection", () => {
  it("defaults to Uthmani for a locale without an Urdu/Hindi/Bengali prefix", async () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(await readScript()).toBe("uthmani");
  });

  it("defaults to IndoPak for an Urdu-prefixed locale", async () => {
    vi.stubGlobal("navigator", { language: "ur-PK" });
    expect(await readScript()).toBe("indopak");
  });

  it("round-trips an explicit choice, overriding the locale default", async () => {
    vi.stubGlobal("navigator", { language: "ur-PK" });
    await writeScript("uthmani");
    expect(await readScript()).toBe("uthmani");
  });

  it("ignores a corrupt stored value and falls back to the locale default", async () => {
    localStorage.setItem("ul.script", "not-a-script");
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(await readScript()).toBe("uthmani");
  });

  it("broadcasts SCRIPT_KEY with the new value on write", async () => {
    const onChange = vi.fn();
    window.addEventListener(SCRIPT_KEY, onChange);
    await writeScript("indopak");
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener(SCRIPT_KEY, onChange);
  });
});

describe("fetchSurahIndopak", () => {
  it("maps quran.com's per-word response to āyah → words, keeping only 'word' entries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            verses: [
              {
                verse_key: "1:1",
                words: [
                  { char_type_name: "word", text_indopak: "بِسْمِ" },
                  { char_type_name: "end", text_indopak: "۝" }, // verse-end marker, not a word
                ],
              },
            ],
          }),
      }),
    );
    const map = await fetchSurahIndopak(101);
    expect(map.get(1)).toEqual(["بِسْمِ"]);
  });

  it("resolves to an empty map on a failed response instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const map = await fetchSurahIndopak(102);
    expect(map.size).toBe(0);
  });

  it("resolves to an empty map when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const map = await fetchSurahIndopak(103);
    expect(map.size).toBe(0);
  });
});
