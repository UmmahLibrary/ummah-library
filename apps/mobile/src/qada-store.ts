/**
 * Mobile `QadaStore` adapter (ADR 0024, 0030): the missed-prayer backlog in
 * AsyncStorage under `ul.qada` (mirrors the web key so the two clients describe
 * the same local-first state). Persistence only — the maths lives in
 * `@ummahlibrary/core`.
 */
import type { QadaLog, QadaStore } from "@ummahlibrary/core";
import { KEYS, getJSON, isObjectRecord, setJSON } from "./storage";

export const mobileQadaStore: QadaStore = {
  read: () => getJSON<QadaLog>(KEYS.qada, {}, isObjectRecord),
  write: (log) => setJSON(KEYS.qada, log),
};
