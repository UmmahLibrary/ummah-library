"use client";

import { useEffect, useState } from "react";
import { DHIKR_PHRASES, TASBIH_TARGETS, tasbihState } from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";

const KEY = "ul.tasbih";

interface Stored {
  total: number;
  target: number;
  phrase: string;
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* ignore */
  }
  return { total: 0, target: 33, phrase: "subhanallah" };
}

export function TasbihCounter() {
  const [state, setState] = useState<Stored>({ total: 0, target: 33, phrase: "subhanallah" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  function persist(next: Stored) {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const view = tasbihState(state.total, state.target);
  const phrase = DHIKR_PHRASES.find((p) => p.id === state.phrase) ?? DHIKR_PHRASES[0]!;

  function tap() {
    persist({ ...state, total: state.total + 1 });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(view.count + 1 === state.target ? 60 : 12);
    }
  }

  if (!ready) return null;

  const R = 130;
  const C = 2 * Math.PI * R;
  const pct = state.target > 0 ? view.count / state.target : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Preset pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        {DHIKR_PHRASES.map((p) => {
          const active = p.id === state.phrase;
          return (
            <button
              key={p.id}
              onClick={() => persist({ ...state, phrase: p.id })}
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
        aria-label={`Count — ${view.count} of ${state.target}`}
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
        {/* SVG progress ring */}
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

        {/* Inner dial */}
        <div
          style={{
            width: 224,
            height: 224,
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 35%, ${N.cardHi}, ${N.card})`,
            border: `1px solid ${N.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: N.ar,
              direction: "rtl",
              fontSize: 24,
              color: N.goldHi,
              lineHeight: 1.3,
            }}
          >
            {phrase.arabic}
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: N.fg,
              lineHeight: 1,
              letterSpacing: -2,
              fontFamily: N.ui,
            }}
          >
            {view.count}
          </div>
          <div style={{ fontSize: 13, color: N.faint, fontFamily: N.ui }}>of {state.target}</div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          marginTop: 28,
        }}
      >
        {(
          [
            { big: view.rounds, label: "Cycles complete" },
            { big: view.total, label: "Total today" },
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

      {/* Target selector + reset */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 22,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: N.faint, fontFamily: N.ui }}>Target:</span>
        {TASBIH_TARGETS.map((t) => {
          const active = t === state.target;
          return (
            <button
              key={t}
              onClick={() => persist({ ...state, target: t })}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: `1px solid ${active ? N.gold : N.border}`,
                background: active ? N.goldSoft : "transparent",
                color: active ? N.gold : N.muted,
                fontFamily: N.ui,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "border-color .15s, background .15s, color .15s",
              }}
            >
              {t}
            </button>
          );
        })}
        <button
          onClick={() => persist({ ...state, total: 0 })}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            border: `1px solid ${N.border}`,
            background: N.card,
            color: N.muted,
            fontFamily: N.ui,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
