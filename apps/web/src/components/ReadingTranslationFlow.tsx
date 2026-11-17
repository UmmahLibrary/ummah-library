"use client";

import { useEffect, useState } from "react";
import { resolveActiveTranslation } from "@ummahlibrary/core";
import {
  DEFAULT_EDITIONS,
  EDITIONS_KEY,
  READING_TR_KEY,
  editionLangCode,
  readEditions,
  readReadingTranslation,
} from "../lib/editions";
import { fetchCatalogue, fetchEditionSurah } from "../lib/catalogue";

/**
 * The continuous "Reading → Translations" flow for a surah (or a juzʾ section):
 * the single active edition's text for the given ayah numbers, fetched from the
 * runtime catalogue (ADR 0011). Re-fetches when the selection or active edition
 * changes.
 */
export function ReadingTranslationFlow({ surah, ayat }: { surah: number; ayat: number[] }) {
  const [lines, setLines] = useState<{ aya: number; text: string }[]>([]);
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  const [lang, setLang] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    async function load() {
      const ids = await readEditions();
      // "None — Arabic only": no translation flow at all.
      if (ids.length === 0) {
        if (active) setLines([]);
        return;
      }
      const activeId = resolveActiveTranslation(
        ids,
        await readReadingTranslation(),
        DEFAULT_EDITIONS[0]!,
      );
      const [catalogue, textByAya] = await Promise.all([
        fetchCatalogue(),
        fetchEditionSurah(activeId, surah),
      ]);
      if (!active) return;
      const meta = catalogue.find((e) => e.id === activeId);
      setDir(meta?.direction ?? "ltr");
      setLang(editionLangCode(meta?.language));
      setLines(
        ayat
          .map((aya) => ({ aya, text: textByAya.get(aya) }))
          .filter((l): l is { aya: number; text: string } => Boolean(l.text)),
      );
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(EDITIONS_KEY, onChange);
    window.addEventListener(READING_TR_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(EDITIONS_KEY, onChange);
      window.removeEventListener(READING_TR_KEY, onChange);
    };
  }, [surah, ayat]);

  return (
    <div className="read-flow" dir={dir} lang={lang}>
      {lines.map((l) => (
        <span key={l.aya} className="read-tr">
          <sup className="read-num">{l.aya}</sup> {l.text}{" "}
        </span>
      ))}
    </div>
  );
}
