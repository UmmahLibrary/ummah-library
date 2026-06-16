import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readReciter, readScale, writeReadingMode, writeReciter, writeScale } from "./reader-prefs";

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
});
