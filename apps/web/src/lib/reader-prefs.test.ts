import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  READING_MODE_EVENT,
  SCALE_EVENT,
  readReciter,
  readScale,
  writeReadingMode,
  writeReciter,
  writeScale,
} from "./reader-prefs";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("reader-prefs", () => {
  it("round-trips the reciter under ul.reciter", async () => {
    expect(await readReciter()).toBeNull();
    await writeReciter("alafasy");
    expect(await readReciter()).toBe("alafasy");
    expect(localStorage.getItem("ul.reciter")).toBe("alafasy");
  });

  it("round-trips the font scale, defaulting to 1", async () => {
    expect(await readScale()).toBe(1);
    await writeScale(1.4);
    expect(await readScale()).toBe(1.4);
  });

  it("persists the reading mode", async () => {
    await writeReadingMode("reading-tr");
    expect(localStorage.getItem("ul.readingMode")).toBe("reading-tr");
  });

  it("fires SCALE_EVENT on write, so open views can re-read live (e.g. a synced change)", async () => {
    const onChange = vi.fn();
    window.addEventListener(SCALE_EVENT, onChange);
    await writeScale(1.2);
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener(SCALE_EVENT, onChange);
  });

  it("fires READING_MODE_EVENT with the new mode as detail, so open readers can re-render live", async () => {
    const onChange = vi.fn();
    window.addEventListener(READING_MODE_EVENT, onChange);
    await writeReadingMode("reading-tr");
    expect(onChange).toHaveBeenCalledOnce();
    expect((onChange.mock.calls[0]![0] as CustomEvent).detail).toBe("reading-tr");
    window.removeEventListener(READING_MODE_EVENT, onChange);
  });
});
