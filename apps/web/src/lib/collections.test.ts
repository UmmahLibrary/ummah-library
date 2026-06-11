import { describe, expect, it, vi } from "vitest";
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

describe("collections storage", () => {
  it("starts empty", () => {
    expect(readCollections()).toEqual([]);
    expect(readNotes()).toEqual({});
  });

  it("round-trips collections and emits a change event", () => {
    const handler = vi.fn();
    window.addEventListener(COLLECTIONS_EVENT, handler);

    const cols: Collection[] = [{ id: "c1", name: "Favourites", ayahs: [{ sura: 1, aya: 1 }] }];
    writeCollections(cols);

    expect(readCollections()).toEqual(cols);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(COLLECTIONS_EVENT, handler);
  });

  it("writes, reads, and clears a per-āyah note", () => {
    const ref = { sura: 2, aya: 255 };
    writeNote(ref, "Āyat al-Kursī");
    expect(readNote(ref)).toBe("Āyat al-Kursī");

    writeNote(ref, "   "); // blank clears it
    expect(readNote(ref)).toBe("");
  });

  it("generates unique ids", () => {
    expect(newId()).not.toBe(newId());
  });
});
