import { describe, expect, it } from "vitest";
import { DEFAULT_OVERPASS_ENDPOINT, OverpassPlacesProvider, parseOverpassElement } from "./places";

const LONDON = { latitude: 51.5074, longitude: -0.1278 };

/** A fake `fetch` that records the request and returns canned JSON. */
function fakeFetch(payload: unknown, ok = true) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(payload) } as Response);
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const OVERPASS_FIXTURE = {
  elements: [
    // A node close to London — has lat/lon directly.
    {
      type: "node",
      id: 111,
      lat: 51.51,
      lon: -0.12,
      tags: {
        name: "East London Mosque",
        "addr:housenumber": "82",
        "addr:street": "Whitechapel Road",
        "addr:city": "London",
      },
    },
    // A way further away — only has a `center` (out center), no direct lat/lon.
    {
      type: "way",
      id: 222,
      center: { lat: 51.6, lon: -0.3 },
      tags: { name: "Regent's Park Mosque" },
    },
    // Untagged/no name — falls back to "Mosque".
    { type: "node", id: 333, lat: 51.52, lon: -0.11, tags: {} },
    // No position at all (a way queried without `out center`) — dropped.
    { type: "way", id: 444, tags: { name: "No position" } },
  ],
};

describe("parseOverpassElement", () => {
  it("maps a node with a full address", () => {
    expect(parseOverpassElement(OVERPASS_FIXTURE.elements[0] as never)).toEqual({
      id: "osm:node:111",
      name: "East London Mosque",
      coordinates: { latitude: 51.51, longitude: -0.12 },
      address: "82 Whitechapel Road, London",
    });
  });

  it("falls back to the way/relation's center coordinate", () => {
    expect(parseOverpassElement(OVERPASS_FIXTURE.elements[1] as never)).toMatchObject({
      id: "osm:way:222",
      coordinates: { latitude: 51.6, longitude: -0.3 },
    });
  });

  it("falls back to a default name and omits the address when untagged", () => {
    const place = parseOverpassElement(OVERPASS_FIXTURE.elements[2] as never);
    expect(place?.name).toBe("Mosque");
    expect(place?.address).toBeUndefined();
  });

  it("returns null for an element with no usable position", () => {
    expect(parseOverpassElement(OVERPASS_FIXTURE.elements[3] as never)).toBeNull();
  });
});

describe("OverpassPlacesProvider", () => {
  it("queries the Overpass endpoint and returns places nearest-first", async () => {
    const { fn, calls } = fakeFetch(OVERPASS_FIXTURE);
    const provider = new OverpassPlacesProvider(DEFAULT_OVERPASS_ENDPOINT, fn);

    const places = await provider.nearbyMosques(LONDON, 5000);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(DEFAULT_OVERPASS_ENDPOINT);
    expect(calls[0]!.init?.method).toBe("POST");
    expect(String(calls[0]!.init?.body)).toContain('"amenity"="place_of_worship"');
    expect(String(calls[0]!.init?.body)).toContain('"religion"="muslim"');
    expect(String(calls[0]!.init?.body)).toContain("around:5000,51.5074,-0.1278");

    // Nearest-first: East London Mosque (51.51, -0.12) sits closest to LONDON
    // (51.5074, -0.1278), then the untagged node (51.52, -0.11), then Regent's
    // Park's way-center (51.6, -0.3), the furthest of the three.
    expect(places.map((p) => p.id)).toEqual(["osm:node:111", "osm:node:333", "osm:way:222"]);
  });

  it("sends a descriptive User-Agent (Overpass usage-policy courtesy)", async () => {
    const { fn, calls } = fakeFetch({ elements: [] });
    const provider = new OverpassPlacesProvider(DEFAULT_OVERPASS_ENDPOINT, fn);
    await provider.nearbyMosques(LONDON, 1000);
    const headers = calls[0]!.init?.headers as Record<string, string>;
    expect(headers["user-agent"]).toContain("UmmahLibrary");
  });

  it("returns [] when nothing is nearby", async () => {
    const { fn } = fakeFetch({ elements: [] });
    const provider = new OverpassPlacesProvider(DEFAULT_OVERPASS_ENDPOINT, fn);
    expect(await provider.nearbyMosques(LONDON, 500)).toEqual([]);
  });

  it("degrades to [] on a non-OK response rather than throwing", async () => {
    const { fn } = fakeFetch({ error: "rate limited" }, false);
    const provider = new OverpassPlacesProvider(DEFAULT_OVERPASS_ENDPOINT, fn);
    expect(await provider.nearbyMosques(LONDON, 1000)).toEqual([]);
  });

  it("degrades to [] on a malformed 200 body (not an object with elements[])", async () => {
    const { fn } = fakeFetch({ unexpected: true });
    const provider = new OverpassPlacesProvider(DEFAULT_OVERPASS_ENDPOINT, fn);
    expect(await provider.nearbyMosques(LONDON, 1000)).toEqual([]);
  });

  it("propagates a hard network failure (offline) as a rejection", async () => {
    const fn = (() => Promise.reject(new Error("network unreachable"))) as unknown as typeof fetch;
    const provider = new OverpassPlacesProvider(DEFAULT_OVERPASS_ENDPOINT, fn);
    await expect(provider.nearbyMosques(LONDON, 1000)).rejects.toThrow("network unreachable");
  });

  it("uses a custom endpoint when given one", async () => {
    const { fn, calls } = fakeFetch({ elements: [] });
    const provider = new OverpassPlacesProvider("https://overpass.example/api", fn);
    await provider.nearbyMosques(LONDON, 1000);
    expect(calls[0]!.url).toBe("https://overpass.example/api");
  });
});
