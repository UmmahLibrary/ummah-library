import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** A minimal in-memory Cache API (insertion-ordered, like the real one). */
class FakeCache {
  entries = new Map<string, Response>();
  async match(req: Request | string) {
    return this.entries.get(typeof req === "string" ? req : req.url);
  }
  async put(req: Request | string, res: Response) {
    const key = typeof req === "string" ? req : req.url;
    this.entries.delete(key);
    this.entries.set(key, res);
  }
  async addAll(urls: string[]) {
    for (const u of urls) this.entries.set(u, new Response("precached"));
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }) as Request);
  }
  async delete(req: Request | string) {
    return this.entries.delete(typeof req === "string" ? req : req.url);
  }
}

function loadWorker(fetchImpl: (req: Request) => Promise<Response>) {
  const stores = new Map<string, FakeCache>();
  const handlers: Record<string, (e: unknown) => void> = {};
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name)!;
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (req: Request | string) => {
      for (const c of stores.values()) {
        const hit = await c.match(req);
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const self = {
    location: { origin: "https://ummahlibrary.org" },
    addEventListener: (type: string, fn: (e: unknown) => void) => (handlers[type] = fn),
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  };
  const src = readFileSync(join(__dirname, "../../public/sw.js"), "utf8");
  new Function("self", "caches", "fetch", src)(self, caches, fetchImpl);

  async function request(path: string, mode: RequestMode = "no-cors") {
    let responded: Promise<Response> | undefined;
    const req = new Request(`https://ummahlibrary.org${path}`);
    Object.defineProperty(req, "mode", { value: mode });
    handlers.fetch!({ request: req, respondWith: (p: Promise<Response>) => (responded = p) });
    const res = await responded!;
    await new Promise((r) => setTimeout(r, 0)); // let background cache writes settle
    await new Promise((r) => setTimeout(r, 0));
    return res;
  }
  async function activate() {
    let done: Promise<unknown> | undefined;
    handlers.activate!({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  }
  return { stores, request, activate };
}

describe("service worker", () => {
  it("never keeps an error page as a page's offline copy", async () => {
    const sw = loadWorker(async () => new Response("oops", { status: 500 }));
    await sw.request("/surah/2", "navigate");
    const pages = sw.stores.get("ul-pages-v1");
    expect(await pages?.match("https://ummahlibrary.org/surah/2")).toBeUndefined();
  });

  it("caches a good page for offline reading", async () => {
    const sw = loadWorker(async () => new Response("<html>", { status: 200 }));
    await sw.request("/surah/2", "navigate");
    const pages = sw.stores.get("ul-pages-v1")!;
    expect(await pages.match("https://ummahlibrary.org/surah/2")).toBeDefined();
  });

  it("caps the static cache so it can't grow with every deploy", async () => {
    const sw = loadWorker(async () => new Response("chunk", { status: 200 }));
    for (let i = 0; i < 320; i++) await sw.request(`/_next/static/chunks/c${i}.js`);
    const statics = sw.stores.get("ul-static-v2")!;
    expect(statics.entries.size).toBe(300);
    // The newest are kept, the oldest dropped.
    expect(statics.entries.has("https://ummahlibrary.org/_next/static/chunks/c319.js")).toBe(true);
    expect(statics.entries.has("https://ummahlibrary.org/_next/static/chunks/c0.js")).toBe(false);
  }, 60_000);

  it("on update, never deletes the offline recitations cache (or any cache it doesn't own)", async () => {
    const sw = loadWorker(async () => new Response("x", { status: 200 }));
    sw.stores.set("ul-audio-v1", new FakeCache());
    sw.stores.set("someone-else", new FakeCache());
    await sw.activate();
    expect(sw.stores.has("ul-audio-v1")).toBe(true);
    expect(sw.stores.has("someone-else")).toBe(true);
  });

  it("serves a reader content API from cache when offline, but never caches location APIs", async () => {
    let online = true;
    const sw = loadWorker(async () => {
      if (!online) throw new TypeError("Failed to fetch");
      return new Response('{"entries":[]}', { status: 200 });
    });
    await sw.request("/api/v1/surahs/2/tafsirs/en-ibn-kathir");
    await sw.request("/api/v1/prayer-times?lat=21.4&lng=39.8&date=2026-11-24");
    await sw.request("/api/v1/hadith/eng-bukhari");
    online = false;
    const res = await sw.request("/api/v1/surahs/2/tafsirs/en-ibn-kathir");
    expect(await res.text()).toBe('{"entries":[]}');
    const api = sw.stores.get("ul-api-v1")!;
    expect([...api.entries.keys()].some((k) => k.includes("prayer-times"))).toBe(false);
    expect([...api.entries.keys()].some((k) => k.endsWith("/hadith/eng-bukhari"))).toBe(false);
  });

  it("on update, drops the old unbounded static cache but keeps saved pages", async () => {
    const sw = loadWorker(async () => new Response("x", { status: 200 }));
    sw.stores.set("ul-static-v1", new FakeCache());
    sw.stores.set("ul-pages-v1", new FakeCache());
    await sw.activate();
    expect(sw.stores.has("ul-static-v1")).toBe(false);
    expect(sw.stores.has("ul-pages-v1")).toBe(true);
  });
});
