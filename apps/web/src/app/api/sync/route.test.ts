import { describe, expect, it } from "vitest";
import { POST } from "./route";

function post(body: unknown, auth?: string): Request {
  return new Request("http://localhost/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

const AUTH = `Bearer ${"a".repeat(64)}`;
const entry = { id: "x", hlc: { millis: 1, counter: 0, node: "n" }, ciphertext: "ct", nonce: "iv" };

describe("POST /api/sync (dev fallback)", () => {
  it("uses an in-memory store outside production and round-trips entries", async () => {
    const res1 = await POST(post({ entries: [entry] }, AUTH));
    expect(res1.status).toBe(200);
    // a second exchange with no local entries pulls the stored one back
    const res2 = await POST(post({ entries: [] }, AUTH));
    const data = (await res2.json()) as { entries: unknown[] };
    expect(data.entries).toHaveLength(1);
  });

  it("rejects a missing account id", async () => {
    expect((await POST(post({ entries: [] }))).status).toBe(401);
  });

  it("rejects a malformed JSON body", async () => {
    const bad = new Request("http://localhost/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: AUTH },
      body: "{nope",
    });
    expect((await POST(bad)).status).toBe(400);
  });
});
