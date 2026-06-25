/**
 * Local-first fasting qaḍāʾ (make-up fasts, #155, ADR 0034). The count *owed* is
 * derived from the ḥayḍ pauses ∩ Ramaḍān (`fastingQadaOwed` in core); only how
 * many have been made up is persisted, through the `FastingQadaStore` port (web
 * adapter `webFastingQadaStore`, ADR 0024). A window event lets the tracker page
 * re-render on change — the established pattern from the prayer/qaḍāʾ trackers.
 */
import { type FastingQadaLog, adjustFastingMadeUp } from "@ummahlibrary/core";
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

/** Make up one fast (`+1`) or undo (`-1`), clamped to `[0, owed]`, and persist. */
export async function adjustFastingMadeUpCount(delta: number, owed: number): Promise<FastingQadaLog> {
  const next = adjustFastingMadeUp(await store.read(), delta, owed);
  await store.write(next);
  emit();
  return next;
}
