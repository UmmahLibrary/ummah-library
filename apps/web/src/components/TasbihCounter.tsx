"use client";

import { useEffect, useState } from "react";
import { DHIKR_PHRASES, TASBIH_TARGETS, tasbihState } from "@ummahlibrary/core";

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
  const justCompleted = view.count === 0 && state.total > 0;

  function tap() {
    persist({ ...state, total: state.total + 1 });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(view.count + 1 === state.target ? 60 : 12);
    }
  }

  if (!ready) return null;

  return (
    <div className="tasbih">
      <div className="tasbih-phrase">
        <span className="tasbih-ar" dir="rtl" lang="ar">
          {phrase.arabic}
        </span>
        <span className="tasbih-meaning">
          {phrase.transliteration} — {phrase.meaning}
        </span>
      </div>

      <button
        type="button"
        className={justCompleted ? "tasbih-dial tasbih-dial--lap" : "tasbih-dial"}
        onClick={tap}
        aria-label="Count"
      >
        <span className="tasbih-count">{justCompleted ? state.target : view.count}</span>
        <span className="tasbih-target">/ {state.target}</span>
      </button>

      <p className="tasbih-rounds">
        {view.rounds} round{view.rounds === 1 ? "" : "s"} · {view.total} total
      </p>

      <div className="prayer-controls tasbih-controls">
        <label>
          <span className="prayer-control-label">Dhikr</span>
          <select
            className="audio-reciter"
            value={state.phrase}
            onChange={(e) => persist({ ...state, phrase: e.target.value })}
          >
            {DHIKR_PHRASES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.transliteration}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="prayer-control-label">Target</span>
          <select
            className="audio-reciter"
            value={state.target}
            onChange={(e) => persist({ ...state, target: Number(e.target.value) })}
          >
            {TASBIH_TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="chip" onClick={() => persist({ ...state, total: 0 })}>
          Reset
        </button>
      </div>
    </div>
  );
}
