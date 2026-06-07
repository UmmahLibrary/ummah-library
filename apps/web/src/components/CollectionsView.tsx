"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  type Collection,
  ayahKey,
  deleteCollection,
  renameCollection,
  toggleAyah,
} from "@ummahlibrary/core";
import {
  COLLECTIONS_EVENT,
  readCollections,
  readNotes,
  writeCollections,
} from "../lib/collections";

export function CollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setCollections(readCollections());
      setNotes(readNotes());
    };
    refresh();
    setReady(true);
    window.addEventListener(COLLECTIONS_EVENT, refresh);
    return () => window.removeEventListener(COLLECTIONS_EVENT, refresh);
  }, []);

  function persist(next: Collection[]) {
    setCollections(next);
    writeCollections(next);
  }

  if (!ready) return null;
  if (collections.length === 0) {
    return (
      <p className="hifz-muted">
        No collections yet. Open any surah, tap <strong>☆ Save</strong> under an ayah, and create a
        collection to group your favourite verses and notes.
      </p>
    );
  }

  return (
    <div className="collections">
      {collections.map((c) => (
        <section key={c.id} className="collection">
          <header className="collection-head">
            <input
              className="collection-name"
              value={c.name}
              onChange={(e) => persist(renameCollection(collections, c.id, e.target.value))}
              aria-label="Collection name"
            />
            <span className="collection-count">{c.ayahs.length}</span>
            <button
              type="button"
              className="chip"
              onClick={() => {
                if (confirm(`Delete the collection “${c.name}”?`)) {
                  persist(deleteCollection(collections, c.id));
                }
              }}
            >
              Delete
            </button>
          </header>

          {c.ayahs.length === 0 ? (
            <p className="hifz-muted">Empty — save ayahs to it from the reader.</p>
          ) : (
            <ul className="collection-ayahs">
              {c.ayahs.map((ref) => {
                const key = ayahKey(ref);
                return (
                  <li key={key} className="collection-ayah">
                    <Link href={`/surah/${ref.sura}#${key}`} className="collection-ref">
                      {key}
                    </Link>
                    {notes[key] && <span className="collection-note">{notes[key]}</span>}
                    <button
                      type="button"
                      className="hifz-btn"
                      aria-label={`Remove ${key}`}
                      onClick={() => persist(toggleAyah(collections, c.id, ref))}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
