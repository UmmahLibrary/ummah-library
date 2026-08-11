/**
 * Integration-style tests for the I/O layer: `expo-file-system` is mocked with
 * an in-memory fake (same convention as `offlineCache.test.ts`), extended with
 * `list()`, `size`, and `File.downloadFileAsync` — the surface `audio-store.ts`
 * additionally relies on beyond the plain read/write the content cache uses.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VerseKey } from "@ummahlibrary/core";

const { fsState, joinUri } = vi.hoisted(() => {
  function joinUri(parts: unknown[]): string {
    return parts.map((p) => (typeof p === "string" ? p : (p as { uri: string }).uri)).join("/");
  }
  return {
    // Directories are membership-only; files map to their downloaded byte size.
    fsState: { dirs: new Set<string>(), files: new Map<string, number>() },
    joinUri,
  };
});

vi.mock("expo-file-system", () => {
  class FakeDirectory {
    uri: string;
    constructor(...uris: unknown[]) {
      this.uri = joinUri(uris);
    }
    get exists() {
      return fsState.dirs.has(this.uri);
    }
    create() {
      // Mirrors the real `intermediates: true` behaviour the adapter always
      // passes: every ancestor under the document root becomes listable too.
      let uri = this.uri;
      while (uri.startsWith("file:///document")) {
        fsState.dirs.add(uri);
        uri = uri.slice(0, uri.lastIndexOf("/"));
      }
    }
    delete() {
      const prefix = `${this.uri}/`;
      fsState.dirs.delete(this.uri);
      for (const d of [...fsState.dirs]) if (d.startsWith(prefix)) fsState.dirs.delete(d);
      for (const f of [...fsState.files.keys()]) if (f.startsWith(prefix)) fsState.files.delete(f);
    }
    /** Direct children only (one path segment past this directory), like the real API. */
    list(): (FakeDirectory | FakeFile)[] {
      const prefix = `${this.uri}/`;
      const seen = new Map<string, "dir" | "file">();
      for (const d of fsState.dirs) {
        if (d.startsWith(prefix) && !d.slice(prefix.length).includes("/")) seen.set(d, "dir");
      }
      for (const f of fsState.files.keys()) {
        if (f.startsWith(prefix) && !f.slice(prefix.length).includes("/")) seen.set(f, "file");
      }
      return [...seen].map(([uri, kind]) => (kind === "dir" ? new FakeDirectory(uri) : new FakeFile(uri)));
    }
  }
  class FakeFile {
    uri: string;
    constructor(...uris: unknown[]) {
      this.uri = joinUri(uris);
    }
    get exists() {
      return fsState.files.has(this.uri);
    }
    get size() {
      return fsState.files.get(this.uri) ?? 0;
    }
    delete() {
      fsState.files.delete(this.uri);
    }
    static async downloadFileAsync(
      url: string,
      dest: FakeFile,
      options?: { idempotent?: boolean },
    ) {
      if (fsState.files.has(dest.uri) && !options?.idempotent) {
        throw new Error("DestinationAlreadyExists");
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`UnableToDownload: ${res.status}`);
      const body = await res.text();
      fsState.files.set(dest.uri, body.length);
      return new FakeFile(dest.uri);
    }
  }
  const Paths = { document: new FakeDirectory("file:///document") };
  return { Directory: FakeDirectory, File: FakeFile, Paths };
});

const ref = (sura: number, aya: number): VerseKey => ({ sura, aya });

beforeEach(() => {
  fsState.dirs.clear();
  fsState.files.clear();
  vi.resetModules();
});

async function loadStore() {
  const mod = await import("./audio-store");
  return mod.mobileAudioStore;
}

describe("mobileAudioStore", () => {
  it("reports not-saved, then saved after save()", async () => {
    const store = await loadStore();
    expect(await store.has("mishary", ref(1, 1))).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("audio", { status: 200 })));

    await store.save("mishary", ref(1, 1), "https://example.com/1-1.mp3");

    expect(await store.has("mishary", ref(1, 1))).toBe(true);
    vi.unstubAllGlobals();
  });

  it("save() is idempotent — a second save doesn't refetch", async () => {
    const store = await loadStore();
    const fetchMock = vi.fn(async () => new Response("audio", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await store.save("mishary", ref(2, 5), "https://example.com/2-5.mp3");
    await store.save("mishary", ref(2, 5), "https://example.com/2-5.mp3");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("save() throws when the remote fetch fails, and leaves nothing behind", async () => {
    const store = await loadStore();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));

    await expect(
      store.save("mishary", ref(1, 2), "https://example.com/missing.mp3"),
    ).rejects.toThrow(/404/);
    expect(await store.has("mishary", ref(1, 2))).toBe(false);
    vi.unstubAllGlobals();
  });

  it("localUrl() returns a file:// URI once saved, null otherwise", async () => {
    const store = await loadStore();
    expect(await store.localUrl("mishary", ref(3, 1))).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => new Response("audio", { status: 200 })));
    await store.save("mishary", ref(3, 1), "https://example.com/3-1.mp3");

    const url = await store.localUrl("mishary", ref(3, 1));
    expect(url).toContain("/ul-audio/mishary/3/1.mp3");
    vi.unstubAllGlobals();
  });

  it("removeSurah() deletes only that surah's ayahs for that reciter", async () => {
    const store = await loadStore();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("audio", { status: 200 })));
    await store.save("mishary", ref(4, 1), "https://example.com/4-1.mp3");
    await store.save("mishary", ref(4, 2), "https://example.com/4-2.mp3");
    await store.save("mishary", ref(5, 1), "https://example.com/5-1.mp3");

    await store.removeSurah("mishary", 4);

    expect(await store.has("mishary", ref(4, 1))).toBe(false);
    expect(await store.has("mishary", ref(4, 2))).toBe(false);
    expect(await store.has("mishary", ref(5, 1))).toBe(true);
    vi.unstubAllGlobals();
  });

  it("savedSurahs() aggregates ayah count and bytes, sorted by reciter then surah", async () => {
    const store = await loadStore();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("12345", { status: 200 })));

    await store.save("zzz-reciter", ref(2, 1), "https://example.com/a.mp3");
    const oneAyahBytes = (await store.savedSurahs())[0]!.bytes;

    await store.save("aaa-reciter", ref(9, 1), "https://example.com/b.mp3");
    await store.save("aaa-reciter", ref(2, 1), "https://example.com/c.mp3");
    await store.save("aaa-reciter", ref(2, 2), "https://example.com/d.mp3");

    const saved = await store.savedSurahs();

    expect(saved).toEqual([
      { reciterId: "aaa-reciter", surah: 2, ayahCount: 2, bytes: oneAyahBytes * 2 },
      { reciterId: "aaa-reciter", surah: 9, ayahCount: 1, bytes: oneAyahBytes },
      { reciterId: "zzz-reciter", surah: 2, ayahCount: 1, bytes: oneAyahBytes },
    ]);
    vi.unstubAllGlobals();
  });

  it("savedSurahs() returns empty before anything is downloaded", async () => {
    const store = await loadStore();
    expect(await store.savedSurahs()).toEqual([]);
  });
});
