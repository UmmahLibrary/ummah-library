/**
 * Local-first qaḍāʾ (missed-prayer) backlog (ADR 0006, 0030): how many of each
 * obligatory prayer you owe and are making up. Persistence goes through the
 * `QadaStore` port (web adapter `webQadaStore`, ADR 0024); the maths lives in
 * `@ummahlibrary/core`. A window event lets the tracker page re-render on change
 * — the established pattern from the prayer tracker.
 */
import { type PrayerName, type QadaLog, adjustQada, setQada } from "@ummahlibrary/core";
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

/** Adjust a prayer's backlog by `delta` (clamped at zero) and persist. */
export async function adjustQadaCount(prayer: PrayerName, delta: number): Promise<QadaLog> {
  const next = adjustQada(await store.read(), prayer, delta);
  await store.write(next);
  emit();
  return next;
}

/** Set a prayer's backlog to an explicit count and persist. */
export async function setQadaCount(prayer: PrayerName, count: number): Promise<QadaLog> {
  const next = setQada(await store.read(), prayer, count);
  await store.write(next);
  emit();
  return next;
}
