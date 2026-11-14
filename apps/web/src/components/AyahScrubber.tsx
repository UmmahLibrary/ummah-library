"use client";

import { useRef, useState } from "react";
import { JUZ_STARTS, PAGE_STARTS, juzNumberOf, pageNumberOf } from "@ummahlibrary/core";

/**
 * A thin position rail at the reading column's edge (tablet/desktop only — see
 * `.ayah-scrubber` in noor-everyone.css). Ticks mark where a juz begins inside
 * this surah; a bubble names the āyah while dragging. Works by tap and arrow
 * keys as well as drag (WCAG 2.5.7: dragging is never the only way).
 */
export function AyahScrubber({
  sura,
  ayahCount,
  current,
  onJump,
}: {
  sura: number;
  ayahCount: number;
  current: number;
  onJump: (aya: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  if (ayahCount < 12) return null;

  const frac = (aya: number) => (ayahCount <= 1 ? 0 : (aya - 1) / (ayahCount - 1));
  const ayaAt = (clientY: number): number => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return 1;
    const f = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    return Math.round(f * (ayahCount - 1)) + 1;
  };
  const juzTicks = JUZ_STARTS.filter((v) => v.sura === sura && v.aya > 1).map((v) => v.aya);
  const shown = drag ?? Math.max(1, current);
  const label = `Āyah ${shown} · Juz ${juzNumberOf({ sura, aya: shown })} · Page ${pageNumberOf({ sura, aya: shown })}`;
  // Page ticks are dense; show them only for long surahs where they help orient.
  const pageTicks =
    ayahCount > 100
      ? PAGE_STARTS.filter((v) => v.sura === sura && v.aya > 1).map((v) => v.aya)
      : [];

  return (
    <div
      ref={ref}
      className="ayah-scrubber"
      role="slider"
      tabIndex={0}
      aria-label="Position in surah"
      aria-valuemin={1}
      aria-valuemax={ayahCount}
      aria-valuenow={shown}
      aria-valuetext={label}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setDrag(ayaAt(e.clientY));
      }}
      onPointerMove={(e) => {
        if (drag !== null) setDrag(ayaAt(e.clientY));
      }}
      onPointerUp={(e) => {
        const aya = ayaAt(e.clientY);
        setDrag(null);
        onJump(aya);
      }}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={(e) => {
        const step = e.key === "PageDown" || e.key === "PageUp" ? 10 : 1;
        if (e.key === "ArrowDown" || e.key === "PageDown")
          onJump(Math.min(ayahCount, shown + step));
        else if (e.key === "ArrowUp" || e.key === "PageUp") onJump(Math.max(1, shown - step));
        else if (e.key === "Home") onJump(1);
        else if (e.key === "End") onJump(ayahCount);
        else return;
        e.preventDefault();
      }}
    >
      <div className="rail" />
      {pageTicks.map((a) => (
        <div
          key={`p${a}`}
          className="tick"
          style={{ top: `${frac(a) * 100}%`, width: 6, left: 12, opacity: 0.5 }}
        />
      ))}
      {juzTicks.map((a) => (
        <div key={`j${a}`} className="tick" style={{ top: `${frac(a) * 100}%` }} />
      ))}
      <div className="thumb" style={{ top: `${frac(shown) * 100}%` }} />
      {drag !== null && (
        <div className="bubble" style={{ top: `${frac(shown) * 100}%` }}>
          {label}
        </div>
      )}
    </div>
  );
}
