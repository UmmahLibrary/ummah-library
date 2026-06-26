/**
 * Tap-a-word-to-hear (#145): a reader toggle that turns each Arabic word into a
 * tap target — tapping seeks the verse audio to that word's timing segment and
 * plays just that word. The audio + segments are the same quran.com word timings
 * the reciting highlight already uses; this only adds the tap seam.
 *
 * The flag persists through the `SettingsStore` port and toggles a body class the
 * audio player reads to decide whether a word tap should play that word.
 */
import { webSettingsStore as store } from "./settings-store";

/** Window event broadcast when the tap-to-hear toggle changes. */
export const TAP_HEAR_KEY = "ul.tapToHear";

/** Body class the audio player checks before treating a word tap as "play word". */
export const TAP_HEAR_CLASS = "tap-hear-on";

export async function readTapToHear(): Promise<boolean> {
  return (await store.read()).tapToHear ?? false;
}

export async function writeTapToHear(on: boolean): Promise<void> {
  await store.writeTapToHear(on);
  window.dispatchEvent(new CustomEvent(TAP_HEAR_KEY, { detail: on }));
}
