/**
 * Web persistence for the "names learned" set in Asmāʾ al-Ḥusnā (ADR 0024) — a
 * map of divine-name index → learned, under `ul.asmaLearned`. Sync (read during
 * render); the `*-store` file is the sanctioned `localStorage` home.
 */
const KEY = "ul.asmaLearned";

export function readLearned(): Record<number, true> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<number, true>) : {};
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
}

/** How many names the reader has marked learned. */
export function countLearned(): number {
  return Object.keys(readLearned()).length;
}
