import { describe, expect, it } from "vitest";
import {
  CACHE_KEYS,
  MAX_CACHE_AGE_MS,
  MAX_CACHE_BYTES,
  emptyManifest,
  fileNameFor,
  hashKey,
  planEviction,
  totalSize,
  type CacheManifest,
} from "./offlineCacheManifest";

describe("CACHE_KEYS", () => {
  it("builds a stable, distinct key per request shape", () => {
    expect(CACHE_KEYS.surah(2)).toBe("surah:2");
    expect(CACHE_KEYS.translation("en.sahih", 2)).toBe("translation:en.sahih:2");
    expect(CACHE_KEYS.catalogTranslation("en.sahih", 2)).toBe("catalogTranslation:en.sahih:2");
    expect(CACHE_KEYS.tafsir("ibn-kathir", 2)).toBe("tafsir:ibn-kathir:2");
    expect(CACHE_KEYS.hadithSection("bukhari", 3)).toBe("hadith:bukhari:3");
    expect(CACHE_KEYS.timings("mishary", 2)).toBe("timings:mishary:2");
    // Bundled vs runtime-catalogue translations of the same edition id must
    // not collide — they're different endpoints with potentially different
    // bodies.
    expect(CACHE_KEYS.translation("en.sahih", 2)).not.toBe(
      CACHE_KEYS.catalogTranslation("en.sahih", 2),
    );
  });

  it("no-arg lists each get their own fixed key", () => {
    const keys = [
      CACHE_KEYS.surahs(),
      CACHE_KEYS.editions(),
      CACHE_KEYS.translationCatalog(),
      CACHE_KEYS.tafsirs(),
      CACHE_KEYS.names(),
      CACHE_KEYS.adhkar(),
      CACHE_KEYS.searchCorpus(),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("hashKey / fileNameFor", () => {
  it("is deterministic for the same key", () => {
    expect(hashKey("surah:2")).toBe(hashKey("surah:2"));
  });

  it("differs for different keys (no trivial collisions across our key space)", () => {
    const keys = [
      "surah:1",
      "surah:2",
      "translation:en.sahih:2",
      "catalogTranslation:en.sahih:2",
      "tafsir:ibn-kathir:2",
      "hadith:bukhari:3",
      "surahs",
      "editions",
    ];
    const hashes = new Set(keys.map(hashKey));
    expect(hashes.size).toBe(keys.length);
  });

  it("produces a filesystem-safe .json file name", () => {
    const name = fileNameFor("catalogTranslation:some/weird:edition:2");
    expect(name).toMatch(/^[0-9a-f]{8}\.json$/);
  });
});

describe("totalSize", () => {
  it("sums entry byte sizes", () => {
    const m: CacheManifest = {
      entries: {
        a: { file: "a.json", sizeBytes: 100, timestamp: 1 },
        b: { file: "b.json", sizeBytes: 250, timestamp: 2 },
      },
    };
    expect(totalSize(m)).toBe(350);
  });

  it("is 0 for an empty manifest", () => {
    expect(totalSize(emptyManifest())).toBe(0);
  });
});

describe("planEviction", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("evicts nothing when under both bounds", () => {
    const now = 1_000_000;
    const m: CacheManifest = {
      entries: {
        a: { file: "a.json", sizeBytes: 1000, timestamp: now - DAY },
        b: { file: "b.json", sizeBytes: 1000, timestamp: now },
      },
    };
    expect(planEviction(m, now)).toEqual([]);
  });

  it("evicts entries older than the max age even when well under the size cap", () => {
    const now = 100 * DAY;
    const m: CacheManifest = {
      entries: {
        old: { file: "old.json", sizeBytes: 10, timestamp: 0 }, // 100 days old
        fresh: { file: "fresh.json", sizeBytes: 10, timestamp: now - DAY },
      },
    };
    expect(planEviction(m, now)).toEqual(["old"]);
  });

  it("keeps a same-age entry that is exactly at the boundary (not evicted until strictly over)", () => {
    const now = MAX_CACHE_AGE_MS;
    const m: CacheManifest = {
      entries: { edge: { file: "e.json", sizeBytes: 10, timestamp: 0 } },
    };
    expect(planEviction(m, now)).toEqual([]);
  });

  it("evicts oldest-first once the total exceeds the size cap", () => {
    const now = 0;
    const maxBytes = 100;
    const m: CacheManifest = {
      entries: {
        oldest: { file: "1.json", sizeBytes: 60, timestamp: 1 },
        middle: { file: "2.json", sizeBytes: 60, timestamp: 2 },
        newest: { file: "3.json", sizeBytes: 60, timestamp: 3 },
      },
    };
    // Total is 180 > 100. Oldest-first eviction must drop "oldest", then
    // "middle" (60 alone still isn't <= 100 once "oldest" is gone: 120 > 100),
    // leaving only "newest" (60 <= 100).
    const evicted = planEviction(m, now, maxBytes, MAX_CACHE_AGE_MS);
    expect(evicted.sort()).toEqual(["middle", "oldest"]);
  });

  it("never evicts anything for a manifest already within both bounds, including at exactly the byte cap", () => {
    const now = 0;
    const m: CacheManifest = {
      entries: { a: { file: "a.json", sizeBytes: MAX_CACHE_BYTES, timestamp: 0 } },
    };
    expect(planEviction(m, now)).toEqual([]);
  });

  it("age-based eviction runs before the size check (an expired entry doesn't count toward the remaining budget)", () => {
    const now = 100 * DAY;
    const maxBytes = 50;
    const m: CacheManifest = {
      entries: {
        expired: { file: "e.json", sizeBytes: 1000, timestamp: 0 }, // ancient + huge
        recent: { file: "r.json", sizeBytes: 10, timestamp: now - 1 },
      },
    };
    expect(planEviction(m, now, maxBytes)).toEqual(["expired"]);
  });
});
