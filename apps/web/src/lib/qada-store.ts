/**
 * Web `QadaStore` adapter (ADR 0024, 0030): the missed-prayer backlog in
 * `localStorage` under `ul.qada`. Persistence only — the maths lives in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors mobile.
 */
import type { QadaLog, QadaStore } from "@ummahlibrary/core";

const KEY = "ul.qada";

export const webQadaStore: QadaStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      // A corrupt/peer-synced non-object would crash the core qada maths (Object.entries / indexing).
      const v = JSON.parse(raw) as unknown;
      return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as QadaLog) : {};
    } catch {
      return {};
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
