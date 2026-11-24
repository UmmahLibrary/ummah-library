import { describe, expect, it, vi } from "vitest";

const nearbyMosques = vi.fn().mockResolvedValue([]);
vi.mock("@ummahlibrary/api", () => ({ placesProvider: { nearbyMosques } }));

const { GET } = await import("./route");

const call = (qs: string) => GET(new Request(`http://x/api/v1/places/nearby?${qs}`));

describe("GET /api/v1/places/nearby", () => {
  it("rejects missing coordinates instead of searching at 0,0", async () => {
    expect((await call("")).status).toBe(400);
    expect((await call("lat=21.4")).status).toBe(400);
    expect((await call("lat=&lng=")).status).toBe(400);
    expect(nearbyMosques).not.toHaveBeenCalled();
  });

  it("uses the documented 5 km default when no radius is given", async () => {
    const res = await call("lat=21.4&lng=39.8");
    expect(res.status).toBe(200);
    expect((await res.json()).radiusMeters).toBe(5000);
    expect(nearbyMosques).toHaveBeenCalledWith({ latitude: 21.4, longitude: 39.8 }, 5000);
  });
});
