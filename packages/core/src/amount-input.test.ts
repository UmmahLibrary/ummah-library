import { describe, expect, it } from "vitest";
import { parseAmount, sanitizeAmountInput } from "./amount-input";

describe("sanitizeAmountInput", () => {
  it("keeps Arabic-Indic and Persian digits instead of wiping them", () => {
    expect(sanitizeAmountInput("١٠٠٠٠")).toBe("10000");
    expect(sanitizeAmountInput("۲۵۰٫۵")).toBe("250.5");
  });
  it("drops minus signs, letters and spaces", () => {
    expect(sanitizeAmountInput("-5")).toBe("5");
    expect(sanitizeAmountInput("10 000 AED")).toBe("10000");
  });
});

describe("parseAmount", () => {
  it.each([
    ["10000", 10000],
    ["10,000", 10000],
    ["1,000,000", 1000000],
    ["10000.50", 10000.5],
    ["1,000.50", 1000.5],
    ["1.000,50", 1000.5],
    ["10,5", 10.5],
    ["10,50", 10.5],
    ["1.500.000", 1500000],
    ["500.000", 500000], // Indonesian/Turkish thousands
    ["1.250", 1250],
    ["12.5", 12.5],
    ["0.85", 0.85],
    ["1234.567", 1234.567],
    ["١٠٬٠٠٠٫٥", 10000.5],
    ["", 0],
    ["abc", 0],
    [".", 0],
  ])("%s → %d", (raw, n) => {
    expect(parseAmount(raw)).toBe(n);
  });
});
