"use client";

import { useEffect, useState } from "react";
import { readTafsir, writeTafsir } from "../lib/tafsir";

interface TafsirMeta {
  id: string;
  name: string;
}

/** Single global tafsir-edition selector for the reader. */
export function TafsirPicker({ tafsirs }: { tafsirs: TafsirMeta[] }) {
  const [id, setId] = useState(tafsirs[0]?.id ?? "");

  useEffect(() => {
    setId(readTafsir(tafsirs[0]?.id ?? ""));
  }, [tafsirs]);

  if (tafsirs.length <= 1) return null;

  return (
    <select
      className="audio-reciter"
      aria-label="Tafsir edition"
      value={id}
      onChange={(e) => {
        setId(e.target.value);
        writeTafsir(e.target.value);
      }}
    >
      {tafsirs.map((t) => (
        <option key={t.id} value={t.id}>
          Tafsir: {t.name}
        </option>
      ))}
    </select>
  );
}
