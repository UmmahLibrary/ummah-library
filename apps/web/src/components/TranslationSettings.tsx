"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type LanguageGroup,
  filterTranslations,
  groupTranslationsByLanguage,
} from "@ummahlibrary/core";
import { type EditionChoice, DEFAULT_EDITIONS, writeEditions } from "../lib/editions";

/**
 * "Manage translations" modal: search + language-grouped checklist + a "My
 * Translations" summary. Grouping and filtering come from the pure core helpers;
 * this component only owns the DOM, focus, and persistence.
 */
export function TranslationSettings({
  editions,
  selected,
  onChange,
  onClose,
}: {
  editions: EditionChoice[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on open; close on Escape.
  useEffect(() => {
    searchRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const matches = useMemo(() => filterTranslations(editions, query), [editions, query]);
  const groups: LanguageGroup[] = useMemo(
    () => groupTranslationsByLanguage(matches),
    [matches],
  );
  const chosen = useMemo(
    () => editions.filter((e) => selected.has(e.id)),
    [editions, selected],
  );

  function commit(next: Set<string>): void {
    if (next.size === 0) next.add(DEFAULT_EDITIONS[0]!); // never hide everything
    onChange(next);
    writeEditions([...next]); // persists + broadcasts `ul.editions`
  }

  function toggle(id: string): void {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    commit(next);
  }

  return (
    <div
      className="ts-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Manage translations"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ts-panel">
        <div className="ts-head">
          <h2 className="ts-title">Translations</h2>
          <button type="button" className="ts-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <input
          ref={searchRef}
          type="search"
          className="ts-search"
          placeholder="Search by name, author, or language…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search translations"
        />

        {chosen.length > 0 && (
          <section className="ts-section">
            <h3 className="ts-group-title">My Translations</h3>
            <div className="ts-selected">
              {chosen.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="ts-pill"
                  onClick={() => toggle(e.id)}
                  aria-label={`Remove ${e.name}`}
                >
                  {e.name} <span aria-hidden="true">✕</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="ts-groups">
          {groups.length === 0 && <p className="ts-empty">No translations match “{query}”.</p>}
          {groups.map((group) => (
            <section key={group.code} className="ts-section">
              <h3 className="ts-group-title">
                {group.english}
                {group.native !== group.english && (
                  <span className="ts-native"> · {group.native}</span>
                )}
              </h3>
              <ul className="ts-list">
                {group.translations.map((t) => {
                  const isOn = selected.has(t.id);
                  return (
                    <li key={t.id}>
                      <label className="ts-row">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggle(t.id)}
                        />
                        <span className="ts-name">{t.name}</span>
                        <span className="ts-author">{t.author}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
