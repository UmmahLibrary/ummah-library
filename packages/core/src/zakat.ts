/**
 * Zakat al-māl — the agreed Sunni calculation for *monetary* wealth, pure and
 * deterministic in `core` (see docs/adr/0015-zakat.md). The mechanics encoded
 * here are settled across the four Sunni schools: 2.5% of net zakatable wealth
 * once it has been above the niṣāb for a lunar year.
 *
 * The one genuine choice-point — the gold vs. silver niṣāb basis — is a
 * parameter, not a baked-in position (the UI lets the user choose). Contested
 * or separate matters (agricultural produce, livestock, Shia khums) are
 * deliberately OUT of scope and must not be inferred from this module.
 */

/** The zakat rate on monetary wealth: one fortieth. */
export const ZAKAT_RATE = 0.025;

/** Niṣāb weights set in the Sunnah: 20 mithqāl of gold, 200 dirhams of silver. */
export const NISAB_GOLD_GRAMS = 87.48;
export const NISAB_SILVER_GRAMS = 612.36;

/** Which metal's value sets the niṣāb threshold. */
export type NisabBasis = "gold" | "silver";

export interface ZakatAssetCategory {
  id: string;
  label: string;
  hint: string;
}

/** The categories of zakatable monetary wealth the four Sunni schools agree on. */
export const ZAKAT_ASSET_CATEGORIES: readonly ZakatAssetCategory[] = [
  { id: "cash", label: "Cash & bank balances", hint: "Money in hand and in current/savings accounts" },
  { id: "gold", label: "Gold", hint: "Current market value of the gold you own" },
  { id: "silver", label: "Silver", hint: "Current market value of the silver you own" },
  {
    id: "investments",
    label: "Investments",
    hint: "Market value of shares, funds and crypto held for growth",
  },
  {
    id: "business",
    label: "Business assets",
    hint: "Stock-in-trade and raw materials at current value",
  },
  { id: "receivables", label: "Money owed to you", hint: "Loans and debts you expect to be repaid" },
];

/** A map of category id → amount (in the user's own currency). */
export type ZakatValues = Readonly<Record<string, number>>;

export interface ZakatInput {
  assets: ZakatValues;
  /** Immediate debts and bills due now, deductible from zakatable wealth. */
  liabilities: number;
  nisabBasis: NisabBasis;
  goldPricePerGram: number;
  silverPricePerGram: number;
}

export interface ZakatResult {
  totalAssets: number;
  /** Total assets minus liabilities (may be negative). */
  netWealth: number;
  /** The niṣāb threshold value for the chosen basis. */
  nisab: number;
  /** Whether net wealth reaches the niṣāb (and so zakat is due). */
  meetsNisab: boolean;
  /** Zakat payable: 2.5% of net wealth when the niṣāb is met, otherwise 0. */
  zakatDue: number;
}

/** Sum the (finite, non-negative) amounts in a values map. */
export function sumValues(values: ZakatValues): number {
  let total = 0;
  for (const v of Object.values(values)) {
    if (Number.isFinite(v) && v > 0) total += v;
  }
  return total;
}

/** The niṣāb threshold value for a basis, given current per-gram metal prices. */
export function nisabValue(
  basis: NisabBasis,
  goldPricePerGram: number,
  silverPricePerGram: number,
): number {
  return basis === "gold"
    ? NISAB_GOLD_GRAMS * goldPricePerGram
    : NISAB_SILVER_GRAMS * silverPricePerGram;
}

/** Compute zakat due on monetary wealth. Pure: rounding/formatting is the caller's job. */
export function calculateZakat(input: ZakatInput): ZakatResult {
  const totalAssets = sumValues(input.assets);
  const liabilities = Number.isFinite(input.liabilities) && input.liabilities > 0 ? input.liabilities : 0;
  const netWealth = totalAssets - liabilities;
  const nisab = nisabValue(input.nisabBasis, input.goldPricePerGram, input.silverPricePerGram);
  const meetsNisab = nisab > 0 && netWealth >= nisab;
  return {
    totalAssets,
    netWealth,
    nisab,
    meetsNisab,
    zakatDue: meetsNisab ? netWealth * ZAKAT_RATE : 0,
  };
}
