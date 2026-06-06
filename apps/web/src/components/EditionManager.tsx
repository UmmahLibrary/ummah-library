"use client";

import { useEffect, useState } from "react";
import { type EditionChoice, DEFAULT_EDITIONS, readEditions } from "../lib/editions";
import { fetchCatalogue } from "../lib/catalogue";
import { TranslationSettings } from "./TranslationSettings";

/**
 * The translation picker shared by the surah and juzʾ readers: a compact "My
 * Translations" summary plus a "Manage" button that opens the full grouped,
 * searchable {@link TranslationSettings} modal over the runtime catalogue
 * (ADR 0011). Selection changes are persisted + broadcast by `TranslationSettings`.
 */
export function EditionManager() {
  const [catalogue, setCatalogue] = useState<EditionChoice[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_EDITIONS));
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    setSelected(new Set(readEditions()));
    void fetchCatalogue().then(setCatalogue);
  }, []);

  const names = [...selected].map((id) => catalogue.find((e) => e.id === id)?.name ?? id);

  return (
    <div className="edition-summary">
      <span className="edition-summary-label">Translations:</span>
      <span className="edition-summary-names">{names.length > 0 ? names.join(", ") : "None"}</span>
      <button
        type="button"
        className="chip"
        onClick={() => setManaging(true)}
        aria-haspopup="dialog"
      >
        Manage
      </button>

      {managing && (
        <TranslationSettings
          editions={catalogue}
          selected={selected}
          onChange={(next) => setSelected(new Set(next))}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}
