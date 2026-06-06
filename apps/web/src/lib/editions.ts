/**
 * Shared translation-edition selection: the localStorage-backed set of editions
 * the reader currently shows, plus the DOM helper that toggles their visibility.
 *
 * All ingested editions are rendered into every page; selecting an edition just
 * shows/hides its `[data-edition]` blocks via the `.tr--off` class. Both the
 * compact reader controls and the full "manage translations" modal read and
 * write this one source of truth so they stay in sync.
 */
import type { Translation } from "@ummahlibrary/core";

/** The edition fields the reader UI needs (a view over `Translation`). */
export type EditionChoice = Pick<
  Translation,
  "id" | "name" | "author" | "language" | "direction"
>;

export const EDITIONS_KEY = "ul.editions";
export const DEFAULT_EDITIONS = ["eng-khattab"];

export function readEditions(): string[] {
  try {
    const raw = localStorage.getItem(EDITIONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_EDITIONS;
  } catch {
    return DEFAULT_EDITIONS;
  }
}

export function writeEditions(ids: string[]): void {
  try {
    localStorage.setItem(EDITIONS_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Show/hide every edition's translation lines by toggling `.tr--off`. */
export function applyEditionVisibility(selected: Set<string>, all: EditionChoice[]): void {
  for (const e of all) {
    const visible = selected.has(e.id);
    document
      .querySelectorAll<HTMLElement>(`[data-edition="${e.id}"]`)
      .forEach((node) => node.classList.toggle("tr--off", !visible));
  }
}
