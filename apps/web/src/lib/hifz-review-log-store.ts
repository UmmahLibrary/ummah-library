/**
 * Web persistence for the hifz review-activity log (ADR 0024), under
 * `ul.hifz.reviewLog`: a `YYYY-MM-DD` → review-count map that powers the
 * dashboard heatmap and streaks. Sync; the `*-store` file is the sanctioned
 * `localStorage` home. The pure log/heatmap/streak logic lives in
 * `@ummahlibrary/core` (`hifz-analytics`). Like the hifz cards themselves this
 * key is held back from cross-device sync pending element-level merge.
 */
import { type HifzActivityLog, logReview } from "@ummahlibrary/core";

const KEY = "ul.hifz.reviewLog";

export function readReviewLog(): HifzActivityLog {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    // A corrupt/peer-synced null/array/scalar would break the heatmap consumers.
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as HifzActivityLog) : {};
  } catch {
    return {};
  }
}

export function writeReviewLog(log: HifzActivityLog): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Record one completed review at `now`, persisting the updated log. */
export function recordReview(now = new Date()): void {
  writeReviewLog(logReview(readReviewLog(), now));
}
