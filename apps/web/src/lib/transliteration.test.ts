import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSLIT_KEY, readTransliteration, writeTransliteration } from "./transliteration";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("transliteration toggle", () => {
  it("defaults to off when never set", async () => {
    expect(await readTransliteration()).toBe(false);
  });

  it("round-trips the flag and emits a change event", async () => {
    const handler = vi.fn();
    window.addEventListener(TRANSLIT_KEY, handler);

    await writeTransliteration(true);
    expect(await readTransliteration()).toBe(true);
    expect(handler).toHaveBeenCalledOnce();

    await writeTransliteration(false);
    expect(await readTransliteration()).toBe(false);

    window.removeEventListener(TRANSLIT_KEY, handler);
  });
});
