"use client";

import { useEffect, useRef, useState } from "react";
import {
  collectionsWithAyah,
  createCard,
  createCollection,
  toggleAyah,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { newId, readCollections, readNote, writeCollections, writeNote } from "../lib/collections";
import { renderAyahImage, shareOrDownload } from "../lib/share-image";
import { isTracked, removeCard, setCard } from "../lib/hifz-store";
import { TAFSIR_KEY, readTafsir } from "../lib/tafsir";

interface TafsirMeta {
  id: string;
  name: string;
}
interface TafsirResponse {
  entries: { sura: number; aya: number; text: string }[];
}

// One shared tafsir fetch per (edition, surah); every ayah's toggle reuses it.
const tafsirCache = new Map<string, Promise<Map<number, string>>>();
function loadSurahTafsir(tafsirId: string, surah: number): Promise<Map<number, string>> {
  const key = `${tafsirId}:${surah}`;
  let pending = tafsirCache.get(key);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}/tafsirs/${tafsirId}`)
      .then((res) => (res.ok ? (res.json() as Promise<TafsirResponse>) : { entries: [] }))
      .then((data) => new Map(data.entries.map((e) => [e.aya, e.text])));
    tafsirCache.set(key, pending);
  }
  return pending;
}

/** A quick-action button in the per-ayah row: icon + label, gold when active. */
function BarBtn({
  icon,
  label,
  active,
  ...rest
}: {
  icon: IconName;
  label: string;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: active ? N.gold : N.faint,
        fontFamily: N.ui,
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      <Icon name={icon} size={15} sw={1.8} />
      {label}
    </button>
  );
}

/** A row in the "More" menu. */
function MenuRow({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 12px",
        background: "none",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        color: N.fg,
        fontFamily: N.ui,
        fontSize: 14,
        fontWeight: 600,
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = N.cardHi)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <Icon name={icon} size={17} color={N.gold} />
      {label}
    </button>
  );
}

/**
 * The per-ayah action bar — Play · Save · Tafsir · More (mirrors the Noor design's
 * `AyahActions` + action sheet). Play drives the shared audio dock via
 * `data-play-one`; Save opens the collections + note panel; Tafsir toggles the
 * commentary; More holds copy / link / share-image / memorize / reflection.
 */
export function AyahActions({
  surah,
  aya,
  tafsirs,
}: {
  surah: number;
  aya: number;
  tafsirs: TafsirMeta[];
}) {
  const ref = { sura: surah, aya };

  const containerRef = useRef<HTMLDivElement>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [collections, setCollections] = useState(() => [] as ReturnType<typeof readCollections>);
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState("");
  const [tracked, setTracked] = useState(false);
  const [imaging, setImaging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tafsir state (selected edition shared via localStorage + the TafsirPicker event).
  const [tafsirId, setTafsirId] = useState(tafsirs[0]?.id ?? "");
  const [tafsirState, setTafsirState] = useState<"loading" | "ready" | "empty">("loading");
  const [tafsirText, setTafsirText] = useState("");

  const savedIds = new Set(collectionsWithAyah(collections, ref));
  const saved = savedIds.size > 0;

  useEffect(() => {
    setTracked(isTracked({ sura: surah, aya }));
    setCollections(readCollections());
  }, [surah, aya]);

  useEffect(() => {
    const block = containerRef.current?.closest<HTMLElement>(".ayah");
    if (!block) return;
    block.classList.toggle("ayah-hifz", tracked);
    return () => { block.classList.remove("ayah-hifz"); };
  }, [tracked]);

  useEffect(() => {
    setTafsirId(readTafsir(tafsirs[0]?.id ?? ""));
    const onChange = (e: Event) => setTafsirId((e as CustomEvent<string>).detail);
    window.addEventListener(TAFSIR_KEY, onChange as EventListener);
    return () => window.removeEventListener(TAFSIR_KEY, onChange as EventListener);
  }, [tafsirs]);

  useEffect(() => {
    if (!tafsirOpen || !tafsirId) return;
    let active = true;
    setTafsirState("loading");
    loadSurahTafsir(tafsirId, surah)
      .then((byAya) => {
        if (!active) return;
        const entry = byAya.get(aya);
        setTafsirText(entry ?? "");
        setTafsirState(entry ? "ready" : "empty");
      })
      .catch(() => active && setTafsirState("empty"));
    return () => {
      active = false;
    };
  }, [tafsirOpen, tafsirId, surah, aya]);

  function flash(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }

  // ── collections + note ──
  function openSave() {
    setCollections(readCollections());
    setNote(readNote(ref));
    setSaveOpen((o) => !o);
  }
  function toggleCol(id: string) {
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

  // ── more menu actions ──
  function readAyahText(): { arabic: string; translations: string[] } {
    const block = document.getElementById(`${surah}:${aya}`);
    if (!block) return { arabic: "", translations: [] };
    const arEl = block.querySelector<HTMLElement>(".ayah-ar")?.cloneNode(true) as HTMLElement | null;
    arEl?.querySelector(".ayah-marker")?.remove();
    const arabic = arEl?.textContent?.trim() ?? "";
    const translations = [...block.querySelectorAll<HTMLElement>(".ayah-tr")].map((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelector(".tr-name")?.remove();
      return clone.textContent?.trim() ?? "";
    });
    return { arabic, translations: translations.filter(Boolean) };
  }

  async function copyVerse() {
    const { arabic, translations } = readAyahText();
    if (!arabic) return;
    const text = [arabic, ...translations, `— ${surah}:${aya}`].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      flash("Verse copied");
    } catch {
      /* clipboard unavailable */
    }
    setMoreOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/surah/${surah}#${surah}:${aya}`);
      flash("Link copied");
    } catch {
      /* clipboard unavailable */
    }
    history.replaceState(null, "", `#${surah}:${aya}`);
    setMoreOpen(false);
  }

  async function shareImage() {
    setMoreOpen(false);
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

  function toggleMemorize() {
    if (isTracked(ref)) {
      removeCard(ref);
      setTracked(false);
      flash("Removed from Hifz");
    } else {
      setCard(ref, createCard());
      setTracked(true);
      flash("Added to Hifz");
    }
    setMoreOpen(false);
  }

  function addReflection() {
    setMoreOpen(false);
    setCollections(readCollections());
    setNote(readNote(ref));
    setSaveOpen(true);
  }

  const tafsirName = tafsirs.find((t) => t.id === tafsirId)?.name ?? "Tafsir";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        className="ayah-actions"
        style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 6 }}
      >
        <BarBtn
          icon="play"
          label="Play"
          data-play-one={`${surah}:${aya}`}
          aria-label={`Play āyah ${aya}`}
        />
        <BarBtn
          icon="bookmark"
          label={saved ? "Saved" : "Save"}
          active={saved}
          aria-expanded={saveOpen}
          onClick={openSave}
        />
        <BarBtn icon="tafsir" label="Tafsir" active={tafsirOpen} onClick={() => setTafsirOpen((o) => !o)} />
        <div style={{ position: "relative", display: "inline-flex" }}>
          <BarBtn icon="more" label="More" active={moreOpen} onClick={() => setMoreOpen((o) => !o)} />
          {moreOpen && (
            <>
              <div
                onClick={() => setMoreOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                aria-hidden="true"
              />
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 8,
                  zIndex: 41,
                  minWidth: 210,
                  padding: 6,
                  borderRadius: 14,
                  background: N.card,
                  border: `1px solid ${N.border}`,
                  boxShadow: "0 12px 32px rgba(0,0,0,.35)",
                }}
              >
                <MenuRow icon="layers" label="Copy verse" onClick={copyVerse} />
                <MenuRow icon="share" label="Copy link" onClick={copyLink} />
                <MenuRow icon="download" label="Share as image" onClick={shareImage} />
                <MenuRow
                  icon={tracked ? "check" : "star"}
                  label={tracked ? "Stop memorizing" : "Memorize"}
                  onClick={toggleMemorize}
                />
                <MenuRow icon="type" label="Add a reflection" onClick={addReflection} />
              </div>
            </>
          )}
        </div>

        {tracked && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.4,
              color: N.gold,
              fontFamily: N.ui,
              opacity: 0.85,
            }}
          >
            ✦ Hifz
          </span>
        )}
      </div>

      {toast && (
        <div style={{ fontSize: 12, color: N.gold, marginTop: 6, fontFamily: N.ui }} role="status">
          {imaging ? "Preparing image…" : toast}
        </div>
      )}

      {saveOpen && (
        <div className="ayah-save" role="dialog" aria-label="Save ayah">
          <div className="ayah-save-cols">
            {collections.length === 0 && (
              <p className="hifz-muted">No collections yet — create one below.</p>
            )}
            {collections.map((c) => (
              <label key={c.id} className="ayah-save-col">
                <input type="checkbox" checked={savedIds.has(c.id)} onChange={() => toggleCol(c.id)} />
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

      {tafsirOpen && (
        <div className="tafsir">
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: N.gold,
              fontWeight: 700,
              fontFamily: N.ui,
              margin: "10px 0 6px",
            }}
          >
            Tafsīr · {tafsirName}
          </div>
          <div className="tafsir-body">
            {tafsirState === "loading" && <span className="tafsir-muted">Loading…</span>}
            {tafsirState === "empty" && (
              <span className="tafsir-muted">No tafsir for this āyah.</span>
            )}
            {tafsirState === "ready" &&
              tafsirText.split("\n").map((p, i) => (p.trim() ? <p key={i}>{p}</p> : null))}
          </div>
        </div>
      )}
    </div>
  );
}
