/**
 * Extension HTTP backend tests (#25, ADR 0033): posts ciphertext under a Bearer
 * accountId to the deployed `${BASE_URL}/api/sync`, and drops reply entries with a
 * malformed clock (the server is untrusted).
 */
import { describe, expect, it } from "vitest";
import type { SyncEntry } from "@ummahlibrary/core";
import { createHttpSyncBackend } from "./http-sync-backend";

const good: SyncEntry = { id: "a", hlc: { millis: 5, counter: 0, node: "n1" }, ciphertext: "c", nonce: "i" };
const resp = (body: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => body }) as unknown as Response;

describe("createHttpSyncBackend (extension)", () => {
  it("defaults to the apex /api/sync and sends a Bearer accountId", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return resp({ entries: [good] });
    }) as unknown as typeof fetch;
    const out = await createHttpSyncBackend({ fetchImpl }).exchange("acc", [good]);
    expect(captured!.url).toBe("https://ummahlibrary.org/api/sync");
    expect((captured!.init.headers as Record<string, string>).authorization).toBe("Bearer acc");
    expect(out.entries).toEqual([good]);
  });

  it("drops reply entries with a malformed clock", async () => {
    const bad = [good, { id: "z", hlc: { millis: -1, counter: 0, node: "n" }, ciphertext: "c", nonce: "i" }, "x"];
    const fetchImpl = (async () => resp({ entries: bad })) as unknown as typeof fetch;
    expect((await createHttpSyncBackend({ fetchImpl }).exchange("a", [])).entries).toEqual([good]);
  });

  it("throws on a non-OK response", async () => {
    const fetchImpl = (async () => resp({}, false, 501)) as unknown as typeof fetch;
    await expect(createHttpSyncBackend({ fetchImpl }).exchange("a", [])).rejects.toThrow(/501/);
  });
});
