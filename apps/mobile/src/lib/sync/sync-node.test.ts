/**
 * Mobile sync-node tests (#25, ADR 0033): one stable device id, generated once and
 * persisted so the HLC tiebreaker is consistent across launches.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => void mem.set(k, v),
  },
}));
let issued = 0;
vi.mock("./crypto-random", () => ({ randomId: () => `node-${++issued}`, randomBytes: () => new Uint8Array(0) }));

import { getNodeId } from "./sync-node";

beforeEach(() => {
  mem.clear();
  issued = 0;
});

describe("getNodeId", () => {
  it("generates, persists, and then re-reads the same id", async () => {
    const first = await getNodeId();
    expect(first).toBe("node-1");
    expect(mem.get("ul.sync.node")).toBe("node-1");
    expect(await getNodeId()).toBe("node-1"); // stable — no new id minted
    expect(issued).toBe(1);
  });
});
