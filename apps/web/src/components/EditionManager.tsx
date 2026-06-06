"use client";

import { useEffect, useState } from "react";
import {
  type EditionChoice,
  DEFAULT_EDITIONS,
  applyEditionVisibility,
  readEditions,
} from "../lib/editions";
import { TranslationSettings } from "./TranslationSettings";

/**
 * The translation picker shared by the surah and juzʾ readers: a compact "My
 * Translations" summary plus a "Manage" button that opens the full grouped,
 * searchable {@link TranslationSettings} modal. Owns the selected-set state and
 * keeps the page's `[data-edition]` blocks in sync via `applyEditionVisibility`.
 */
export function EditionManager({ editions }: { editions: EditionChoice[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_EDITIONS));
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    const saved = new Set(readEditions());
    setSelected(saved);
    applyEditionVisibility(saved, editions);
  }, [editions]);

  const chosen = editions.filter((e) => selected.has(e.id));

  return (
    <div className="edition-summary">
      <span className="edition-summary-label">Translations:</span>
      <span className="edition-summary-names">
        {chosen.length > 0 ? chosen.map((e) => e.name).join(", ") : "None"}
      </span>
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
          editions={editions}
          selected={selected}
          onChange={(next) => setSelected(new Set(next))}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}
