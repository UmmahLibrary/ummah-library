/**
 * At-rest secret vault tests (#25, ADR 0033 §5). `fake-indexeddb` stands in for
 * the browser's IndexedDB (jsdom doesn't implement it) so the non-extractable
 * wrap key round-trips exactly as it would in the popup's real page context.
 */
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { isWrappedSecret, unwrapSecret, wrapSecret } from "./secret-vault-store";

describe("isWrappedSecret", () => {
  it("recognizes the wrapped-blob shape and rejects everything else", () => {
    expect(isWrappedSecret("v1:aGVsbG8=:d29ybGQ=")).toBe(true);
    expect(isWrappedSecret("correct horse battery staple")).toBe(false);
    expect(isWrappedSecret("MBTQ7-K9XAR-2P4WD-NHJ58-VYZ36")).toBe(false);
  });
});

describe("wrapSecret / unwrapSecret", () => {
  it("round-trips a secret through the wrap", async () => {
    const wrapped = await wrapSecret("correct horse battery staple");
    expect(isWrappedSecret(wrapped)).toBe(true);
    expect(await unwrapSecret(wrapped)).toBe("correct horse battery staple");
  });

  it("returns null for a corrupted or foreign blob", async () => {
    const wrapped = await wrapSecret("correct horse battery staple");
    const tampered = wrapped.slice(0, -4) + "AAAA";
    expect(await unwrapSecret(tampered)).toBeNull();
    expect(await unwrapSecret("not a wrapped blob")).toBeNull();
  });
});
