"use client";

import { useEffect, useState } from "react";
import { DHIKR_PHRASES } from "@ummahlibrary/core";
import { N } from "./noor";
import { NoorPageFrame } from "./NoorPageFrame";

const PRESET_IDS = ["subhanallah", "alhamdulillah", "allahuakbar", "tahlil"] as const;

const PHRASE_TARGETS: Record<string, number> = {
  subhanallah: 33,
  alhamdulillah: 33,
  allahuakbar: 34,
  tahlil: 100,
};

const STORAGE_KEY = "ul.tasbih2";

interface Stored {
  phraseId: string;
  count: number;
  cycles: number;
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* ignore */
  }
  return { phraseId: DHIKR_PHRASES[0]!.id, count: 0, cycles: 0 };
}

function save(s: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function TasbihPageClient() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Stored>({
    phraseId: DHIKR_PHRASES[0]!.id,
    count: 0,
    cycles: 0,
  });
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const stored = load();
    setState(stored);
    setReady(true);
  }, []);

  const presets = DHIKR_PHRASES.filter((p) => (PRESET_IDS as readonly string[]).includes(p.id));
  const phrase = DHIKR_PHRASES.find((p) => p.id === state.phraseId) ?? presets[0]!;
  const target = PHRASE_TARGETS[state.phraseId] ?? 33;

  function update(next: Stored) {
    setState(next);
    save(next);
  }

  function tap() {
    setPulse((v) => v + 1);
    setState((prev) => {
      const newCount = prev.count + 1;
      const target = PHRASE_TARGETS[prev.phraseId] ?? 33;
      const next: Stored =
        newCount >= target
          ? { ...prev, count: 0, cycles: prev.cycles + 1 }
          : { ...prev, count: newCount };
      save(next);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(newCount >= target ? 60 : 12);
      }
      return next;
    });
  }

  function selectPhrase(phraseId: string) {
    update({ phraseId, count: 0, cycles: 0 });
  }

  function reset() {
    update({ phraseId: state.phraseId, count: 0, cycles: 0 });
  }

  const pct = target > 0 ? state.count / target : 0;
  const R = 130;
  const C = 2 * Math.PI * R;
  const totalToday = state.cycles * target + state.count;

  const resetBtn = (
    <button
      onClick={reset}
      style={{
        padding: "9px 16px",
        borderRadius: 10,
        border: `1px solid ${N.border}`,
        background: N.card,
        color: N.muted,
        fontFamily: N.ui,
        fontSize: 13.5,
        cursor: "pointer",
      }}
    >
      Reset
    </button>
  );

  return (
    <NoorPageFrame
      title="Tasbih Counter"
      sub="Tap anywhere on the dial to count"
      glyph="◍"
      back="/"
      actions={ready ? resetBtn : undefined}
      maxW={560}
    >
      {!ready ? null : (
        <>
          <style>{`@keyframes ulTap{0%{transform:scale(1)}50%{transform:scale(.96)}100%{transform:scale(1)}}`}</style>

          {/* Preset pills */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            {presets.map((p) => {
              const active = p.id === state.phraseId;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPhrase(p.id)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: `1px solid ${active ? N.gold : N.border}`,
                    background: active ? N.goldSoft : N.card,
                    color: active ? N.gold : N.muted,
                    fontFamily: N.ui,
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: "pointer",
                    transition: "border-color .15s, background .15s, color .15s",
                  }}
                >
                  {p.transliteration}
                </button>
              );
            })}
          </div>

          {/* Circular dial */}
          <div
            onClick={tap}
            role="button"
            aria-label={`Count — ${state.count} of ${target}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                tap();
              }
            }}
            style={{
              position: "relative",
              width: 300,
              height: 300,
              margin: "0 auto",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {/* SVG ring */}
            <svg
              width="300"
              height="300"
              style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
              aria-hidden="true"
            >
              <circle
                cx="150"
                cy="150"
                r={R}
                fill="none"
                strokeWidth="10"
                style={{ stroke: N.border }}
              />
              <circle
                cx="150"
                cy="150"
                r={R}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
                style={{ stroke: N.gold, transition: "stroke-dashoffset .3s ease" }}
              />
            </svg>

            {/* Inner dial with tap animation */}
            <div
              key={pulse}
              style={{
                position: "absolute",
                width: 224,
                height: 224,
                borderRadius: "50%",
                background: `radial-gradient(circle at 50% 35%, ${N.cardHi}, ${N.card})`,
                border: `1px solid ${N.border}`,
                display: "grid",
                placeItems: "center",
                animation: "ulTap .18s ease",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: N.ar,
                    direction: "rtl",
                    textAlign: "center",
                    fontSize: 26,
                    color: N.goldHi,
                    marginBottom: 6,
                  }}
                >
                  {phrase.arabic}
                </div>
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    color: N.fg,
                    lineHeight: 1,
                    letterSpacing: -2,
                    fontFamily: N.ui,
                    textAlign: "center",
                  }}
                >
                  {state.count}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: N.faint,
                    marginTop: 6,
                    fontFamily: N.ui,
                    textAlign: "center",
                  }}
                >
                  of {target}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 26 }}>
            {(
              [
                { big: state.cycles, label: "Cycles complete" },
                { big: totalToday, label: "Total today" },
              ] as const
            ).map(({ big, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: N.gold,
                    letterSpacing: -1,
                    fontFamily: N.ui,
                  }}
                >
                  {big}
                </div>
                <div style={{ fontSize: 12.5, color: N.faint, marginTop: 2, fontFamily: N.ui }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Meaning */}
          <div
            style={{
              textAlign: "center",
              marginTop: 18,
              fontSize: 13.5,
              color: N.muted,
              fontFamily: N.ui,
            }}
          >
            {phrase.meaning}
          </div>
        </>
      )}
    </NoorPageFrame>
  );
}
