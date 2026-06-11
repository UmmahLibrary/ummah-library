import { describe, expect, it, vi } from "vitest";
import { TAFSIR_KEY, readTafsir, writeTafsir } from "./tafsir";

describe("tafsir selection", () => {
  it("returns the fallback when nothing is stored", () => {
    expect(readTafsir("en-ibn-kathir")).toBe("en-ibn-kathir");
  });

  it("prefers the stored edition over the fallback", () => {
    writeTafsir("ar-muyassar");
    expect(readTafsir("en-ibn-kathir")).toBe("ar-muyassar");
    expect(localStorage.getItem(TAFSIR_KEY)).toBe("ar-muyassar");
  });

  it("broadcasts the change on write", () => {
    const handler = vi.fn();
    window.addEventListener(TAFSIR_KEY, handler);
    writeTafsir("x");
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(TAFSIR_KEY, handler);
  });
});
