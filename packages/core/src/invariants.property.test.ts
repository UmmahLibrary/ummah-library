/**
 * Property-based invariants for the pure core (QA hardening, #25-adjacent).
 *
 * In place of a coverage-guided native fuzzer (no parser binaries here), this
 * drives each algebraic law with a deterministic seeded generator so failures
 * are reproducible: the seed is recorded in `qa/SEEDS.json`. Each property runs
 * many randomized cases and asserts a law that a single example test can't pin —
 * which also kills the surviving mutants the adversarial sweep flagged in
 * hlcCompare/mergeEntries (total order, tie-resolution) and the qibla/zakat math.
 */
import { describe, expect, it } from "vitest";
import {
  type Hlc,
  type SyncEntry,
  encodeHlc,
  hlcCompare,
  mergeEntries,
  parseHlc,
} from "./sync";
import { COMPASS_POINTS, compassPoint, qiblaDirection } from "./qibla";
import { ZAKAT_RATE, calculateZakat, nisabValue } from "./zakat";

/**
 * Base seed (recorded in qa/SEEDS.json). Override with `QA_SEED=<n>` to run a
 * fresh-seed confirmation pass; the value is logged so any failure reproduces.
 */
const SEED = Number(process.env.QA_SEED) || 20260624;
const CASES = 2000;

/** mulberry32 — a tiny deterministic PRNG so every run explores the same cases. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sign = (n: number): number => (n < 0 ? -1 : n > 0 ? 1 : 0);

describe("property: hlcCompare is a strict total order", () => {
  const r = rng(SEED);
  const NODES = ["a", "b", "c", "node-x", "δ"];
  const genHlc = (): Hlc => ({
    millis: Math.floor(r() * 4) * 1000, // small domain → frequent ties on millis
    counter: Math.floor(r() * 3),
    node: NODES[Math.floor(r() * NODES.length)]!,
  });

  it("is reflexive (cmp(a,a) === 0), antisymmetric, and transitive", () => {
    for (let i = 0; i < CASES; i++) {
      const a = genHlc();
      const b = genHlc();
      const c = genHlc();
      // reflexive
      expect(hlcCompare(a, a)).toBe(0);
      // antisymmetric: sign(cmp(a,b)) and sign(cmp(b,a)) are opposites (sum 0).
      expect(sign(hlcCompare(a, b)) + sign(hlcCompare(b, a))).toBe(0);
      // total order ⇒ cmp===0 only when all three fields are equal
      if (hlcCompare(a, b) === 0) {
        expect(a.millis === b.millis && a.counter === b.counter && a.node === b.node).toBe(true);
      }
      // transitive: a<=b and b<=c ⇒ a<=c
      if (hlcCompare(a, b) <= 0 && hlcCompare(b, c) <= 0) {
        expect(hlcCompare(a, c)).toBeLessThanOrEqual(0);
      }
    }
  });
});

describe("property: encodeHlc ∘ parseHlc round-trips", () => {
  const r = rng(SEED ^ 0x1111);
  it("recovers any finite, non-empty-node clock exactly (even a colon in the node)", () => {
    for (let i = 0; i < CASES; i++) {
      const node = ["a", "b:c", "d-e-f", "x".repeat(1 + Math.floor(r() * 5))][
        Math.floor(r() * 4)
      ]!;
      const h: Hlc = {
        millis: Math.floor(r() * 1e13),
        counter: Math.floor(r() * 1000),
        node,
      };
      expect(parseHlc(encodeHlc(h))).toEqual(h);
    }
  });
});

describe("property: mergeEntries converges (order-independent last-writer-wins)", () => {
  const r = rng(SEED ^ 0x2222);
  const NODES = ["a", "b", "c"];
  const IDS = ["k0", "k1", "k2", "k3"];
  const genEntry = (): SyncEntry => {
    const ct = r() < 0.25 ? null : `ct${Math.floor(r() * 1000)}`;
    return {
      id: IDS[Math.floor(r() * IDS.length)]!,
      hlc: {
        millis: Math.floor(r() * 5) * 10,
        counter: Math.floor(r() * 3),
        node: NODES[Math.floor(r() * NODES.length)]!,
      },
      ciphertext: ct,
      nonce: ct === null ? "" : "iv",
    };
  };
  const genSet = (): SyncEntry[] => {
    const out = new Map<string, SyncEntry>();
    const n = Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const e = genEntry();
      out.set(e.id, e); // one entry per id per side (mirrors the real store)
    }
    return [...out.values()];
  };
  /** The winning clock per id by the same total order. */
  const winners = (entries: SyncEntry[]): Map<string, Hlc> => {
    const m = new Map<string, Hlc>();
    for (const e of entries) {
      const cur = m.get(e.id);
      if (!cur || hlcCompare(e.hlc, cur) > 0) m.set(e.id, e.hlc);
    }
    return m;
  };

  it("merged = union of ids, each winning the max clock, regardless of argument order", () => {
    for (let i = 0; i < CASES; i++) {
      const local = genSet();
      const remote = genSet();
      const expected = winners([...local, ...remote]);

      const lr = mergeEntries(local, remote).merged;
      const rl = mergeEntries(remote, local).merged;

      // union of ids
      const ids = new Set([...local, ...remote].map((e) => e.id));
      expect(new Set(lr.map((e) => e.id))).toEqual(ids);
      expect(lr.length).toBe(ids.size); // exactly one winner per id

      // each side's winner carries the max clock, identical both directions
      for (const e of lr) expect(hlcCompare(e.hlc, expected.get(e.id)!)).toBe(0);
      const rlMap = new Map(rl.map((e) => [e.id, e.hlc]));
      for (const e of lr) expect(hlcCompare(e.hlc, rlMap.get(e.id)!)).toBe(0);
    }
  });

  it("is idempotent: merging a set with itself returns that set's winners unchanged", () => {
    for (let i = 0; i < CASES; i++) {
      const s = genSet();
      const m = mergeEntries(s, s).merged;
      expect(new Set(m.map((e) => e.id))).toEqual(new Set(s.map((e) => e.id)));
      // a tie keeps `local`, so identical input ⇒ identical entries by reference identity
      const byId = new Map(s.map((e) => [e.id, e]));
      for (const e of m) expect(e).toBe(byId.get(e.id));
    }
  });
});

describe("property: qibla bearing is always a valid heading", () => {
  const r = rng(SEED ^ 0x3333);
  it("qiblaDirection ∈ [0,360) and compassPoint is always one of the eight labels", () => {
    for (let i = 0; i < CASES; i++) {
      const latitude = r() * 180 - 90;
      const longitude = r() * 360 - 180;
      const b = qiblaDirection({ latitude, longitude });
      expect(Number.isFinite(b)).toBe(true);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
      expect(COMPASS_POINTS).toContain(compassPoint(b));
    }
  });
});

describe("property: zakat is exactly 2.5% above the niṣāb and 0 below", () => {
  const r = rng(SEED ^ 0x4444);
  it("zakatDue is netWealth·rate iff net wealth reaches the niṣāb, and monotonic in wealth", () => {
    for (let i = 0; i < CASES; i++) {
      const cash = Math.floor(r() * 20000);
      const liabilities = Math.floor(r() * 5000);
      const gold = 50 + r() * 50;
      const silver = 0.5 + r() * 0.8;
      const basis = r() < 0.5 ? "gold" : "silver";
      const input = {
        assets: { cash },
        liabilities,
        nisabBasis: basis as "gold" | "silver",
        goldPricePerGram: gold,
        silverPricePerGram: silver,
      };
      const res = calculateZakat(input);
      const nisab = nisabValue(basis as "gold" | "silver", gold, silver);
      expect(res.nisab).toBeCloseTo(nisab, 6);
      if (res.netWealth >= nisab) {
        expect(res.meetsNisab).toBe(true);
        expect(res.zakatDue).toBeCloseTo(res.netWealth * ZAKAT_RATE, 6);
      } else {
        expect(res.meetsNisab).toBe(false);
        expect(res.zakatDue).toBe(0);
      }
      // adding wealth never lowers the amount due
      const more = calculateZakat({ ...input, assets: { cash: cash + 1000 } });
      expect(more.zakatDue).toBeGreaterThanOrEqual(res.zakatDue - 1e-9);
    }
  });
});
