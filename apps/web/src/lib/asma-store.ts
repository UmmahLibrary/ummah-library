/**
 * Web persistence for the "names learned" set in Asmāʾ al-Ḥusnā (ADR 0024) — a
 * map of divine-name index → learned, under `ul.asmaLearned`. Sync (read during
 * render); the `*-store` file is the sanctioned `localStorage` home.
 */
const KEY = "ul.asmaLearned";

/** Fired whenever the learned set changes, so open views can re-read live (e.g. a sync-applied change). */
export const ASMA_EVENT = "ul.asmaLearned";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(ASMA_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readLearned(): Record<number, true> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    // countLearned does Object.keys(...), which throws on a non-object value.
    const v = JSON.parse(raw) as unknown;
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<number, true>) : {};
  } catch {
    return {};
  }
}

export function writeLearned(learned: Record<number, true>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(learned));
  } catch {
    /* storage unavailable */
  }
  emit();
}

/** How many names the reader has marked learned. */
export function countLearned(): number {
  return Object.keys(readLearned()).length;
}
