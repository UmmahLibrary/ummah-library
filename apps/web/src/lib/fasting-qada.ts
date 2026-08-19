/**
 * Local-first fasting qaḍāʾ (make-up fasts, #155, ADR 0034). The count *owed* is
 * derived from the ḥayḍ pauses ∩ Ramaḍān (`fastingQadaOwed` in core); only how
 * many have been made up is persisted, through the `FastingQadaStore` port (web
 * adapter `webFastingQadaStore`, ADR 0024). A window event lets the tracker page
 * re-render on change — the established pattern from the prayer/qaḍāʾ trackers.
 */
import type { FastingQadaLog } from "@ummahlibrary/core";
import { webFastingQadaStore as store } from "./fasting-qada-store";

export const FASTING_QADA_EVENT = "ul.fastingQada";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(FASTING_QADA_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readFastingQada(): Promise<FastingQadaLog> {
  return store.read();
}

/**
 * Persist an already-computed log and notify subscribers. The +/- stepper
 * computes `next` from its own in-memory state via `adjustFastingMadeUp`
 * (from `@ummahlibrary/core`) and passes it straight here — reading from the
 * store fresh on every tap would race when taps land faster than the
 * read/write round trip resolves, silently dropping updates.
 */
export async function writeFastingQada(log: FastingQadaLog): Promise<void> {
  await store.write(log);
  emit();
}
