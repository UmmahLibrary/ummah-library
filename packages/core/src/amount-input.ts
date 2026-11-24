/**
 * Money amounts as people type them, in every interface language: Western or
 * Arabic-Indic / Persian digits, `1,000.50` or `1.000,50`, the Arabic decimal
 * separator `٫`. Pure; used by the zakat calculators on web and mobile.
 */
import { toWesternDigits } from "./goto";

/**
 * What a field may hold while typing: digits plus `.` and `,` (no minus — wealth
 * can't be negative). Arabic-Indic digits and `٫`/`٬` become `0-9`/`.`/`,`, so an
 * Arabic or Urdu keyboard isn't silently wiped.
 */
export function sanitizeAmountInput(raw: string): string {
  return toWesternDigits(raw)
    .replace(/٫/g, ".") // ٫ Arabic decimal separator
    .replace(/٬/g, ",") // ٬ Arabic thousands separator
    .replace(/[^0-9.,]/g, "");
}

/**
 * The number a typed amount means (0 when blank/unreadable). The decimal
 * separator is whichever of `.`/`,` comes last when both appear
 * (`1,000.50`, `1.000,50`); a lone `,` with one or two digits after it is a
 * decimal comma (`10,5` in Turkish or Indonesian), otherwise commas group
 * thousands (`10,000`); dots group thousands the same way (`1.500.000`, and a
 * lone dot before exactly three digits: `500.000`). Amounts in three-decimal
 * currencies (KWD 1.250) are therefore read as thousands — the rarer case.
 */
export function parseAmount(raw: string): number {
  let s = sanitizeAmountInput(raw);
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? "." : ",";
    const group = decimal === "." ? "," : ".";
    s = s.split(group).join("").replace(decimal, ".");
  } else if (lastComma !== -1) {
    const commas = s.split(",").length - 1;
    const after = s.length - lastComma - 1;
    s = commas === 1 && after >= 1 && after <= 2 ? s.replace(",", ".") : s.split(",").join("");
  } else if (lastDot !== -1 && (s.split(".").length > 2 || /^\d{1,3}\.\d{3}$/.test(s))) {
    // "1.500.000", and a lone dot before exactly three digits ("500.000",
    // "1.250") — how Indonesian and Turkish write thousands; money is never
    // written to three decimals in those currencies. (A lone comma already
    // follows the same rule.)
    s = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.split(".").join("") : s;
  }
  // At most one decimal point survives; anything after a second is dropped.
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
