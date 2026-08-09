/**
 * Integration-style tests for the I/O layer: `expo-file-system` is mocked
 * with an in-memory fake (same convention as `stores-corrupt.test.ts`'s
 * AsyncStorage fake). Eviction/bound *decision* logic is exercised directly,
 * without mocking, in `offlineCacheManifest.test.ts` — this file only checks
 * that the I/O layer wires fetch-success/fetch-failure to the cache
 * correctly.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// The default 5s timeout is occasionally too tight for the *first* test's
// cold `import("./offlineCache")` (via vi.resetModules() below) when this
// file runs alongside the rest of the monorepo's test suite under `turbo run
// test` — several packages transform concurrently and compete for CPU.
// Later dynamic imports in this file are fast once the transform cache is
// warm; only the cold start needs the extra headroom.
vi.setConfig({ testTimeout: 20_000 });

interface FakeNode {
  uri: string;
}

const { fsState, joinUri } = vi.hoisted(() => {
  function joinUri(parts: unknown[]): string {
    return parts
      .map((p) => (typeof p === "string" ? p : (p as { uri: string }).uri))
      .join("/");
  }
  return {
    fsState: { files: new Map<string, string>(), dirs: new Set<string>() },
    joinUri,
  };
});

vi.mock("expo-file-system", () => {
  class FakeDirectory implements FakeNode {
    uri: string;
    constructor(...uris: unknown[]) {
      this.uri = joinUri(uris);
    }
    get exists() {
      return fsState.dirs.has(this.uri);
    }
    create() {
      fsState.dirs.add(this.uri);
    }
    delete() {
      fsState.dirs.delete(this.uri);
      for (const key of [...fsState.files.keys()]) {
        if (key.startsWith(`${this.uri}/`)) fsState.files.delete(key);
      }
    }
  }
  class FakeFile implements FakeNode {
    uri: string;
    constructor(...uris: unknown[]) {
      this.uri = joinUri(uris);
    }
    get exists() {
      return fsState.files.has(this.uri);
    }
    write(content: string) {
      fsState.files.set(this.uri, content);
    }
    async text() {
      const content = fsState.files.get(this.uri);
      if (content === undefined) throw new Error("ENOENT");
      return content;
    }
    delete() {
      fsState.files.delete(this.uri);
    }
  }
  const Paths = { cache: new FakeDirectory("file:///cache") };
  return { Directory: FakeDirectory, File: FakeFile, Paths };
});

beforeEach(() => {
  fsState.files.clear();
  fsState.dirs.clear();
  vi.resetModules();
});

async function loadCache() {
  return import("./offlineCache");
}

describe("readThrough", () => {
  it("caches a successful fetch and returns the live value", async () => {
    const { readThrough } = await loadCache();
    const value = await readThrough("k", async () => ({ hello: "world" }));
    expect(value).toEqual({ hello: "world" });
  });

  it("falls back to the cached value when a later fetch fails", async () => {
    const { readThrough } = await loadCache();
    await readThrough("surah:2", async () => ({ surah: { number: 2 }, ayahs: [1, 2, 3] }));

    const offlineFetch = async (): Promise<never> => {
      throw new Error("Network request failed");
    };
    const result = await readThrough("surah:2", offlineFetch);
    expect(result).toEqual({ surah: { number: 2 }, ayahs: [1, 2, 3] });
  });

  it("propagates the original error when there is nothing cached for that key", async () => {
    const { readThrough } = await loadCache();
    const err = new Error("HTTP 500");
    await expect(
      readThrough("surah:9", async () => {
        throw err;
      }),
    ).rejects.toBe(err);
  });

  it("never serves a stale cached value while online — a fresh success always overrides it", async () => {
    const { readThrough } = await loadCache();
    await readThrough("editions", async () => ["v1"]);
    const second = await readThrough("editions", async () => ["v2"]);
    expect(second).toEqual(["v2"]);

    // And the fallback now serves the *new* value, proving the cache file was
    // actually overwritten rather than left stale.
    const third = await readThrough("editions", async () => {
      throw new Error("offline");
    });
    expect(third).toEqual(["v2"]);
  });

  it("keys different requests independently (no cross-surah / cross-edition bleed)", async () => {
    const { readThrough } = await loadCache();
    await readThrough("surah:1", async () => "surah-1-body");
    await readThrough("surah:2", async () => "surah-2-body");

    const failing = async (): Promise<never> => {
      throw new Error("offline");
    };
    await expect(readThrough("surah:1", failing)).resolves.toBe("surah-1-body");
    await expect(readThrough("surah:2", failing)).resolves.toBe("surah-2-body");
  });

  it("self-heals when the manifest points at a file that no longer exists on disk", async () => {
    const { readThrough } = await loadCache();
    await readThrough("surah:3", async () => "body");

    // Simulate the OS reclaiming the cache file without us knowing (manifest
    // still references it).
    for (const key of [...fsState.files.keys()]) {
      if (!key.endsWith("manifest.json")) fsState.files.delete(key);
    }

    const err = new Error("offline");
    await expect(
      readThrough("surah:3", async () => {
        throw err;
      }),
    ).rejects.toBe(err);
  });
});

describe("getCacheStats / clearCache", () => {
  it("reports zero for an empty cache", async () => {
    const { getCacheStats } = await loadCache();
    expect(await getCacheStats()).toEqual({ sizeBytes: 0, entryCount: 0 });
  });

  it("counts written entries and their byte size", async () => {
    const { readThrough, getCacheStats } = await loadCache();
    await readThrough("a", async () => "1234567890"); // 12 JSON bytes: "1234567890"
    await readThrough("b", async () => "x");
    const stats = await getCacheStats();
    expect(stats.entryCount).toBe(2);
    expect(stats.sizeBytes).toBeGreaterThan(0);
  });

  it("clearCache empties the cache so a later offline read has nothing to fall back to", async () => {
    const { readThrough, getCacheStats, clearCache } = await loadCache();
    await readThrough("surah:2", async () => ({ ayahs: [] }));
    expect((await getCacheStats()).entryCount).toBe(1);

    await clearCache();
    expect(await getCacheStats()).toEqual({ sizeBytes: 0, entryCount: 0 });

    await expect(
      readThrough("surah:2", async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow("offline");
  });
});
