import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EDITIONS,
  EDITIONS_KEY,
  readEditions,
  readReadingTranslation,
  writeEditions,
  writeReadingTranslation,
} from "./editions";
import { webSettingsStore } from "./settings-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("editions selection", () => {
  it("defaults to DEFAULT_EDITIONS for a non-Urdu locale", async () => {
    expect(await readEditions()).toEqual(DEFAULT_EDITIONS);
  });

  it("round-trips the edition set and emits a change event", async () => {
    const handler = vi.fn();
    window.addEventListener(EDITIONS_KEY, handler);

    await writeEditions(["eng-sahih", "urd-jalandhry"]);

    expect(await readEditions()).toEqual(["eng-sahih", "urd-jalandhry"]);
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener(EDITIONS_KEY, handler);
  });

  it("round-trips the single reading translation", async () => {
    expect(await readReadingTranslation()).toBeNull();
    await writeReadingTranslation("eng-sahih");
    expect(await readReadingTranslation()).toBe("eng-sahih");
  });

  it("falls back to defaults when stored editions is a corrupt non-array (peer-synced/corrupt)", async () => {
    // A peer device or corrupt storage can leave ul.editions as a non-array;
    // readEditions must not return it (consumers would crash on .map / new Set()).
    const spy = vi.spyOn(webSettingsStore, "read").mockResolvedValue({ editions: "eng" } as never);
    expect(await readEditions()).toEqual(DEFAULT_EDITIONS);
    spy.mockRestore();
  });
});
