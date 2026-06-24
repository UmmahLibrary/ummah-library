import { describe, expect, it } from "vitest";
import type { SyncEntry } from "@ummahlibrary/core";
import { createHttpSyncBackend } from "./http-sync-backend";

const entry = (id: string): SyncEntry => ({
  id,
  hlc: { millis: 1, counter: 0, node: "n" },
  ciphertext: "c",
  nonce: "iv",
});

type Call = { url: string; init: RequestInit };

function stubFetch(response: { ok?: boolean; status?: number; body: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.body,
    } as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("createHttpSyncBackend", () => {
  it("posts entries with the account id as a Bearer header and returns the server set", async () => {
    const server = [entry("a"), entry("b")];
    const { fetchImpl, calls } = stubFetch({ body: { entries: server } });
    const backend = createHttpSyncBackend({ fetchImpl });

    const out = await backend.exchange("acct-123", [entry("a")]);

    expect(out.entries).toEqual(server);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("/api/sync");
    expect(calls[0]!.init.method).toBe("POST");
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe(
      "Bearer acct-123",
    );
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ entries: [entry("a")] });
  });

  it("honours a custom endpoint", async () => {
    const { fetchImpl, calls } = stubFetch({ body: { entries: [] } });
    const backend = createHttpSyncBackend({ fetchImpl, endpoint: "https://sync.example/api/sync" });
    await backend.exchange("x", []);
    expect(calls[0]!.url).toBe("https://sync.example/api/sync");
  });

  it("treats a missing entries field as an empty set", async () => {
    const { fetchImpl } = stubFetch({ body: {} });
    const backend = createHttpSyncBackend({ fetchImpl });
    expect((await backend.exchange("x", [])).entries).toEqual([]);
  });

  it("sends the cursor and returns the server's cursor + more flag (ADR 0035)", async () => {
    const { fetchImpl, calls } = stubFetch({ body: { entries: [], cursor: 42, more: true } });
    const backend = createHttpSyncBackend({ fetchImpl });
    const out = await backend.exchange("x", [], 7);
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ entries: [], cursor: 7 });
    expect(out.cursor).toBe(42);
    expect(out.more).toBe(true);
  });

  it("throws on a non-ok response", async () => {
    const { fetchImpl } = stubFetch({ ok: false, status: 429, body: {} });
    const backend = createHttpSyncBackend({ fetchImpl });
    await expect(backend.exchange("x", [])).rejects.toThrow("429");
  });

  it("drops malformed entries from an untrusted server reply (clock-poisoning guard)", async () => {
    const good = entry("a");
    const nonFiniteClock = { id: "b", hlc: { millis: Infinity, counter: 0, node: "x" }, ciphertext: "c", nonce: "iv" };
    const emptyNode = { id: "c", hlc: { millis: 1, counter: 0, node: "" }, ciphertext: "c", nonce: "iv" };
    const { fetchImpl } = stubFetch({ body: { entries: [good, nonFiniteClock, emptyNode] } });
    const backend = createHttpSyncBackend({ fetchImpl });
    expect((await backend.exchange("x", [])).entries).toEqual([good]); // only the well-formed entry survives
  });
});
