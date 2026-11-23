/**
 * `mobileTasbihStore`'s legacy-shape migration (ADR 0024 adapter, praised
 * as the fix for the "phrase-switch clobbers another phrase's count" bug —
 * see `MOBILE_QA_LOG.md` iteration 3) had no direct test: `stores-corrupt
 * .test.ts` only exercises the genuinely-corrupt-value → null fallback, not
 * the legacy-record → per-phrase migration path itself, or that migration
 * writing back to storage so it only ever runs once per device. AsyncStorage
 * is mocked in-memory, same pattern as `stores-corrupt.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem } = vi.hoisted(() => ({ mem: new Map<string, string>() }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: async (k: string) => {
      mem.delete(k);
    },
  },
}));

import { mobileTasbihStore } from "./tasbih-store";

beforeEach(() => mem.clear());

describe("mobileTasbihStore legacy migration", () => {
  it("converts a pre-per-phrase flat record into the phrases shape", async () => {
    mem.set("ul.tasbih", JSON.stringify({ phraseId: "alhamdulillah", total: 12, target: 33 }));
    const record = await mobileTasbihStore.read();
    expect(record).toEqual({
      phraseId: "alhamdulillah",
      phrases: { alhamdulillah: { total: 12, target: 33 } },
    });
  });

  it("writes the migrated shape back so it only migrates once", async () => {
    mem.set("ul.tasbih", JSON.stringify({ phraseId: "subhanallah", total: 5, target: 33 }));
    await mobileTasbihStore.read();
    // The raw stored value is now the new shape, not the legacy one.
    const stored = JSON.parse(mem.get("ul.tasbih")!);
    expect(stored.phrases).toBeDefined();
    expect(stored.total).toBeUndefined();
  });

  it("does not re-migrate an already-current record", async () => {
    const current = { phraseId: "allahuakbar", phrases: { allahuakbar: { total: 7, target: 33 } } };
    mem.set("ul.tasbih", JSON.stringify(current));
    const record = await mobileTasbihStore.read();
    expect(record).toEqual(current);
  });

  it("returns null for nothing stored", async () => {
    expect(await mobileTasbihStore.read()).toBeNull();
  });

  it("returns null for a value that's neither the legacy nor the current shape", async () => {
    mem.set("ul.tasbih", JSON.stringify({ phraseId: "x" })); // missing total/target/phrases
    expect(await mobileTasbihStore.read()).toBeNull();
  });
});
