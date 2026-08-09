import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VerseKey } from "@ummahlibrary/core";
import { webAudioStore } from "./audio-store";

/**
 * A minimal in-memory stand-in for the browser CacheStorage/Cache APIs — same-
 * origin resolution only, which is all `audio-store.ts` relies on.
 */
const ORIGIN = "http://localhost/";
type FakeRequest = string | { url: string };
const toKey = (request: FakeRequest): string =>
  new URL(typeof request === "string" ? request : request.url, ORIGIN).href;

class FakeCache {
  private store = new Map<string, Response>();

  async match(request: FakeRequest): Promise<Response | undefined> {
    return this.store.get(toKey(request))?.clone();
  }

  async put(request: FakeRequest, response: Response): Promise<void> {
    this.store.set(toKey(request), response);
  }

  async delete(request: FakeRequest): Promise<boolean> {
    return this.store.delete(toKey(request));
  }

  async keys(): Promise<{ url: string }[]> {
    return [...this.store.keys()].map((url) => ({ url }));
  }
}

const ref = (sura: number, aya: number): VerseKey => ({ sura, aya });

// jsdom's URL polyfill doesn't implement the Blob-URL Web API.
const realCreateObjectURL = URL.createObjectURL;

beforeEach(() => {
  const cache = new FakeCache();
  vi.stubGlobal("caches", { open: async () => cache });
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
});

afterEach(() => {
  vi.unstubAllGlobals();
  URL.createObjectURL = realCreateObjectURL;
});

describe("webAudioStore", () => {
  it("reports not-saved, then saved after save()", async () => {
    expect(await webAudioStore.has("mishary", ref(1, 1))).toBe(false);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 })),
    );

    await webAudioStore.save("mishary", ref(1, 1), "https://example.com/1-1.mp3");

    expect(await webAudioStore.has("mishary", ref(1, 1))).toBe(true);
  });

  it("save() is idempotent — a second save doesn't refetch", async () => {
    const fetchMock = vi.fn(
      async () => new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await webAudioStore.save("mishary", ref(2, 5), "https://example.com/2-5.mp3");
    await webAudioStore.save("mishary", ref(2, 5), "https://example.com/2-5.mp3");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("save() throws when the remote fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));

    await expect(webAudioStore.save("mishary", ref(1, 2), "https://example.com/missing.mp3")).rejects.toThrow(
      /404/,
    );
    expect(await webAudioStore.has("mishary", ref(1, 2))).toBe(false);
  });

  it("localUrl() returns a blob URL once saved, null otherwise", async () => {
    expect(await webAudioStore.localUrl("mishary", ref(3, 1))).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 })),
    );
    await webAudioStore.save("mishary", ref(3, 1), "https://example.com/3-1.mp3");

    const url = await webAudioStore.localUrl("mishary", ref(3, 1));
    expect(url).toMatch(/^blob:/);
  });

  it("removeSurah() deletes only that surah's ayahs for that reciter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Blob(["audio"], { type: "audio/mpeg" }), { status: 200 })),
    );
    await webAudioStore.save("mishary", ref(4, 1), "https://example.com/4-1.mp3");
    await webAudioStore.save("mishary", ref(4, 2), "https://example.com/4-2.mp3");
    await webAudioStore.save("mishary", ref(5, 1), "https://example.com/5-1.mp3");

    await webAudioStore.removeSurah("mishary", 4);

    expect(await webAudioStore.has("mishary", ref(4, 1))).toBe(false);
    expect(await webAudioStore.has("mishary", ref(4, 2))).toBe(false);
    expect(await webAudioStore.has("mishary", ref(5, 1))).toBe(true);
  });

  it("savedSurahs() aggregates ayah count and bytes, sorted by reciter then surah", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(new Blob(["12345"], { type: "audio/mpeg" }), { status: 200 }),
      ),
    );

    // Save one ayah first to learn how big a single saved ayah reports as —
    // sidesteps any environment-specific Blob/Response encoding overhead and
    // keeps the assertion focused on the aggregation logic, not byte-counting.
    await webAudioStore.save("zzz-reciter", ref(2, 1), "https://example.com/a.mp3");
    const oneAyahBytes = (await webAudioStore.savedSurahs())[0]!.bytes;

    await webAudioStore.save("aaa-reciter", ref(9, 1), "https://example.com/b.mp3");
    await webAudioStore.save("aaa-reciter", ref(2, 1), "https://example.com/c.mp3");
    await webAudioStore.save("aaa-reciter", ref(2, 2), "https://example.com/d.mp3");

    const saved = await webAudioStore.savedSurahs();

    expect(saved).toEqual([
      { reciterId: "aaa-reciter", surah: 2, ayahCount: 2, bytes: oneAyahBytes * 2 },
      { reciterId: "aaa-reciter", surah: 9, ayahCount: 1, bytes: oneAyahBytes },
      { reciterId: "zzz-reciter", surah: 2, ayahCount: 1, bytes: oneAyahBytes },
    ]);
  });

  it("no-ops gracefully when the Cache API is unavailable", async () => {
    vi.stubGlobal("caches", undefined);

    expect(await webAudioStore.has("mishary", ref(1, 1))).toBe(false);
    expect(await webAudioStore.localUrl("mishary", ref(1, 1))).toBeNull();
    expect(await webAudioStore.savedSurahs()).toEqual([]);
    await expect(webAudioStore.save("mishary", ref(1, 1), "https://example.com/x.mp3")).resolves.toBeUndefined();
    await expect(webAudioStore.removeSurah("mishary", 1)).resolves.toBeUndefined();
  });
});
