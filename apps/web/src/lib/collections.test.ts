import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Collection } from "@ummahlibrary/core";
import {
  COLLECTIONS_EVENT,
  newId,
  readCollections,
  readNote,
  readNotes,
  writeCollections,
  writeNote,
} from "./collections";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("collections storage", () => {
  it("starts empty", async () => {
    expect(await readCollections()).toEqual([]);
    expect(await readNotes()).toEqual({});
  });

  it("round-trips collections and emits a change event", async () => {
    const handler = vi.fn();
    window.addEventListener(COLLECTIONS_EVENT, handler);

    const cols: Collection[] = [{ id: "c1", name: "Favourites", ayahs: [{ sura: 1, aya: 1 }] }];
    await writeCollections(cols);

    expect(await readCollections()).toEqual(cols);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(COLLECTIONS_EVENT, handler);
  });

  it("writes, reads, and clears a per-āyah note", async () => {
    const ref = { sura: 2, aya: 255 };
    await writeNote(ref, "Āyat al-Kursī");
    expect(await readNote(ref)).toBe("Āyat al-Kursī");

    await writeNote(ref, "   "); // blank clears it
    expect(await readNote(ref)).toBe("");
  });

  it("generates unique ids", () => {
    expect(newId()).not.toBe(newId());
  });
});
