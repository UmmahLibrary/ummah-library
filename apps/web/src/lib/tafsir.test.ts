import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TAFSIR_KEY, readTafsir, writeTafsir } from "./tafsir";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("tafsir selection", () => {
  it("returns the fallback when nothing is stored", async () => {
    expect(await readTafsir("en-ibn-kathir")).toBe("en-ibn-kathir");
  });

  it("prefers the stored edition over the fallback", async () => {
    await writeTafsir("ar-muyassar");
    expect(await readTafsir("en-ibn-kathir")).toBe("ar-muyassar");
    expect(localStorage.getItem(TAFSIR_KEY)).toBe("ar-muyassar");
  });

  it("broadcasts the change on write", async () => {
    const handler = vi.fn();
    window.addEventListener(TAFSIR_KEY, handler);
    await writeTafsir("x");
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(TAFSIR_KEY, handler);
  });
});
