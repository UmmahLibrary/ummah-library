import { describe, expect, it } from "vitest";
import {
  type Collection,
  ayahKey,
  collectionsWithAyah,
  createCollection,
  deleteCollection,
  isInCollection,
  renameCollection,
  toggleAyah,
  totalSavedAyahs,
} from "./collections";

const ref = (sura: number, aya: number) => ({ sura, aya });

describe("createCollection", () => {
  it("adds a named collection, trimming, and ignores blanks", () => {
    expect(createCollection([], "a", "  Duas  ")).toEqual([{ id: "a", name: "Duas", ayahs: [] }]);
    expect(createCollection([], "a", "   ")).toEqual([]);
  });
});

describe("toggleAyah", () => {
  const base: Collection[] = [{ id: "a", name: "Duas", ayahs: [] }];
  it("adds then removes an ayah, without duplicates", () => {
    const added = toggleAyah(base, "a", ref(2, 255));
    expect(added[0]!.ayahs).toEqual([{ sura: 2, aya: 255 }]);
    expect(toggleAyah(added, "a", ref(2, 255))[0]!.ayahs).toEqual([]);
    // adding twice via two toggles on a fresh base is idempotent in content
    expect(toggleAyah(added, "a", ref(1, 1))[0]!.ayahs).toHaveLength(2);
  });
  it("only touches the targeted collection", () => {
    const two: Collection[] = [...base, { id: "b", name: "B", ayahs: [] }];
    const out = toggleAyah(two, "a", ref(2, 255));
    expect(out[1]!.ayahs).toEqual([]);
  });
});

describe("queries", () => {
  const cols: Collection[] = [
    { id: "a", name: "A", ayahs: [ref(2, 255), ref(1, 1)] },
    { id: "b", name: "B", ayahs: [ref(2, 255)] },
  ];
  it("isInCollection / collectionsWithAyah", () => {
    expect(isInCollection(cols[0]!, ref(2, 255))).toBe(true);
    expect(isInCollection(cols[0]!, ref(3, 3))).toBe(false);
    expect(collectionsWithAyah(cols, ref(2, 255))).toEqual(["a", "b"]);
  });
  it("totalSavedAyahs counts distinct ayahs across collections", () => {
    expect(totalSavedAyahs(cols)).toBe(2); // 2:255 shared, 1:1 once
  });
  it("ayahKey formats sura:aya", () => {
    expect(ayahKey(ref(2, 255))).toBe("2:255");
  });
});

describe("rename / delete", () => {
  const cols: Collection[] = [{ id: "a", name: "A", ayahs: [] }];
  it("renames (trimmed, non-empty) and deletes", () => {
    expect(renameCollection(cols, "a", " Favourites ")[0]!.name).toBe("Favourites");
    expect(renameCollection(cols, "a", "  ")[0]!.name).toBe("A");
    expect(deleteCollection(cols, "a")).toEqual([]);
  });
});
