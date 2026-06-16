/**
 * Local-first storage for ayah collections and per-ayah notes (ADR 0006). The
 * model logic is pure in `@ummahlibrary/core`; persistence goes through the
 * `LibraryStore` port (web adapter `webLibraryStore`, ADR 0024). A window event
 * keeps the reader and `/collections` in sync.
 */

import { type Collection, type VerseKey, ayahKey } from "@ummahlibrary/core";
import { webLibraryStore as store } from "./library-store";

export const COLLECTIONS_EVENT = "ul.collections";

function emit(): void {
  try {
    window.dispatchEvent(new CustomEvent(COLLECTIONS_EVENT));
  } catch {
    /* non-browser */
  }
}

export function readCollections(): Promise<Collection[]> {
  return store.readCollections();
}
export async function writeCollections(collections: Collection[]): Promise<void> {
  await store.writeCollections(collections);
  emit();
}

export function newId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function readNotes(): Promise<Record<string, string>> {
  return store.readNotes();
}
export async function readNote(ref: VerseKey): Promise<string> {
  return (await store.readNotes())[ayahKey(ref)] ?? "";
}
export async function writeNote(ref: VerseKey, text: string): Promise<void> {
  const notes = await store.readNotes();
  const key = ayahKey(ref);
  if (text.trim()) notes[key] = text;
  else delete notes[key];
  await store.writeNotes(notes);
  emit();
}
