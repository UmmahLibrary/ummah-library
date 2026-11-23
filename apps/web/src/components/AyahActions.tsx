"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Collection,
  collectionsWithAyah,
  createCard,
  createCollection,
  toggleAyah,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import type { IconName } from "@ummahlibrary/ui";
import { newId, readCollections, readNote, writeCollections, writeNote } from "../lib/collections";
import { HIFZ_EVENT, isTracked, removeCard, setCard } from "../lib/hifz-store";
import { TafsirCompare } from "./TafsirCompare";
import { useIntl } from "../i18n/I18nProvider";

interface TafsirMeta {
  id: string;
  name: string;
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

/** Space the More menu needs below its button (5 rows + the bottom dock). */
const MORE_MENU_ROOM = 340;

/** A row in the "More" menu. */
function MenuRow({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
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
        textAlign: "start",
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
  const { t, tf } = useIntl();
  const ref = { sura: surah, aya };

  const containerRef = useRef<HTMLDivElement>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // Open the menu upwards when there isn't room for it above the bottom dock.
  const [moreUp, setMoreUp] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState("");
  const [tracked, setTracked] = useState(false);
  const [imaging, setImaging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedIds = new Set(collectionsWithAyah(collections, ref));
  const saved = savedIds.size > 0;

  useEffect(() => {
    const refreshTracked = () => setTracked(isTracked({ sura: surah, aya }));
    refreshTracked();
    void readCollections().then(setCollections);
    window.addEventListener(HIFZ_EVENT, refreshTracked);
    return () => window.removeEventListener(HIFZ_EVENT, refreshTracked);
  }, [surah, aya]);

  useEffect(() => {
    const block = containerRef.current?.closest<HTMLElement>(".ayah");
    if (!block) return;
    block.classList.toggle("ayah-hifz", tracked);
    return () => {
      block.classList.remove("ayah-hifz");
    };
  }, [tracked]);

  // Escape closes the More menu, as it does every other popup in the reader.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  function toggleMore(e: React.MouseEvent<HTMLButtonElement>) {
    if (!moreOpen) {
      const r = e.currentTarget.getBoundingClientRect();
      // ~5 rows plus padding, and room for the fixed bottom dock.
      setMoreUp(window.innerHeight - r.bottom < MORE_MENU_ROOM);
    }
    setMoreOpen((o) => !o);
  }

  function flash(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }

  // ── collections + note ──
  function openSave() {
    void readCollections().then(setCollections);
    void readNote(ref).then(setNote);
    setSaveOpen((o) => !o);
  }
  function toggleCol(id: string) {
    const next = toggleAyah(collections, id, ref);
    setCollections(next);
    void writeCollections(next);
  }
  function addCollection() {
    const id = newId();
    const next = toggleAyah(createCollection(collections, id, newName), id, ref);
    setCollections(next);
    void writeCollections(next);
    setNewName("");
  }
  function saveNote(text: string) {
    setNote(text);
    void writeNote(ref, text);
  }

  // ── more menu actions ──
  function readAyahText(): { arabic: string; translations: string[] } {
    const block = document.getElementById(`${surah}:${aya}`);
    if (!block) return { arabic: "", translations: [] };
    const arEl = block
      .querySelector<HTMLElement>(".ayah-ar")
      ?.cloneNode(true) as HTMLElement | null;
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
      flash(t("ayah.copied"));
    } catch {
      /* clipboard unavailable */
    }
    setMoreOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${location.origin}/surah/${surah}#${surah}:${aya}`);
      flash(t("ayah.linkCopied"));
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
      // Loaded on demand so the canvas image-renderer stays out of the reader's
      // initial bundle — it's only needed when "share as image" is pressed.
      const { renderAyahImage, shareOrDownload } = await import("../lib/share-image");
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
      flash(t("ayah.removedHifz"));
    } else {
      setCard(ref, createCard());
      setTracked(true);
      flash(t("ayah.addedHifz"));
    }
    setMoreOpen(false);
  }

  function addReflection() {
    setMoreOpen(false);
    void readCollections().then(setCollections);
    void readNote(ref).then(setNote);
    setSaveOpen(true);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        className="ayah-actions"
        style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 6 }}
      >
        <BarBtn
          icon="play"
          label={t("ayah.play")}
          data-play-one={`${surah}:${aya}`}
          aria-label={tf("ayah.playN", { n: aya })}
        />
        <BarBtn
          icon="bookmark"
          label={saved ? t("ayah.saved") : t("ayah.save")}
          active={saved}
          aria-expanded={saveOpen}
          onClick={openSave}
        />
        <BarBtn
          icon="tafsir"
          label={t("ayah.tafsir")}
          active={tafsirOpen}
          onClick={() => setTafsirOpen((o) => !o)}
        />
        <div style={{ position: "relative", display: "inline-flex" }}>
          <BarBtn
            icon="more"
            label={t("ayah.more")}
            active={moreOpen}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={toggleMore}
          />
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
                  ...(moreUp ? { bottom: "100%", marginBottom: 8 } : { top: "100%", marginTop: 8 }),
                  insetInlineStart: 0,
                  zIndex: 41,
                  minWidth: 210,
                  padding: 6,
                  borderRadius: 14,
                  background: N.card,
                  border: `1px solid ${N.border}`,
                  boxShadow: "0 12px 32px rgba(0,0,0,.35)",
                }}
              >
                <MenuRow icon="layers" label={t("ayah.copyVerse")} onClick={copyVerse} />
                <MenuRow icon="share" label={t("ayah.copyLink")} onClick={copyLink} />
                <MenuRow icon="download" label={t("ayah.shareImage")} onClick={shareImage} />
                <MenuRow
                  icon={tracked ? "check" : "star"}
                  label={tracked ? t("ayah.stopMemorize") : t("ayah.memorize")}
                  onClick={toggleMemorize}
                />
                <MenuRow icon="type" label={t("ayah.reflection")} onClick={addReflection} />
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

      {(toast || imaging) && (
        <div style={{ fontSize: 12, color: N.gold, marginTop: 6, fontFamily: N.ui }} role="status">
          {imaging ? t("ayah.preparingImage") : toast}
        </div>
      )}

      {saveOpen && (
        <div className="ayah-save" role="dialog" aria-label={t("ayah.saveLabel")}>
          <div className="ayah-save-cols">
            {collections.length === 0 && <p className="hifz-muted">{t("ayah.noCollections")}</p>}
            {collections.map((c) => (
              <label key={c.id} className="ayah-save-col">
                <input
                  type="checkbox"
                  checked={savedIds.has(c.id)}
                  onChange={() => toggleCol(c.id)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          <div className="ayah-save-new">
            <input
              type="text"
              placeholder={t("ayah.newCollection")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) addCollection();
              }}
            />
            <button
              type="button"
              className="hifz-btn"
              disabled={!newName.trim()}
              onClick={addCollection}
            >
              {t("ayah.add")}
            </button>
          </div>
          <textarea
            className="ayah-note"
            placeholder={t("ayah.notePlaceholder")}
            value={note}
            onChange={(e) => saveNote(e.target.value)}
            rows={2}
          />
        </div>
      )}

      {tafsirOpen && <TafsirCompare surah={surah} aya={aya} tafsirs={tafsirs} />}
    </div>
  );
}
