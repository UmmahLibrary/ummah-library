/**
 * Mobile HTTP backend tests (#25, ADR 0033): the transport pushes ciphertext under
 * a Bearer accountId, resolves an absolute endpoint from the app's API base, and —
 * because the server is untrusted — drops any reply entry with a malformed clock.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { SyncEntry } from "@ummahlibrary/core";
import { createHttpSyncBackend } from "./http-sync-backend";

const goodEntry: SyncEntry = {
  id: "abc",
  hlc: { millis: 5, counter: 0, node: "n1" },
  ciphertext: "ct",
  nonce: "nn",
};

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
  delete process.env.EXPO_PUBLIC_SYNC_URL;
});

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

describe("createHttpSyncBackend", () => {
  it("POSTs entries with a Bearer accountId and JSON body", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return jsonResponse({ entries: [goodEntry] });
    }) as unknown as typeof fetch;

    const backend = createHttpSyncBackend({ endpoint: "https://x.test/api/sync", fetchImpl });
    const out = await backend.exchange("acc-123", [goodEntry]);

    expect(captured!.url).toBe("https://x.test/api/sync");
    expect(captured!.init.method).toBe("POST");
    expect((captured!.init.headers as Record<string, string>).authorization).toBe("Bearer acc-123");
    expect(JSON.parse(captured!.init.body as string)).toEqual({ entries: [goodEntry] });
    expect(out.entries).toEqual([goodEntry]);
  });

  it("derives the endpoint from EXPO_PUBLIC_API_BASE_URL's origin (not the /api/v1 prefix)", async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://example.com/api/v1";
    let url = "";
    const fetchImpl = (async (u: string) => {
      url = u;
      return jsonResponse({ entries: [] });
    }) as unknown as typeof fetch;
    await createHttpSyncBackend({ fetchImpl }).exchange("a", []);
    expect(url).toBe("https://example.com/api/sync");
  });

  it("drops reply entries with a malformed/out-of-range clock (untrusted server)", async () => {
    const bad = [
      goodEntry,
      { id: "", hlc: { millis: 1, counter: 0, node: "n" }, ciphertext: "c", nonce: "x" },
      { id: "z", hlc: { millis: -1, counter: 0, node: "n" }, ciphertext: "c", nonce: "x" },
      { id: "z", hlc: { millis: 1, counter: 0, node: "" }, ciphertext: "c", nonce: "x" },
      { id: "z", hlc: { millis: 1.5, counter: 0, node: "n" }, ciphertext: "c", nonce: "x" },
      "not an object",
    ];
    const fetchImpl = (async () => jsonResponse({ entries: bad })) as unknown as typeof fetch;
    const out = await createHttpSyncBackend({ endpoint: "https://x/api/sync", fetchImpl }).exchange("a", []);
    expect(out.entries).toEqual([goodEntry]);
  });

  it("throws when the server responds non-OK", async () => {
    const fetchImpl = (async () => jsonResponse({}, false, 501)) as unknown as typeof fetch;
    await expect(
      createHttpSyncBackend({ endpoint: "https://x/api/sync", fetchImpl }).exchange("a", []),
    ).rejects.toThrow(/501/);
  });
});
