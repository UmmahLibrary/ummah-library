"use client";

import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import { TAFSIR_COMPARE_KEY, TAFSIR_KEY, readCompare, readTafsir, writeCompare } from "../lib/tafsir";

interface TafsirMeta {
  id: string;
  name: string;
}
interface TafsirResponse {
  entries: { sura: number; aya: number; text: string }[];
}

// One shared fetch per (edition, surah); every āyah's column reuses it.
const tafsirCache = new Map<string, Promise<Map<number, string>>>();
function loadSurahTafsir(tafsirId: string, surah: number): Promise<Map<number, string>> {
  const key = `${tafsirId}:${surah}`;
  let pending = tafsirCache.get(key);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}/tafsirs/${tafsirId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`tafsir_unavailable:${res.status}`);
        return res.json() as Promise<TafsirResponse>;
      })
      .then((data) => new Map(data.entries.map((e) => [e.aya, e.text])));
    tafsirCache.set(key, pending);
  }
  return pending;
}

// Arabic/Urdu/Persian tafsir reads right-to-left; everything else left-to-right.
const isRtl = (id: string) => /^(ar|ur|fa|ps|ckb)-/.test(id);

/**
 * The per-āyah tafsīr panel with side-by-side comparison (#141): a chip row to
 * pick editions and one column per selected edition, each fetched independently
 * and reusing the per-surah cache. The columns are a responsive auto-fit grid, so
 * they sit side by side on wide screens and stack on narrow ones. The selection
 * persists (`ul.tafsirCompare`); an empty set falls back to the single chosen
 * tafsir, i.e. the original one-edition behaviour.
 */
export function TafsirCompare({
  surah,
  aya,
  tafsirs,
}: {
  surah: number;
  aya: number;
  tafsirs: TafsirMeta[];
}) {
  const [primary, setPrimary] = useState(tafsirs[0]?.id ?? "");
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    void readTafsir(tafsirs[0]?.id ?? "").then(setPrimary);
    setCompare(readCompare());
    const onPrimary = (e: Event) => setPrimary((e as CustomEvent<string>).detail);
    const onCompare = (e: Event) => setCompare((e as CustomEvent<string[]>).detail);
    window.addEventListener(TAFSIR_KEY, onPrimary as EventListener);
    window.addEventListener(TAFSIR_COMPARE_KEY, onCompare as EventListener);
    return () => {
      window.removeEventListener(TAFSIR_KEY, onPrimary as EventListener);
      window.removeEventListener(TAFSIR_COMPARE_KEY, onCompare as EventListener);
    };
  }, [tafsirs]);

  // The editions to show: the explicit comparison set (validated against what we
  // actually ship), else just the primary one.
  const valid = new Set(tafsirs.map((t) => t.id));
  const selected = compare.filter((id) => valid.has(id));
  const editions = selected.length > 0 ? selected : primary ? [primary] : [];

  function toggle(id: string) {
    const set = new Set(editions);
    if (set.has(id)) {
      if (set.size === 1) return; // keep at least one edition visible
      set.delete(id);
    } else {
      set.add(id);
    }
    // Preserve the manifest order so the columns stay stable.
    writeCompare(tafsirs.filter((t) => set.has(t.id)).map((t) => t.id));
  }

  return (
    <div className="tafsir">
      <div
        style={{
          fontSize: 11.5,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: N.gold,
          fontWeight: 700,
          fontFamily: N.ui,
          margin: "10px 0 8px",
        }}
      >
        Tafsīr {editions.length > 1 ? "· comparing" : ""}
      </div>

      {/* Edition chips */}
      {tafsirs.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {tafsirs.map((t) => {
            const on = editions.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                aria-pressed={on}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: `1px solid ${on ? N.gold : N.border}`,
                  background: on ? N.goldSoft : N.card,
                  color: on ? N.gold : N.muted,
                  fontFamily: N.ui,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Columns — one per selected edition, responsive auto-fit grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          alignItems: "start",
        }}
      >
        {editions.map((id) => (
          <TafsirColumn
            key={id}
            edition={id}
            name={tafsirs.find((t) => t.id === id)?.name ?? "Tafsir"}
            multi={editions.length > 1}
            surah={surah}
            aya={aya}
          />
        ))}
      </div>
    </div>
  );
}

function TafsirColumn({
  edition,
  name,
  multi,
  surah,
  aya,
}: {
  edition: string;
  name: string;
  multi: boolean;
  surah: number;
  aya: number;
}) {
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [text, setText] = useState("");

  useEffect(() => {
    let active = true;
    setState("loading");
    loadSurahTafsir(edition, surah)
      .then((byAya) => {
        if (!active) return;
        const entry = byAya.get(aya);
        setText(entry ?? "");
        setState(entry ? "ready" : "empty");
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [edition, surah, aya]);

  return (
    <div
      style={
        multi
          ? { border: `1px solid ${N.borderSoft}`, borderRadius: 12, padding: "10px 12px" }
          : undefined
      }
    >
      {multi && (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: N.fg,
            fontFamily: N.ui,
            marginBottom: 6,
          }}
        >
          {name}
        </div>
      )}
      <div className="tafsir-body" dir={isRtl(edition) ? "rtl" : undefined}>
        {state === "loading" && <span className="tafsir-muted">Loading…</span>}
        {state === "empty" && <span className="tafsir-muted">No tafsir for this āyah.</span>}
        {state === "error" && (
          <span className="tafsir-muted">Couldn't load {name} right now.</span>
        )}
        {state === "ready" &&
          text.split("\n").map((p, i) => (p.trim() ? <p key={i}>{p}</p> : null))}
      </div>
    </div>
  );
}
