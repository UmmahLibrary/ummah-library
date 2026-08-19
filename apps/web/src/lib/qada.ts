/**
 * Local-first qaḍāʾ (missed-prayer) backlog (ADR 0006, 0030): how many of each
 * obligatory prayer you owe and are making up. Persistence goes through the
 * `QadaStore` port (web adapter `webQadaStore`, ADR 0024); the maths lives in
 * `@ummahlibrary/core`. A window event lets the tracker page re-render on change
 * — the established pattern from the prayer tracker.
 */
import type { QadaLog } from "@ummahlibrary/core";
import { webQadaStore as store } from "./qada-store";

export const QADA_EVENT = "ul.qada";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(QADA_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readQada(): Promise<QadaLog> {
  return store.read();
}

/**
 * Persist an already-computed backlog and notify subscribers. Callers that
 * mutate on every tap (the +/- steppers) compute `next` from their own
 * in-memory state via `adjustQada`/`setQada` (from `@ummahlibrary/core`) and
 * pass it straight here — routing every tap through a fresh `store.read()`
 * first would race when taps land faster than the read/write round trip
 * resolves, silently dropping updates.
 */
export async function writeQada(log: QadaLog): Promise<void> {
  await store.write(log);
  emit();
}
