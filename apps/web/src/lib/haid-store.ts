/**
 * Web `HaidStore` adapter (ADR 0024, 0031): the ḥayḍ pause ranges in
 * `localStorage` under `ul.haid`. Persistence only — the pause maths lives in
 * `@ummahlibrary/core` — so a synced adapter (#25) can replace it without
 * touching the feature. Mirrors mobile.
 */
import type { HaidLog, HaidStore } from "@ummahlibrary/core";

const KEY = "ul.haid";

export const webHaidStore: HaidStore = {
  read: async () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      // A corrupt/peer-synced non-array would crash the pause maths (.some/.find/.map/.sort).
      const v = JSON.parse(raw) as unknown;
      return Array.isArray(v) ? (v as HaidLog) : [];
    } catch {
      return [];
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
