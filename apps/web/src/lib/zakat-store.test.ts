import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readZakat, writeZakat } from "./zakat-store";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("zakat-store", () => {
  it("reads null when nothing is saved", () => {
    expect(readZakat()).toBeNull();
  });

  it("round-trips the saved state", () => {
    writeZakat({ assets: { cash: 1000 }, currency: "USD" });
    expect(readZakat()).toEqual({ assets: { cash: 1000 }, currency: "USD" });
  });

  it("falls back to null on a malformed value", () => {
    localStorage.setItem("ul.zakat", "{nope");
    expect(readZakat()).toBeNull();
  });
});
