"use client";

import { useEffect } from "react";
import { markActivity, recordMushafPage } from "../lib/reading-goals";

/**
 * Invisible recorder mounted inside readers. Marks reading activity (for the
 * streak) and, when given a Mushaf page, logs it toward the daily goal and the
 * khatma. Renders nothing.
 */
export function ReadingTracker({ page }: { page?: number }) {
  useEffect(() => {
    if (typeof page === "number") recordMushafPage(page);
    else markActivity();
  }, [page]);
  return null;
}
