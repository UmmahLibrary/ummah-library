/**
 * Local-first ḥayḍ (menstruation) pause (ADR 0006, 0031): the date ranges during
 * which prayer tracking is paused. Persistence goes through the `HaidStore` port
 * (web adapter `webHaidStore`, ADR 0024); the pause maths lives in
 * `@ummahlibrary/core`. A window event lets the tracker page re-render on change
 * — the established pattern from the prayer/qaḍāʾ trackers.
 */
import { type HaidLog, togglePauseToday } from "@ummahlibrary/core";
import { webHaidStore as store } from "./haid-store";

export const HAID_EVENT = "ul.haid";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(HAID_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readHaid(): Promise<HaidLog> {
  return store.read();
}

/** Start a pause today, or end the ongoing one, and persist. */
export async function togglePause(today: string): Promise<HaidLog> {
  const next = togglePauseToday(await store.read(), today);
  await store.write(next);
  emit();
  return next;
}
