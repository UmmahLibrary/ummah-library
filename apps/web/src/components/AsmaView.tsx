"use client";

import { useEffect, useState } from "react";
import type { DivineName } from "@ummahlibrary/core";

const KEY = "ul.asmaLearned";

export function AsmaView({ names }: { names: readonly DivineName[] }) {
  const [learned, setLearned] = useState<Record<number, true>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLearned(JSON.parse(raw) as Record<number, true>);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function toggle(n: number) {
    setLearned((prev) => {
      const next = { ...prev };
      if (next[n]) delete next[n];
      else next[n] = true;
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const count = Object.keys(learned).length;

  return (
    <div className="asma">
      {ready && (
        <div className="asma-progress">
          <div className="goal-bar">
            <span style={{ width: `${(count / names.length) * 100}%` }} />
          </div>
          <span className="asma-progress-text">{count} / {names.length} marked</span>
        </div>
      )}
      <ol className="asma-list">
        {names.map((n) => (
          <li key={n.number}>
            <button
              type="button"
              className={ready && learned[n.number] ? "asma-card asma-card--done" : "asma-card"}
              onClick={() => toggle(n.number)}
              aria-pressed={ready ? Boolean(learned[n.number]) : false}
            >
              <div className="asma-head">
                <span className="asma-num">{n.number}</span>
                <span className="asma-ar" dir="rtl" lang="ar">
                  {n.arabic}
                </span>
              </div>
              <span className="asma-translit">{n.transliteration}</span>
              <span className="asma-meaning">{n.meaning}</span>
              {n.description && <span className="asma-desc">{n.description}</span>}
              {n.references.length > 0 && (
                <span className="asma-refs">{n.references.join(" · ")}</span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
