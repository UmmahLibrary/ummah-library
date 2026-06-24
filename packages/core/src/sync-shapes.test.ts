/**
 * Sync shape registry tests (#25, ADR 0034). The load-bearing properties: explode∘
 * rebuild round-trips, rebuild is deterministically ordered (so a recomposed value
 * is identical across devices), the element envelope is self-describing, and the
 * synthetic-key separator can't collide with any managed key or element id.
 */
import { describe, expect, it } from "vitest";
import { MANAGED_KEYS } from "./sync-keys";
import {
  ELEMENT_SEP,
  INNER_SEP,
  SYNC_SHAPES,
  arrayKeyedShape,
  explodeKey,
  isMapKey,
  nestedRecordShape,
  parseElementKey,
  recordShape,
  setShape,
  shapeOf,
  unwrapElement,
  wrapElement,
} from "./sync-shapes";

describe("recordShape", () => {
  const s = recordShape();
  it("explodes a Record into per-element JSON and rebuilds it (sorted, lossless)", () => {
    const els = s.explode({ b: "x", a: 2 });
    expect(els.get("a")).toBe("2");
    expect(els.get("b")).toBe('"x"');
    expect(s.rebuild(els)).toBe('{"a":2,"b":"x"}'); // deterministic key order
  });
  it("tolerates a wrong-shaped value", () => {
    expect(s.explode(null).size).toBe(0);
    expect(s.explode([1, 2]).size).toBe(0);
    expect(s.explode(42).size).toBe(0);
  });
});

describe("arrayKeyedShape", () => {
  const s = arrayKeyedShape((c) => c.id);
  it("keys array items by a stable field and rebuilds a sorted array", () => {
    const els = s.explode([
      { id: "c2", name: "B" },
      { id: "c1", name: "A" },
    ]);
    expect([...els.keys()].sort()).toEqual(["c1", "c2"]);
    expect(s.rebuild(els)).toBe('[{"id":"c1","name":"A"},{"id":"c2","name":"B"}]');
  });
  it("skips items missing the key field", () => {
    expect(arrayKeyedShape((c) => c.id).explode([{ name: "no id" }]).size).toBe(0);
  });
});

describe("setShape", () => {
  const s = setShape();
  it("treats each member as an element and rebuilds a sorted array", () => {
    const els = s.explode(["rose", "mint"]);
    expect(els.get("mint")).toBe("1");
    expect(s.rebuild(els)).toBe('["mint","rose"]');
  });
  it("drops non-string members", () => {
    expect(setShape().explode(["a", 3, null]).size).toBe(1);
  });
});

describe("nestedRecordShape", () => {
  const s = nestedRecordShape();
  it("explodes Record<outer, Record<inner, V>> into one element per (outer, inner) pair", () => {
    const els = s.explode({ "2026-06-24": { Fajr: "ontime", Dhuhr: "late" }, "2026-06-25": { Fajr: "none" } });
    expect(els.size).toBe(3);
    expect(els.get(`2026-06-24${INNER_SEP}Fajr`)).toBe('"ontime"');
    expect(els.get(`2026-06-25${INNER_SEP}Fajr`)).toBe('"none"');
  });
  it("rebuilds the nested record (round-trip)", () => {
    const whole = { "2026-06-24": { Fajr: "ontime" }, "2026-06-25": { Fajr: "none", Isha: "late" } };
    expect(JSON.parse(s.rebuild(s.explode(whole)))).toEqual(whole);
  });
  it("merging different (date, prayer) elements yields both — the Phase-2 win", () => {
    // device A marked Fajr, device B marked Dhuhr, same day → union, no clobber
    const merged = new Map([
      ...s.explode({ "2026-06-24": { Fajr: "ontime" } }),
      ...s.explode({ "2026-06-24": { Dhuhr: "late" } }),
    ]);
    expect(JSON.parse(s.rebuild(merged))).toEqual({ "2026-06-24": { Dhuhr: "late", Fajr: "ontime" } });
  });
  it("tolerates a wrong-shaped value or non-object inner", () => {
    expect(s.explode(null).size).toBe(0);
    expect(s.explode({ "2026-06-24": "not an object" }).size).toBe(0);
  });
});

describe("element envelope (self-describing payload)", () => {
  it("wraps and unwraps round-trip", () => {
    const wrapped = wrapElement("ul.ayahNotes", "2:255", '"my note"');
    expect(unwrapElement(wrapped)).toEqual({ mk: "ul.ayahNotes", k: "2:255", v: '"my note"' });
  });
  it("returns null for a bare/foreign value (a scalar payload)", () => {
    expect(unwrapElement('"obsidian"')).toBeNull();
    expect(unwrapElement("not json")).toBeNull();
    expect(unwrapElement(JSON.stringify({ mk: 1, k: "x", v: "y" }))).toBeNull();
  });
});

describe("synthetic keys", () => {
  it("explode/parse round-trip", () => {
    const syn = explodeKey("ul.ayahNotes", "2:255");
    expect(parseElementKey(syn)).toEqual({ mapKey: "ul.ayahNotes", id: "2:255" });
  });
  it("returns null for a plain scalar key (no separator)", () => {
    expect(parseElementKey("ul.theme")).toBeNull();
  });
  it("splits on the FIRST separator so element ids may contain colons/dashes", () => {
    expect(parseElementKey(explodeKey("ul.haid", "2026-06-24"))).toEqual({
      mapKey: "ul.haid",
      id: "2026-06-24",
    });
  });
});

describe("registry invariants", () => {
  it("the separator is a single control char that can't appear in keys or ids", () => {
    expect(ELEMENT_SEP).toHaveLength(1);
    expect(ELEMENT_SEP.charCodeAt(0)).toBe(0); // NUL
    for (const key of Object.keys(SYNC_SHAPES)) expect(key).not.toContain(ELEMENT_SEP);
    for (const key of MANAGED_KEYS) expect(key).not.toContain(ELEMENT_SEP);
  });
  it("every map key is also a managed key (so it actually syncs)", () => {
    for (const key of Object.keys(SYNC_SHAPES)) expect(MANAGED_KEYS).toContain(key);
  });
  it("classifies known keys", () => {
    expect(isMapKey("ul.ayahNotes")).toBe(true);
    expect(isMapKey("ul.collections")).toBe(true);
    expect(shapeOf("ul.theme").kind).toBe("scalar");
    expect(shapeOf("ul.hifz").kind).toBe("scalar"); // Phase 3 — not yet a map
  });
});
