import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readBookmarks, toggleBookmark } from "./bookmarks";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("bookmarks", () => {
  it("starts empty", async () => {
    expect(await readBookmarks()).toEqual([]);
  });

  it("toggles a surah on and off, keeping the list sorted", async () => {
    expect(await toggleBookmark(36)).toEqual([36]);
    expect(await toggleBookmark(2)).toEqual([2, 36]);
    expect(await toggleBookmark(36)).toEqual([2]);
    expect(await readBookmarks()).toEqual([2]);
  });
});
