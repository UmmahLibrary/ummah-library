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

    expect(out).toEqual(server);
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
    expect(await backend.exchange("x", [])).toEqual([]);
  });

  it("throws on a non-ok response", async () => {
    const { fetchImpl } = stubFetch({ ok: false, status: 429, body: {} });
    const backend = createHttpSyncBackend({ fetchImpl });
    await expect(backend.exchange("x", [])).rejects.toThrow("429");
  });
});
