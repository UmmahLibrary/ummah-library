/**
 * Direct coverage for the persistence primitive every mobile store is built
 * on (ADR 0006/0028) — until now only exercised indirectly through the
 * per-store wrappers in `stores-corrupt.test.ts`, which covers wrong-shape
 * values but not malformed JSON, a throwing AsyncStorage, or the validator
 * predicates' own edge cases. AsyncStorage is mocked in-memory, same pattern
 * as `stores-corrupt.test.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mem, failNextWrite } = vi.hoisted(() => ({
  mem: new Map<string, string>(),
  failNextWrite: { current: false },
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => mem.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      if (failNextWrite.current) {
        failNextWrite.current = false;
        throw new Error("storage full");
      }
      mem.set(k, v);
    },
    removeItem: async (k: string) => {
      mem.delete(k);
    },
  },
}));

import {
  getJSON,
  getString,
  isBoolean,
  isFiniteNumber,
  isObjectRecord,
  isStringArray,
  setJSON,
  setString,
} from "./storage";

beforeEach(() => {
  mem.clear();
  failNextWrite.current = false;
});

describe("getJSON", () => {
  it("returns the fallback when the key is missing", async () => {
    expect(await getJSON("k", "fallback")).toBe("fallback");
  });

  it("returns the fallback on malformed JSON instead of throwing", async () => {
    mem.set("k", "{not json");
    expect(await getJSON("k", "fallback")).toBe("fallback");
  });

  it("returns the parsed value when no validator is given", async () => {
    mem.set("k", JSON.stringify({ a: 1 }));
    expect(await getJSON("k", null)).toEqual({ a: 1 });
  });

  it("returns the fallback when the parsed value fails the validator", async () => {
    mem.set("k", JSON.stringify("not-an-object"));
    expect(await getJSON("k", { fallback: true }, isObjectRecord)).toEqual({ fallback: true });
  });

  it("returns the parsed value when it passes the validator", async () => {
    mem.set("k", JSON.stringify({ x: 1 }));
    expect(await getJSON("k", {}, isObjectRecord)).toEqual({ x: 1 });
  });
});

describe("setJSON", () => {
  it("round-trips through getJSON", async () => {
    await setJSON("k", { a: 1 });
    expect(await getJSON("k", null)).toEqual({ a: 1 });
  });

  it("swallows a storage write failure instead of throwing", async () => {
    failNextWrite.current = true;
    await expect(setJSON("k", { a: 1 })).resolves.toBeUndefined();
  });
});

describe("getString / setString", () => {
  it("returns null when the key is missing", async () => {
    expect(await getString("k")).toBeNull();
  });

  it("round-trips a plain string", async () => {
    await setString("k", "hello");
    expect(await getString("k")).toBe("hello");
  });

  it("setString swallows a storage write failure instead of throwing", async () => {
    failNextWrite.current = true;
    await expect(setString("k", "hello")).resolves.toBeUndefined();
  });
});

describe("validator predicates", () => {
  it("isObjectRecord accepts a plain object, rejects null/array/primitive", () => {
    expect(isObjectRecord({})).toBe(true);
    expect(isObjectRecord({ a: 1 })).toBe(true);
    expect(isObjectRecord(null)).toBe(false);
    expect(isObjectRecord([])).toBe(false);
    expect(isObjectRecord("x")).toBe(false);
    expect(isObjectRecord(42)).toBe(false);
  });

  it("isFiniteNumber accepts finite numbers, rejects NaN/Infinity/non-numbers", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-3.5)).toBe(true);
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
    expect(isFiniteNumber("1")).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
  });

  it("isStringArray accepts a string[], rejects a mixed array/non-array", () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(["a", "b"])).toBe(true);
    expect(isStringArray(["a", 1])).toBe(false);
    expect(isStringArray("a")).toBe(false);
    expect(isStringArray(null)).toBe(false);
  });

  it("isBoolean accepts true/false only", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean("true")).toBe(false);
    expect(isBoolean(null)).toBe(false);
  });
});
