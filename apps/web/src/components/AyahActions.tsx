"use client";

import { useEffect, useState } from "react";
import { collectionsWithAyah, createCollection, toggleAyah } from "@ummahlibrary/core";
import {
  newId,
  readCollections,
  readNote,
  writeCollections,
  writeNote,
} from "../lib/collections";
import { renderAyahImage, shareOrDownload } from "../lib/share-image";

export function AyahActions({ surah, aya }: { surah: number; aya: number }) {
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const [imaging, setImaging] = useState(false);
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState(() => [] as ReturnType<typeof readCollections>);
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState("");
  const ref = { sura: surah, aya };

  useEffect(() => {
    if (!open) return;
    setCollections(readCollections());
    setNote(readNote({ sura: surah, aya }));
  }, [open, surah, aya]);

  const savedIds = new Set(collectionsWithAyah(collections, ref));
  const saved = savedIds.size > 0;

  function toggle(id: string) {
    const next = toggleAyah(collections, id, ref);
    setCollections(next);
    writeCollections(next);
  }
  function addCollection() {
    const id = newId();
    const next = toggleAyah(createCollection(collections, id, newName), id, ref);
    setCollections(next);
    writeCollections(next);
    setNewName("");
  }
  function saveNote(text: string) {
    setNote(text);
    writeNote(ref, text);
  }

  function flash(which: "text" | "link") {
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  }

  /** Read the rendered Arabic + translations for this ayah out of the DOM. */
  function readAyahText(): { arabic: string; translations: string[] } {
    const block = document.getElementById(`${surah}:${aya}`);
    if (!block) return { arabic: "", translations: [] };
    const arEl = block
      .querySelector<HTMLElement>(".ayah-ar")
      ?.cloneNode(true) as HTMLElement | null;
    arEl?.querySelector(".ayah-marker")?.remove();
    const arabic = arEl?.textContent?.trim() ?? "";
    // Only selected editions are rendered now (ADR 0011), so every .ayah-tr counts.
    const translations = [...block.querySelectorAll<HTMLElement>(".ayah-tr")].map((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelector(".tr-name")?.remove();
      return clone.textContent?.trim() ?? "";
    });
    return { arabic, translations: translations.filter(Boolean) };
  }

  async function shareImage() {
    setImaging(true);
    try {
      const { arabic, translations } = readAyahText();
      if (!arabic) return;
      const blob = await renderAyahImage({ arabic, translations, reference: `${surah}:${aya}` });
      if (blob) await shareOrDownload(blob, `${surah}:${aya}`);
    } finally {
      setImaging(false);
    }
  }

  async function copyText() {
    const { arabic, translations } = readAyahText();
    if (!arabic) return;
    const text = [arabic, ...translations, `— ${surah}:${aya}`].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      flash("text");
    } catch {
      /* clipboard unavailable */
    }
  }

  async function copyLink() {
    const url = `${location.origin}/surah/${surah}#${surah}:${aya}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("link");
    } catch {
      /* clipboard unavailable */
    }
    history.replaceState(null, "", `#${surah}:${aya}`);
  }

  return (
    <>
      <button type="button" className="hifz-btn" onClick={copyText}>
        {copied === "text" ? "Copied ✓" : "Copy"}
      </button>
      <button
        type="button"
        className="hifz-btn"
        onClick={copyLink}
        aria-label={`Copy link to ayah ${surah}:${aya}`}
      >
        {copied === "link" ? "Link ✓" : "🔗 Link"}
      </button>
      <button type="button" className="hifz-btn" onClick={shareImage} disabled={imaging}>
        {imaging ? "…" : "🖼️ Image"}
      </button>
      <button
        type="button"
        className="hifz-btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {saved ? "★ Saved" : "☆ Save"}
      </button>

      {open && (
        <div className="ayah-save" role="dialog" aria-label="Save ayah">
          <div className="ayah-save-cols">
            {collections.length === 0 && (
              <p className="hifz-muted">No collections yet — create one below.</p>
            )}
            {collections.map((c) => (
              <label key={c.id} className="ayah-save-col">
                <input type="checkbox" checked={savedIds.has(c.id)} onChange={() => toggle(c.id)} />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          <div className="ayah-save-new">
            <input
              type="text"
              placeholder="New collection…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) addCollection();
              }}
            />
            <button type="button" className="hifz-btn" disabled={!newName.trim()} onClick={addCollection}>
              Add
            </button>
          </div>
          <textarea
            className="ayah-note"
            placeholder="Add a note / reflection…"
            value={note}
            onChange={(e) => saveNote(e.target.value)}
            rows={2}
          />
        </div>
      )}
    </>
  );
}
