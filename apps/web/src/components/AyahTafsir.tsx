"use client";

import { useState } from "react";

interface TafsirResponse {
  entries: { sura: number; aya: number; text: string }[];
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

export function AyahTafsir({
  surah,
  aya,
  tafsirId,
  tafsirName,
}: {
  surah: number;
  aya: number;
  tafsirId: string;
  tafsirName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "empty">("idle");
  const [text, setText] = useState("");

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (state === "idle") {
      setState("loading");
      try {
        const byAya = await loadSurahTafsir(tafsirId, surah);
        const entry = byAya.get(aya);
        setText(entry ?? "");
        setState(entry ? "ready" : "empty");
      } catch {
        setState("empty");
      }
    }
  }

  return (
    <div className="tafsir">
      <button type="button" className="tafsir-toggle" aria-expanded={open} onClick={toggle}>
        {open ? "▾" : "▸"} Tafsir · {tafsirName}
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
