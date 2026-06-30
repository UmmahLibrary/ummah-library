import { describe, expect, it } from "vitest";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
  ZAKAT_ASSET_CATEGORIES,
  ZAKAT_RATE,
  calculateZakat,
  nisabValue,
  sumValues,
} from "./zakat";

// Representative per-gram prices (currency-agnostic) for the tests.
const GOLD = 75; // → gold niṣāb 6561
const SILVER = 0.85; // → silver niṣāb ~520.5

describe("nisabValue", () => {
  it("uses the gold weight for the gold basis", () => {
    expect(nisabValue("gold", GOLD, SILVER)).toBeCloseTo(NISAB_GOLD_GRAMS * GOLD, 6);
  });
  it("uses the silver weight for the silver basis", () => {
    expect(nisabValue("silver", GOLD, SILVER)).toBeCloseTo(NISAB_SILVER_GRAMS * SILVER, 6);
  });
  it("silver niṣāb is the lower threshold", () => {
    expect(nisabValue("silver", GOLD, SILVER)).toBeLessThan(nisabValue("gold", GOLD, SILVER));
  });
});

describe("sumValues", () => {
  it("adds finite positive amounts and ignores junk", () => {
    expect(sumValues({ a: 100, b: 50, c: 0, d: -10, e: Number.NaN })).toBe(150);
  });
});

describe("calculateZakat", () => {
  const base = { goldPricePerGram: GOLD, silverPricePerGram: SILVER, liabilities: 0 } as const;

  it("charges 2.5% when net wealth meets the niṣāb", () => {
    const r = calculateZakat({ ...base, assets: { cash: 10000 }, nisabBasis: "silver" });
    expect(r.meetsNisab).toBe(true);
    expect(r.zakatDue).toBeCloseTo(10000 * ZAKAT_RATE, 6);
    expect(r.zakatDue).toBeCloseTo(250, 6);
  });

  it("charges nothing below the niṣāb", () => {
    const r = calculateZakat({ ...base, assets: { cash: 100 }, nisabBasis: "silver" });
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  it("zakat is due when wealth exactly reaches the niṣāb (inclusive boundary, >=)", () => {
    // Doctrinally load-bearing: zakat is owed once wealth *reaches* the niṣāb, so
    // the boundary is inclusive. Pins `>=` against a `>` regression.
    const nisab = nisabValue("silver", GOLD, SILVER);
    const at = calculateZakat({ ...base, assets: { cash: nisab }, nisabBasis: "silver" });
    expect(at.netWealth).toBe(nisab);
    expect(at.meetsNisab).toBe(true);
    expect(at.zakatDue).toBeCloseTo(nisab * ZAKAT_RATE, 6);
    // A hair below the niṣāb is exempt.
    const below = calculateZakat({ ...base, assets: { cash: nisab - 0.01 }, nisabBasis: "silver" });
    expect(below.meetsNisab).toBe(false);
    expect(below.zakatDue).toBe(0);
  });

  it("deducts liabilities before testing the niṣāb", () => {
    const r = calculateZakat({
      ...base,
      liabilities: 9900,
      assets: { cash: 10000 },
      nisabBasis: "silver",
    });
    expect(r.netWealth).toBe(100);
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  it("clamps a negative or non-finite liability to zero (never inflates net wealth)", () => {
    // A negative liability is bad input; subtracting it would *add* phantom wealth.
    const neg = calculateZakat({
      ...base,
      liabilities: -5000,
      assets: { cash: 1000 },
      nisabBasis: "silver",
    });
    expect(neg.netWealth).toBe(1000); // not 6000
    expect(neg.zakatDue).toBeCloseTo(25, 6);
    // A NaN liability (e.g. an unparsed field) is treated as zero, not propagated.
    const nan = calculateZakat({
      ...base,
      liabilities: Number.NaN,
      assets: { cash: 1000 },
      nisabBasis: "silver",
    });
    expect(nan.netWealth).toBe(1000);
    expect(nan.meetsNisab).toBe(true);
  });

  it("charges nothing when the niṣāb basis price is zero (missing market data)", () => {
    // With no gold price the gold niṣāb is 0; net wealth must not be treated as
    // "meeting" a zero threshold and charged zakat on everything.
    const r = calculateZakat({
      assets: { cash: 100000 },
      liabilities: 0,
      nisabBasis: "gold",
      goldPricePerGram: 0,
      silverPricePerGram: SILVER,
    });
    expect(r.nisab).toBe(0);
    expect(r.meetsNisab).toBe(false);
    expect(r.zakatDue).toBe(0);
  });

  it("the niṣāb basis flips the outcome for wealth between the thresholds", () => {
    // ~520 (silver) < 4000 < 6561 (gold): due under silver, exempt under gold.
    const assets = { cash: 4000 };
    expect(calculateZakat({ ...base, assets, nisabBasis: "silver" }).meetsNisab).toBe(true);
    expect(calculateZakat({ ...base, assets, nisabBasis: "gold" }).meetsNisab).toBe(false);
  });

  it("sums across every asset category", () => {
    const r = calculateZakat({
      ...base,
      assets: { cash: 2000, gold: 3000, silver: 500, investments: 1000, business: 500, receivables: 0 },
      nisabBasis: "silver",
    });
    expect(r.totalAssets).toBe(7000);
    expect(r.zakatDue).toBeCloseTo(175, 6);
  });

  it("exposes the six standard asset categories with stable ids and non-empty copy", () => {
    // Pins the category table's *shape* (ids the UI keys on, presence of copy)
    // without hard-coding the exact prose — kills empty-literal/`{}` regressions.
    expect(ZAKAT_ASSET_CATEGORIES.map((c) => c.id)).toEqual([
      "cash",
      "gold",
      "silver",
      "investments",
      "business",
      "receivables",
    ]);
    for (const c of ZAKAT_ASSET_CATEGORIES) {
      expect(c.id.length).toBeGreaterThan(0);
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.hint.length).toBeGreaterThan(0);
    }
  });
});
