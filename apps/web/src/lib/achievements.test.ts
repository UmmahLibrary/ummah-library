import { afterEach, describe, expect, it, vi } from "vitest";
import { BADGES_EVENT, acknowledge, readAcknowledged } from "./achievements";

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

  it("fires BADGES_EVENT on acknowledge, so open views can re-read live (e.g. a synced change)", async () => {
    const onChange = vi.fn();
    window.addEventListener(BADGES_EVENT, onChange);
    await acknowledge(["first-ayah"]);
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener(BADGES_EVENT, onChange);
  });
});
