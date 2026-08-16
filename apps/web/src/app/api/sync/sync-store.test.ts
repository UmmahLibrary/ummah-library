import { describe, expect, it } from "vitest";
import { InMemorySyncStore, type ServerEntry, UpstashSyncStore, syncStoreFromEnv } from "./sync-store";

const entry = (id: string): ServerEntry => ({
  id,
  hlc: { millis: 1, counter: 0, node: "n" },
  ciphertext: "ct",
  nonce: "iv",
  v: 1,
});

type Call = { url: string; init?: RequestInit };
function stubFetch(handler: (call: Call) => { ok?: boolean; status?: number; body: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const call = { url, init };
    calls.push(call);
    const r = handler(call);
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.body } as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("InMemorySyncStore", () => {
  it("defaults to empty and round-trips per account", async () => {
    const s = new InMemorySyncStore();
    expect(await s.get("acct")).toEqual([]);
    await s.set("acct", [entry("x")]);
    expect(await s.get("acct")).toEqual([entry("x")]);
    expect(await s.get("other")).toEqual([]);
  });
});

describe("UpstashSyncStore", () => {
  it("reads and JSON-parses the stored value", async () => {
    const { fetchImpl, calls } = stubFetch(() => ({
      body: { result: JSON.stringify([entry("x")]) },
    }));
    const store = new UpstashSyncStore({ url: "https://u", token: "tok", fetchImpl });
    expect(await store.get("acct")).toEqual([entry("x")]);
    expect(calls[0]!.url).toBe("https://u/get/sync%3Aacct");
    expect((calls[0]!.init!.headers as Record<string, string>).authorization).toBe("Bearer tok");
  });

  it("treats a null result as an empty set", async () => {
    const { fetchImpl } = stubFetch(() => ({ body: { result: null } }));
    const store = new UpstashSyncStore({ url: "https://u", token: "tok", fetchImpl });
    expect(await store.get("acct")).toEqual([]);
  });

  it("writes the entries as a SET body", async () => {
    const { fetchImpl, calls } = stubFetch(() => ({ body: { result: "OK" } }));
    const store = new UpstashSyncStore({ url: "https://u", token: "tok", fetchImpl });
    await store.set("acct", [entry("x")]);
    expect(calls[0]!.url).toBe("https://u/set/sync%3Aacct");
    expect(calls[0]!.init!.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init!.body as string)).toEqual([entry("x")]);
  });

  it("throws when Upstash returns a non-ok status", async () => {
    const { fetchImpl } = stubFetch(() => ({ ok: false, status: 500, body: {} }));
    const store = new UpstashSyncStore({ url: "https://u", token: "tok", fetchImpl });
    await expect(store.get("acct")).rejects.toThrow("upstash get failed (500)");
    await expect(store.set("acct", [])).rejects.toThrow("upstash set failed (500)");
  });
});

describe("syncStoreFromEnv", () => {
  it("returns null when not provisioned", () => {
    expect(syncStoreFromEnv({})).toBeNull();
    expect(syncStoreFromEnv({ UPSTASH_REDIS_REST_URL: "https://u" })).toBeNull();
  });
  it("builds an Upstash store when both vars are present", () => {
    const store = syncStoreFromEnv({
      UPSTASH_REDIS_REST_URL: "https://u",
      UPSTASH_REDIS_REST_TOKEN: "t",
    });
    expect(store).toBeInstanceOf(UpstashSyncStore);
  });
});
