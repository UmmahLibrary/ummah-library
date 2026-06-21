import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readLastRead,
  readLoop,
  readScroll,
  readWordByWord,
  writeLastRead,
  writeLoop,
  writeScroll,
  writeWordByWord,
} from "./reader-prefs-store";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("reader-prefs-store", () => {
  it("round-trips the last-read surah", () => {
    expect(readLastRead()).toBeNull();
    writeLastRead(36);
    expect(readLastRead()).toBe(36);
  });

  it("returns null last-read on a malformed value", () => {
    localStorage.setItem("ul.lastRead", "{nope");
    expect(readLastRead()).toBeNull();
  });

  it("round-trips the word-by-word toggle", () => {
    expect(readWordByWord()).toBe(false);
    writeWordByWord(true);
    expect(readWordByWord()).toBe(true);
    expect(localStorage.getItem("ul.wbw")).toBe("1");
    writeWordByWord(false);
    expect(readWordByWord()).toBe(false);
  });

  it("round-trips the audio loop toggle", () => {
    expect(readLoop()).toBe(false);
    writeLoop(true);
    expect(readLoop()).toBe(true);
  });

  it("round-trips a per-page scroll offset in sessionStorage", () => {
    expect(readScroll("ul.scroll.2")).toBe(0);
    writeScroll("ul.scroll.2", 540);
    expect(readScroll("ul.scroll.2")).toBe(540);
  });
});
