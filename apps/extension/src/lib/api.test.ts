import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchVerse, getEditions, getSurahs } from "./api";

function jsonResponse(body: unknown, ok = true): Promise<Response> {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

function mockFetch(handler: (url: string) => Promise<Response>): ReturnType<typeof vi.fn> {
  const fn = vi.fn((input: RequestInfo | URL) => handler(String(input)));
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("fetchVerse", () => {
  it("returns the Arabic text and translation on success", async () => {
    mockFetch(() => jsonResponse({ ayah: { text: "نَصْر" }, translation: { text: "Victory" } }));
    expect(await fetchVerse(110, 1, "eng-khattab")).toEqual({
      sura: 110,
      aya: 1,
      arabic: "نَصْر",
      translation: "Victory",
    });
  });

  it("tolerates a missing translation", async () => {
    mockFetch(() => jsonResponse({ ayah: { text: "نَصْر" } }));
    expect(await fetchVerse(110, 1, "eng-khattab")).toMatchObject({ translation: null });
  });

  it("returns null on a non-ok response", async () => {
    mockFetch(() => jsonResponse({}, false));
    expect(await fetchVerse(1, 1, "x")).toBeNull();
  });

  it("returns null when the request throws (offline)", async () => {
    mockFetch(() => Promise.reject(new Error("offline")));
    expect(await fetchVerse(1, 1, "x")).toBeNull();
  });

  it("requests the chosen edition", async () => {
    const fn = mockFetch(() => jsonResponse({ ayah: { text: "x" } }));
    await fetchVerse(2, 255, "ur-jalandhry");
    expect(fn).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/surahs/2/ayahs/255?edition=ur-jalandhry"),
    );
  });
});

describe("getSurahs", () => {
  const surahs = Array.from({ length: 114 }, (_, i) => ({ number: i + 1 }));

  it("fetches once, then serves from cache", async () => {
    const fn = mockFetch(() => jsonResponse({ surahs }));
    const first = await getSurahs();
    const second = await getSurahs();
    expect(first).toHaveLength(114);
    expect(second).toHaveLength(114);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not cache an incomplete list", async () => {
    mockFetch(() => jsonResponse({ surahs: [{ number: 1 }] }));
    expect(await getSurahs()).toHaveLength(1);
    expect(localStorage.getItem("ul.ext.surahs")).toBeNull();
  });
});

describe("getEditions", () => {
  it("returns and caches editions", async () => {
    const fn = mockFetch(() => jsonResponse({ editions: [{ id: "eng-khattab", name: "Khattab" }] }));
    expect(await getEditions()).toHaveLength(1);
    await getEditions();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
