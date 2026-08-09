"use client";

import { useEffect, useState } from "react";
import { type DownloadedSurah, ayahCountOf } from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { webAudioStore } from "../lib/audio-store";

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const card = { background: N.card, border: `1px solid ${N.border}`, borderRadius: 16 } as const;

/**
 * Offline downloads manager (#202): lists the reciter audio saved on this device
 * (Cache API), with size and delete. Reads the `AudioStore` directly — a client
 * concern, since the cache is browser-local.
 */
export function DownloadsManager({
  surahNames,
  reciterNames,
}: {
  surahNames: Record<number, string>;
  reciterNames: Record<string, string>;
}) {
  const [items, setItems] = useState<DownloadedSurah[] | null>(null);

  const refresh = () => void webAudioStore.savedSurahs().then((s) => setItems([...s]));
  useEffect(() => {
    refresh();
  }, []);

  if (items === null) return null;

  const total = items.reduce((n, i) => n + i.bytes, 0);

  if (items.length === 0) {
    return (
      <div style={{ ...card, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ opacity: 0.5, marginBottom: 14, display: "grid", placeItems: "center" }}>
          <Icon name="download" size={40} color={N.goldDim} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: N.fg, fontFamily: N.ui, marginBottom: 8 }}>
          Nothing downloaded yet
        </div>
        <div style={{ fontSize: 14, color: N.muted, fontFamily: N.ui, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
          Open a surah, pick a reciter, and tap the download button in the audio player to save it for
          offline listening. Saved recitations play with no connection.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: N.faint, fontFamily: N.ui }}>
        {items.length} download{items.length === 1 ? "" : "s"} · {fmtBytes(total)} on this device
      </div>
      {items.map((it) => {
        const full = ayahCountOf(it.surah);
        const partial = it.ayahCount < full;
        return (
          <div
            key={`${it.reciterId}:${it.surah}`}
            style={{ ...card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>
                {surahNames[it.surah] ?? `Surah ${it.surah}`}
              </div>
              <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2, fontFamily: N.ui }}>
                {reciterNames[it.reciterId] ?? it.reciterId} · {it.ayahCount}/{full} āyāt ·{" "}
                {fmtBytes(it.bytes)}
                {partial && <span style={{ color: N.gold }}> · incomplete</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await webAudioStore.removeSurah(it.reciterId, it.surah);
                refresh();
              }}
              aria-label={`Delete ${surahNames[it.surah] ?? `Surah ${it.surah}`} download`}
              title="Delete download"
              style={{
                flexShrink: 0,
                background: "none",
                border: `1px solid ${N.border}`,
                borderRadius: 9,
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: N.muted,
              }}
            >
              <Icon name="close" size={16} color={N.muted} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
