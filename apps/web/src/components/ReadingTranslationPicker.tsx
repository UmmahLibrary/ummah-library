"use client";

import { useEffect, useRef, useState } from "react";
import { resolveActiveTranslation } from "@ummahlibrary/core";
import {
  type EditionChoice,
  DEFAULT_EDITIONS,
  applyReadingTranslation,
  readEditions,
  readReadingTranslation,
  writeReadingTranslation,
} from "../lib/editions";
import { TranslationSettings } from "./TranslationSettings";

/**
 * The single-translation picker for the "Reading → Translations" view, mirroring
 * Quran.com: a "Translation: …" dropdown listing the user's shortlisted editions
 * (single choice) plus a "Select Translations" entry that opens the full
 * {@link TranslationSettings} manager. Selecting one shows only that edition in
 * the reading flow via `applyReadingTranslation`; the choice persists in
 * `ul.readingTranslation`.
 */
export function ReadingTranslationPicker({ editions }: { editions: EditionChoice[] }) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_EDITIONS);
  const [active, setActive] = useState<string>(DEFAULT_EDITIONS[0]!);
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = readEditions();
    const next = resolveActiveTranslation(ids, readReadingTranslation(), DEFAULT_EDITIONS[0]!);
    setSelected(ids);
    setActive(next);
    applyReadingTranslation(next, editions);
  }, [editions]);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chosen = editions.filter((e) => selected.includes(e.id));
  const activeEdition = editions.find((e) => e.id === active);

  function pick(id: string): void {
    setActive(id);
    writeReadingTranslation(id);
    applyReadingTranslation(id, editions);
    setOpen(false);
  }

  // When the shortlist changes in the manager, keep a valid active edition.
  function onManagerChange(next: Set<string>): void {
    const ids = [...next];
    const nextActive = resolveActiveTranslation(ids, active, DEFAULT_EDITIONS[0]!);
    setSelected(ids);
    setActive(nextActive);
    writeReadingTranslation(nextActive);
    applyReadingTranslation(nextActive, editions);
  }

  return (
    <div className="rtr-bar">
      <div className="rtr-picker" ref={pickerRef}>
        <button
          type="button"
          className="rtr-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Translation: {activeEdition?.name ?? "—"} <span aria-hidden="true">▾</span>
        </button>

        {open && (
          <div className="rtr-menu" role="menu">
            <p className="rtr-menu-head">My Translations</p>
            {chosen.map((e) => (
              <button
                key={e.id}
                type="button"
                role="menuitemradio"
                aria-checked={e.id === active}
                className={e.id === active ? "rtr-item rtr-item--on" : "rtr-item"}
                onClick={() => pick(e.id)}
              >
                {e.name}
              </button>
            ))}
            <button
              type="button"
              className="rtr-item rtr-manage"
              onClick={() => {
                setOpen(false);
                setManaging(true);
              }}
            >
              ⚙ Select Translations
            </button>
          </div>
        )}
      </div>

      {managing && (
        <TranslationSettings
          editions={editions}
          selected={new Set(selected)}
          onChange={onManagerChange}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}
