/**
 * Local-first store for the first-run onboarding flag (ADR 0024). The read side
 * happens pre-paint in the inline script in `layout.tsx` (which sets
 * `data-onboard`); this only persists that the intro has been seen.
 */

const KEY = "ul.onboarded";

/** Record that the user has completed (or skipped) the first-run intro. */
export function markOnboarded(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode / storage disabled — dismiss for this session only */
  }
}
