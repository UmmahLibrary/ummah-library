"use client";

import { useEffect, useState } from "react";
import type { EditionChoice } from "../lib/editions";
import { EDITIONS_KEY, readEditions } from "../lib/editions";
import { fetchCatalogue, fetchEditionSurah } from "../lib/catalogue";

interface Line {
  id: string;
  name: string;
  text: string;
  direction: "ltr" | "rtl";
}

/**
 * The selected translations for one ayah, fetched from the runtime catalogue
 * (ADR 0011). Re-fetches when the selection changes (the `ul.editions` window
 * event). Keeps the `.ayah-tr` markup the rest of the reader expects (e.g.
 * AyahActions' copy).
 */
export function AyahTranslations({ surah, aya }: { surah: number; aya: number }) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const ids = readEditions();
      const catalogue = await fetchCatalogue();
      const metaById = new Map(catalogue.map((e) => [e.id, e]));
      const entries = await Promise.all(
        ids.map((id) => fetchEditionSurah(id, surah).then((m) => [id, m.get(aya)] as const)),
      );
      if (!active) return;
      setLines(
        entries
          .filter((e): e is [string, string] => Boolean(e[1]))
          .map(([id, text]) => {
            const meta: EditionChoice | undefined = metaById.get(id);
            return { id, name: meta?.name ?? id, text, direction: meta?.direction ?? "ltr" };
          }),
      );
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(EDITIONS_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(EDITIONS_KEY, onChange);
    };
  }, [surah, aya]);

  return (
    <>
      {lines.map((l) => (
        <p key={l.id} className="ayah-tr" data-edition={l.id} dir={l.direction}>
          <span className="tr-name">{l.name}</span>
          {l.text}
        </p>
      ))}
    </>
  );
}
