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

/** The single edition shown in the "Reading → Translations" view. */
export const READING_TR_KEY = "ul.readingTranslation";

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

export function readReadingTranslation(): string | null {
  try {
    return localStorage.getItem(READING_TR_KEY);
  } catch {
    return null;
  }
}

export function writeReadingTranslation(id: string): void {
  try {
    localStorage.setItem(READING_TR_KEY, id);
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * In the "Reading → Translations" view, show only the single active edition:
 * every other `.read-tr` run gets `.rtr--off`, and the flow container takes the
 * active edition's direction so RTL translations read right-to-left.
 */
export function applyReadingTranslation(activeId: string, all: EditionChoice[]): void {
  document
    .querySelectorAll<HTMLElement>(".mode-reading-tr .read-tr")
    .forEach((node) => node.classList.toggle("rtr--off", node.dataset.edition !== activeId));

  const active = all.find((e) => e.id === activeId);
  if (!active) return;
  document
    .querySelectorAll<HTMLElement>(".mode-reading-tr .read-flow")
    .forEach((flow) => {
      flow.dir = active.direction;
    });
}
