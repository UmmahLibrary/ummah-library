/**
 * Mobile `FastingQadaStore` adapter (ADR 0024, 0034): the fasting-qaḍāʾ made-up
 * count in AsyncStorage under `ul.fastingQada` (mirrors the web key so the two
 * clients describe the same local-first state). Persistence only — the maths
 * lives in `@ummahlibrary/core`.
 */
import type { FastingQadaLog, FastingQadaStore } from "@ummahlibrary/core";
import { KEYS, getJSON, setJSON } from "./storage";

const isLog = (v: unknown): boolean =>
  v !== null && typeof v === "object" && typeof (v as FastingQadaLog).madeUp === "number";

export const mobileFastingQadaStore: FastingQadaStore = {
  read: () => getJSON<FastingQadaLog>(KEYS.fastingQada, { madeUp: 0 }, isLog),
  write: (log) => setJSON(KEYS.fastingQada, log),
};
