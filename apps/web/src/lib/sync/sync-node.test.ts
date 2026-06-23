import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getNodeId } from "./sync-node";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("getNodeId", () => {
  it("generates and persists a stable id", () => {
    const id = getNodeId();
    expect(id).toBeTruthy();
    expect(getNodeId()).toBe(id); // stable across calls
    expect(localStorage.getItem("ul.sync.node")).toBe(id);
  });

  it("reuses an existing id", () => {
    localStorage.setItem("ul.sync.node", "fixed-id");
    expect(getNodeId()).toBe("fixed-id");
  });
});
