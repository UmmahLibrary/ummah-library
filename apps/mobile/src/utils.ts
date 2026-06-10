/** Pure utility functions shared across mobile screens. All are deterministic and unit-tested. */

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD. Prayer times and goals are a local-time concept. */
export function localISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local date as YYYY-MM-DD. Named for clarity in adhkar contexts (tallies reset each local day). */
export function adhkarToday(d = new Date()): string {
  return localISODate(d);
}

/** Format an ISO timestamp or Date as a short locale time (e.g. "5:32 AM"). */
export function fmtTime(src: string | Date): string {
  const d = typeof src === "string" ? new Date(src) : src;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Human-readable countdown: "2h 15m" or "8m". Returns "0m" when target is past. */
export function fmtCountdown(target: Date, now: Date): string {
  const secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs - h * 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * JS weekday (0 = Sunday) for a Gregorian civil date, computed via UTC
 * to avoid DST drift at local midnight.
 */
export function weekdayOfGregorian(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
