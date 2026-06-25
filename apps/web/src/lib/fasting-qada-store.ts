/**
 * Web `FastingQadaStore` adapter (ADR 0024, 0034): the fasting-qaḍāʾ made-up
 * count in `localStorage` under `ul.fastingQada`. Persistence only — the maths
 * lives in `@ummahlibrary/core` — so a synced adapter (#25) can replace it
 * without touching the feature. Mirrors mobile.
 */
import type { FastingQadaLog, FastingQadaStore } from "@ummahlibrary/core";

const KEY = "ul.fastingQada";

/** A `{ madeUp: number }` record — guards a corrupt/peer-synced value. */
function parse(raw: string | null): FastingQadaLog {
  if (!raw) return { madeUp: 0 };
  try {
    const v = JSON.parse(raw) as unknown;
    if (v !== null && typeof v === "object" && typeof (v as FastingQadaLog).madeUp === "number") {
      return { madeUp: (v as FastingQadaLog).madeUp };
    }
  } catch {
    /* fall through to default */
  }
  return { madeUp: 0 };
}

export const webFastingQadaStore: FastingQadaStore = {
  read: async () => {
    try {
      return parse(localStorage.getItem(KEY));
    } catch {
      return { madeUp: 0 };
    }
  },
  write: async (log) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(log));
    } catch {
      /* storage unavailable */
    }
  },
};
