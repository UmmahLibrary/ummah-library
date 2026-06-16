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
 *
 * The catalogue is fetched over the network, so a freshly-opened surah shows a
 * skeleton line until the text arrives instead of an empty gap. The edition
 * name is only labelled when more than one translation is shown — with a single
 * translation the label is noise (it repeats under every āyah).
 */
export function AyahTranslations({ surah, aya }: { surah: number; aya: number }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const ids = await readEditions();
      if (ids.length === 0) {
        if (active) {
          setLines([]);
          setLoading(false);
        }
        return;
      }
      if (active) setLoading(true);
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
      setLoading(false);
    }
    void load();
    const onChange = () => void load();
    window.addEventListener(EDITIONS_KEY, onChange);
    return () => {
      active = false;
      window.removeEventListener(EDITIONS_KEY, onChange);
    };
  }, [surah, aya]);

  if (loading && lines.length === 0) {
    return (
      <p className="ayah-tr" aria-busy="true" aria-label="Loading translation">
        <span className="skeleton-line" style={{ display: "block", maxWidth: "82%" }} />
      </p>
    );
  }

  const showName = lines.length > 1;

  return (
    <>
      {lines.map((l) => (
        <p key={l.id} className="ayah-tr" data-edition={l.id} dir={l.direction}>
          {showName && <span className="tr-name">{l.name}</span>}
          {l.text}
        </p>
      ))}
    </>
  );
}
