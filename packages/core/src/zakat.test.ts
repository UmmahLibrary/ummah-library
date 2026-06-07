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

  it("exposes six standard asset categories", () => {
    expect(ZAKAT_ASSET_CATEGORIES).toHaveLength(6);
    expect(ZAKAT_ASSET_CATEGORIES.map((c) => c.id)).toContain("business");
  });
});
