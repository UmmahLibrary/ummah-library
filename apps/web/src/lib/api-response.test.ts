import { describe, expect, it } from "vitest";
import { apiJson } from "./api-response";

describe("apiJson", () => {
  it("returns JSON with open CORS + cache headers", async () => {
    const res = apiJson({ ok: true });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toContain("max-age=3600");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("merges caller init (status + extra headers)", async () => {
    const res = apiJson({ x: 1 }, { status: 201, headers: { "x-test": "y" } });
    expect(res.status).toBe(201);
    expect(res.headers.get("x-test")).toBe("y");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});
