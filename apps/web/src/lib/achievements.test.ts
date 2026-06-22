import { afterEach, describe, expect, it } from "vitest";
import { acknowledge, readAcknowledged } from "./achievements";

afterEach(() => localStorage.clear());

describe("achievements store (web)", () => {
  it("starts with nothing acknowledged", async () => {
    expect(await readAcknowledged()).toEqual([]);
  });

  it("persists acknowledged badge ids across reads", async () => {
    await acknowledge(["first-ayah", "streak-7"]);
    expect(await readAcknowledged()).toEqual(["first-ayah", "streak-7"]);
    expect(JSON.parse(localStorage.getItem("ul.badges") ?? "[]")).toContain("streak-7");
  });

  it("falls back to empty when stored JSON is corrupt", async () => {
    localStorage.setItem("ul.badges", "[not json");
    expect(await readAcknowledged()).toEqual([]);
  });
});
