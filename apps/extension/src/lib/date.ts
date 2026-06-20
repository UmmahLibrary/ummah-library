import type { GregorianDate } from "@ummahlibrary/core";

/**
 * Today in the device's local timezone, in the two shapes core wants. The date
 * is injectable so these stay testable (core itself never reads the clock).
 */
export function todayISO(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function todayGregorian(now: Date = new Date()): GregorianDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
