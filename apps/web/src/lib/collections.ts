/**
 * Local-first storage for ayah collections and per-ayah notes (ADR 0006). The
 * model logic is pure in `@ummahlibrary/core`; this layer reads/writes
 * `localStorage` and broadcasts changes so the reader and `/collections` stay
 * in sync.
 */

import { type Collection, type VerseKey, ayahKey } from "@ummahlibrary/core";

export const COLLECTIONS_EVENT = "ul.collections";
const COLLECTIONS_KEY = "ul.collections";
const NOTES_KEY = "ul.ayahNotes";

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(COLLECTIONS_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readCollections(): Collection[] {
  return get<Collection[]>(COLLECTIONS_KEY, []);
}
export function writeCollections(collections: Collection[]): void {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch {
    /* ignore */
  }
  emit();
}

export function newId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function readNotes(): Record<string, string> {
  return get<Record<string, string>>(NOTES_KEY, {});
}
export function readNote(ref: VerseKey): string {
  return readNotes()[ayahKey(ref)] ?? "";
}
export function writeNote(ref: VerseKey, text: string): void {
  const notes = readNotes();
  const key = ayahKey(ref);
  if (text.trim()) notes[key] = text;
  else delete notes[key];
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
  emit();
}
