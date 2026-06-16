"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type Collection,
  type VerseKey,
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
import { N, Khatam } from "@ummahlibrary/ui";

interface AyahText {
  arabic: string;
  translation: string | null;
}

/** Saved ayahs grouped into collections, each shown with its verse text, an
 *  optional personal note, and quick open/remove actions. The Arabic + a
 *  translation are fetched from the bundled datasets so a bookmark reads as the
 *  verse itself, not a bare reference. */
export function CollectionsView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [names, setNames] = useState<Record<number, string>>({});
  const [texts, setTexts] = useState<Record<string, AyahText>>({});

  useEffect(() => {
    const refresh = () => {
      void readCollections().then(setCollections);
      void readNotes().then(setNotes);
    };
    refresh();
    setReady(true);
    window.addEventListener(COLLECTIONS_EVENT, refresh);
    return () => window.removeEventListener(COLLECTIONS_EVENT, refresh);
  }, []);

  // Surah names (number → transliteration) for friendly labels.
  useEffect(() => {
    let active = true;
    fetch("/api/v1/surahs")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { surahs?: { number: number; transliteration: string }[] } | null) => {
        if (!active || !d?.surahs) return;
        setNames(Object.fromEntries(d.surahs.map((s) => [s.number, s.transliteration])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Every distinct ayah referenced across all collections.
  const refs = useMemo(() => {
    const seen = new Map<string, VerseKey>();
    for (const c of collections) for (const r of c.ayahs) seen.set(ayahKey(r), r);
    return [...seen.entries()];
  }, [collections]);

  // Fetch the verse text for any ayah we don't have yet.
  useEffect(() => {
    let active = true;
    const missing = refs.filter(([key]) => !(key in texts));
    if (missing.length === 0) return;
    Promise.all(
      missing.map(([key, ref]) =>
        fetch(`/api/v1/surahs/${ref.sura}/ayahs/${ref.aya}?edition=eng-khattab`)
          .then((r) => (r.ok ? r.json() : null))
          .then(
            (d: { ayah?: { text?: string }; translation?: { text?: string } } | null) =>
              [
                key,
                { arabic: d?.ayah?.text ?? "", translation: d?.translation?.text ?? null },
              ] as const,
          )
          .catch(() => [key, { arabic: "", translation: null }] as const),
      ),
    ).then((entries) => {
      if (!active) return;
      setTexts((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      active = false;
    };
  }, [refs, texts]);

  function persist(next: Collection[]) {
    setCollections(next);
    void writeCollections(next);
  }

  if (!ready) return null;
  if (collections.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px 30px" }}>
        <div style={{ display: "inline-grid", placeItems: "center", marginBottom: 16, opacity: 0.5 }}>
          <Khatam size={64} color={N.goldDim} sw={1.2} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: N.fg, marginBottom: 8, fontFamily: N.ui }}>
          No bookmarks yet
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: N.muted,
            maxWidth: 440,
            margin: "0 auto",
            lineHeight: 1.6,
            fontFamily: N.ui,
          }}
        >
          Open any surah, tap <strong style={{ color: N.gold }}>☆ Save</strong> under an āyah, and
          group your favourite verses and notes into collections here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {collections.map((c) => (
        <section key={c.id}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <input
              className="collection-name"
              value={c.name}
              onChange={(e) => persist(renameCollection(collections, c.id, e.target.value))}
              aria-label="Collection name"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid transparent`,
                color: N.fg,
                fontSize: 18,
                fontWeight: 700,
                fontFamily: N.ui,
                padding: "2px 0",
                outline: "none",
              }}
            />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: N.muted,
                background: N.card,
                border: `1px solid ${N.border}`,
                borderRadius: 999,
                padding: "2px 10px",
                fontFamily: N.ui,
                flexShrink: 0,
              }}
            >
              {c.ayahs.length}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete the collection “${c.name}”?`)) {
                  persist(deleteCollection(collections, c.id));
                }
              }}
              className="noor-press"
              style={{
                fontSize: 12.5,
                color: N.muted,
                background: "transparent",
                border: `1px solid ${N.border}`,
                borderRadius: 8,
                padding: "5px 12px",
                fontFamily: N.ui,
                flexShrink: 0,
              }}
            >
              Delete
            </button>
          </header>

          {c.ayahs.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: N.faint,
                fontFamily: N.ui,
                padding: "14px 16px",
                border: `1px dashed ${N.border}`,
                borderRadius: 12,
              }}
            >
              Empty — save āyāt to it from the reader.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {c.ayahs.map((ref) => {
                const key = ayahKey(ref);
                const text = texts[key];
                const note = notes[key];
                const label = names[ref.sura] ? `${names[ref.sura]} · ${key}` : key;
                return (
                  <article
                    key={key}
                    style={{
                      background: N.card,
                      border: `1px solid ${N.border}`,
                      borderRadius: 14,
                      padding: "16px 18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: N.gold,
                          fontFamily: N.ui,
                        }}
                      >
                        {label}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${key}`}
                        onClick={() => persist(toggleAyah(collections, c.id, ref))}
                        className="noor-press"
                        style={{
                          width: 28,
                          height: 28,
                          display: "grid",
                          placeItems: "center",
                          color: N.faint,
                          background: "transparent",
                          border: `1px solid ${N.border}`,
                          borderRadius: 8,
                          flexShrink: 0,
                          fontSize: 13,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {!text && (
                      <div aria-busy="true" style={{ marginBottom: 8 }}>
                        <span
                          className="skeleton-line"
                          style={{ display: "block", height: "1.5rem", marginBottom: 8 }}
                        />
                        <span
                          className="skeleton-line"
                          style={{ display: "block", height: "1rem", maxWidth: "65%" }}
                        />
                      </div>
                    )}
                    {text?.arabic && (
                      <div
                        className="noor-ar"
                        dir="rtl"
                        lang="ar"
                        style={{ fontSize: 23, lineHeight: 2, color: N.fg, marginBottom: 8 }}
                      >
                        {text.arabic}
                      </div>
                    )}
                    {text?.translation && (
                      <div
                        style={{
                          fontSize: 14.5,
                          lineHeight: 1.6,
                          color: N.muted,
                          fontFamily: N.ui,
                        }}
                      >
                        {text.translation}
                      </div>
                    )}

                    {note && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 12px",
                          background: N.bg2,
                          borderRadius: 10,
                          borderLeft: `2px solid ${N.gold}`,
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          color: N.muted,
                          fontFamily: N.ui,
                        }}
                      >
                        {note}
                      </div>
                    )}

                    <div style={{ marginTop: 12 }}>
                      <Link
                        href={`/surah/${ref.sura}#${key}`}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: N.gold,
                          textDecoration: "none",
                          fontFamily: N.ui,
                        }}
                      >
                        Open in reader →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
