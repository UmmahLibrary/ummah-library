import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EDITIONS,
  EDITIONS_KEY,
  readEditions,
  readReadingTranslation,
  writeEditions,
  writeReadingTranslation,
} from "./editions";

describe("editions selection", () => {
  it("defaults to DEFAULT_EDITIONS for a non-Urdu locale", () => {
    expect(readEditions()).toEqual(DEFAULT_EDITIONS);
  });

  it("round-trips the edition set and emits a change event", () => {
    const handler = vi.fn();
    window.addEventListener(EDITIONS_KEY, handler);

    writeEditions(["eng-sahih", "urd-jalandhry"]);

    expect(readEditions()).toEqual(["eng-sahih", "urd-jalandhry"]);
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(EDITIONS_KEY, handler);
  });

  it("round-trips the single reading translation", () => {
    expect(readReadingTranslation()).toBeNull();
    writeReadingTranslation("eng-sahih");
    expect(readReadingTranslation()).toBe("eng-sahih");
  });
});
