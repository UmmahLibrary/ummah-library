/**
 * Mobile `HaidStore` adapter (ADR 0024, 0031): the ḥayḍ pause ranges in
 * AsyncStorage under `ul.haid` (mirrors the web key so the two clients describe
 * the same local-first state). Persistence only — the pause maths lives in
 * `@ummahlibrary/core`.
 */
import type { HaidLog, HaidStore } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

export const mobileHaidStore: HaidStore = {
  read: () => getJSON<HaidLog>(KEYS.haid, [], Array.isArray),
  write: (log) => setJSON(KEYS.haid, log),
};
