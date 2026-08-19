"use client";

import { useEffect, useState } from "react";
import {
  DHIKR_PHRASES,
  type TasbihRecord,
  tasbihPhraseProgress,
  tasbihState,
} from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { NoorPageFrame } from "./NoorPageFrame";
import { DEFAULT_TASBIH, readTasbih, writeTasbih } from "../lib/tasbih";

const PRESET_IDS = ["subhanallah", "alhamdulillah", "allahuakbar", "tahlil"] as const;

export function TasbihPageClient() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<TasbihRecord>({ ...DEFAULT_TASBIH });
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    void readTasbih().then((stored) => {
      setState(stored);
      setReady(true);
    });
  }, []);

  const presets = DHIKR_PHRASES.filter((p) => (PRESET_IDS as readonly string[]).includes(p.id));
  const phrase = DHIKR_PHRASES.find((p) => p.id === state.phraseId) ?? presets[0]!;
  // Each phrase's own progress — switching phrases (below) never touches this.
  const progress = tasbihPhraseProgress(state, state.phraseId);
  const view = tasbihState(progress.total, progress.target);
  const target = progress.target;

  function update(next: TasbihRecord) {
    setState(next);
    void writeTasbih(next);
  }

  function tap() {
    setPulse((v) => v + 1);
    setState((prev) => {
      const cur = tasbihPhraseProgress(prev, prev.phraseId);
      const nextProgress = { total: cur.total + 1, target: cur.target };
      const next: TasbihRecord = {
        ...prev,
        phrases: { ...prev.phrases, [prev.phraseId]: nextProgress },
      };
      void writeTasbih(next);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        // count wraps to 0 exactly when a round completes
        navigator.vibrate(tasbihState(nextProgress.total, nextProgress.target).count === 0 ? 60 : 12);
      }
      return next;
    });
  }

  function selectPhrase(phraseId: string) {
    // Only the displayed phrase changes — each phrase's own total/target stays
    // put, so switching away and back doesn't lose (or merge into) progress.
    update({ ...state, phraseId });
  }

  function reset() {
    update({ ...state, phrases: { ...state.phrases, [state.phraseId]: { total: 0, target } } });
  }

  const pct = target > 0 ? view.count / target : 0;
  const R = 130;
  const C = 2 * Math.PI * R;
  const totalToday = view.total;

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
            aria-label={`Count — ${view.count} of ${target}`}
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
                  {view.count}
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
                { big: view.rounds, label: "Cycles complete" },
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
