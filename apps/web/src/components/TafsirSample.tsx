"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, N } from "./noor";
import { TAFSIR_KEY, readTafsir } from "../lib/tafsir";

interface TafsirMeta {
  id: string;
  name: string;
}
interface TafsirResponse {
  entries: { sura: number; aya: number; text: string }[];
}

const BASMALA_AR = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BASMALA_EN = "In the name of Allah, the Entirely Merciful, the Especially Merciful.";

/**
 * A preview of what tafsir looks like — Al-Fātiḥah's opening ayah with the real
 * commentary for the selected edition (shared via the TafsirPicker), plus a link
 * into the reader. Mirrors the design's tafsir sample card.
 */
export function TafsirSample({ tafsirs }: { tafsirs: TafsirMeta[] }) {
  const [tafsirId, setTafsirId] = useState(tafsirs[0]?.id ?? "");
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    setTafsirId(readTafsir(tafsirs[0]?.id ?? ""));
    const onChange = (e: Event) => setTafsirId((e as CustomEvent<string>).detail);
    window.addEventListener(TAFSIR_KEY, onChange as EventListener);
    return () => window.removeEventListener(TAFSIR_KEY, onChange as EventListener);
  }, [tafsirs]);

  useEffect(() => {
    if (!tafsirId) return;
    let active = true;
    setState("loading");
    fetch(`/api/v1/surahs/1/tafsirs/${tafsirId}`)
      .then((r) => (r.ok ? (r.json() as Promise<TafsirResponse>) : { entries: [] }))
      .then((data) => {
        if (!active) return;
        const entry = data.entries.find((e) => e.aya === 1);
        if (entry?.text) {
          setText(entry.text);
          setState("ready");
        } else {
          setText("");
          setState("empty");
        }
      })
      .catch(() => {
        if (active) setState("empty");
      });
    return () => {
      active = false;
    };
  }, [tafsirId]);

  const sourceName = tafsirs.find((t) => t.id === tafsirId)?.name ?? "Tafsir";

  return (
    <>
      <div
        style={{
          borderRadius: 18,
          padding: "30px clamp(20px, 4vw, 36px)",
          background: N.card,
          border: `1px solid ${N.border}`,
          marginTop: 24,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: 11.5,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: N.faint,
            fontWeight: 700,
            fontFamily: N.ui,
            marginBottom: 18,
          }}
        >
          Al-Fātiḥah · Ayah 1
        </div>
        <div
          className="noor-ar"
          style={{
            textAlign: "center",
            fontSize: "clamp(26px, 5vw, 34px)",
            lineHeight: 1.9,
            color: N.goldHi,
            marginBottom: 14,
          }}
        >
          {BASMALA_AR}
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 15.5,
            color: N.muted,
            lineHeight: 1.6,
            fontFamily: N.ui,
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          {BASMALA_EN}
        </div>
        <div style={{ height: 1, background: N.borderSoft, margin: "22px 0" }} />
        <div
          style={{
            fontSize: 11.5,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: N.gold,
            fontWeight: 700,
            fontFamily: N.ui,
            marginBottom: 12,
          }}
        >
          Tafsīr · {sourceName}
        </div>
        <div
          style={{
            fontSize: 15.5,
            lineHeight: 1.75,
            color: state === "ready" ? N.fg : N.faint,
            fontFamily: N.ui,
            whiteSpace: "pre-line",
          }}
        >
          {state === "loading"
            ? "Loading commentary…"
            : state === "empty"
              ? "Open any surah in the reader to read tafsir alongside the Arabic text."
              : text}
        </div>
      </div>
      <Link
        href="/surah/1"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 14,
          padding: 16,
          background: N.card,
          border: `1px solid ${N.border}`,
          color: N.gold,
          fontSize: 14.5,
          fontWeight: 600,
          fontFamily: N.ui,
          textDecoration: "none",
        }}
      >
        Open the full Quran reader <Icon name="arrowR" size={16} color={N.gold} />
      </Link>
    </>
  );
}
