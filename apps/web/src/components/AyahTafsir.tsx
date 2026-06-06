"use client";

import { useEffect, useState } from "react";
import { TAFSIR_KEY, readTafsir } from "../lib/tafsir";

interface TafsirResponse {
  entries: { sura: number; aya: number; text: string }[];
}
interface TafsirMeta {
  id: string;
  name: string;
}

// One shared fetch per (tafsir, surah); every ayah's toggle reuses it.
const cache = new Map<string, Promise<Map<number, string>>>();

function loadSurahTafsir(tafsirId: string, surah: number): Promise<Map<number, string>> {
  const key = `${tafsirId}:${surah}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/api/v1/surahs/${surah}/tafsirs/${tafsirId}`)
      .then((res) => (res.ok ? (res.json() as Promise<TafsirResponse>) : { entries: [] }))
      .then((data) => new Map(data.entries.map((e) => [e.aya, e.text])));
    cache.set(key, pending);
  }
  return pending;
}

/**
 * Collapsible per-ayah tafsir in the currently selected edition. The selection
 * is shared via `localStorage` (`ul.tafsir`) and a `ul:tafsir` window event that
 * `TafsirPicker` dispatches, so changing the edition updates every open block.
 */
export function AyahTafsir({
  surah,
  aya,
  tafsirs,
}: {
  surah: number;
  aya: number;
  tafsirs: TafsirMeta[];
}) {
  const [tafsirId, setTafsirId] = useState(tafsirs[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");
  const [text, setText] = useState("");

  useEffect(() => {
    setTafsirId(readTafsir(tafsirs[0]?.id ?? ""));
    const onChange = (e: Event) => setTafsirId((e as CustomEvent<string>).detail);
    window.addEventListener(TAFSIR_KEY, onChange as EventListener);
    return () => window.removeEventListener(TAFSIR_KEY, onChange as EventListener);
  }, [tafsirs]);

  useEffect(() => {
    if (!open || !tafsirId) return;
    let active = true;
    setState("loading");
    loadSurahTafsir(tafsirId, surah)
      .then((byAya) => {
        if (!active) return;
        const entry = byAya.get(aya);
        setText(entry ?? "");
        setState(entry ? "ready" : "empty");
      })
      .catch(() => active && setState("empty"));
    return () => {
      active = false;
    };
  }, [open, tafsirId, surah, aya]);

  const name = tafsirs.find((t) => t.id === tafsirId)?.name ?? "Tafsir";

  return (
    <div className="tafsir">
      <button
        type="button"
        className="tafsir-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "▾" : "▸"} Tafsir · {name}
      </button>
      {open && (
        <div className="tafsir-body">
          {state === "loading" && <span className="tafsir-muted">Loading…</span>}
          {state === "empty" && <span className="tafsir-muted">No tafsir for this āyah.</span>}
          {state === "ready" &&
            text.split("\n").map((p, i) => (p.trim() ? <p key={i}>{p}</p> : null))}
        </div>
      )}
    </div>
  );
}
