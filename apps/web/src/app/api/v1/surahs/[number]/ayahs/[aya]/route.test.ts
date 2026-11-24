import { describe, expect, it } from "vitest";
import { GET } from "./route";

const call = (aya: string, qs = "") =>
  GET(new Request(`http://x/api/v1/surahs/2/ayahs/${aya}${qs}`), {
    params: Promise.resolve({ number: "2", aya }),
  });

describe("GET /api/v1/surahs/{n}/ayahs/{a}", () => {
  it("returns the Arabic, with a translation from a bundled edition", async () => {
    const res = await call("255", "?edition=eng-khattab");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ayah.aya).toBe(255);
    expect(body.translation?.text.length).toBeGreaterThan(10);
  });

  it("404s an unknown edition instead of a silent null translation", async () => {
    const res = await call("255", "?edition=bogus");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "translation_not_found" });
  });
});
