"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADHKAR_OCCASIONS,
  type AdhkarOccasion,
  type Dhikr,
  filterByOccasion,
  isDhikrComplete,
  nextTally,
  sessionProgress,
} from "@ummahlibrary/core";
import { readAdhkarCounts, writeAdhkarCounts } from "../lib/adhkar";

export function AdhkarView({ dhikr }: { dhikr: readonly Dhikr[] }) {
  const [occasion, setOccasion] = useState<AdhkarOccasion>("morning");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCounts(readAdhkarCounts());
    setReady(true);
  }, []);

  const items = useMemo(() => filterByOccasion(dhikr, occasion), [dhikr, occasion]);
  const progress = sessionProgress(items, counts);
  const allDone = progress.total > 0 && progress.completed === progress.total;

  function tap(d: Dhikr) {
    setCounts((prev) => {
      const next = { ...prev, [d.id]: nextTally(prev[d.id] ?? 0, d.repeat) };
      writeAdhkarCounts(next);
      return next;
    });
  }

  function resetSet() {
    setCounts((prev) => {
      const next = { ...prev };
      for (const d of items) delete next[d.id];
      writeAdhkarCounts(next);
      return next;
    });
  }

  return (
    <div className="adhkar">
      <div className="adhkar-tabs" role="tablist" aria-label="Adhkar set">
        {ADHKAR_OCCASIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={o.id === occasion}
            className={o.id === occasion ? "adhkar-tab adhkar-tab--active" : "adhkar-tab"}
            onClick={() => setOccasion(o.id)}
          >
            <span>{o.label}</span>
            <span className="adhkar-tab-ar">{o.arabic}</span>
          </button>
        ))}
      </div>

      <div className={allDone ? "adhkar-progress adhkar-progress--done" : "adhkar-progress"}>
        <div className="adhkar-progress-bar">
          <span
            style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
          />
        </div>
        <span className="adhkar-progress-text">
          {allDone ? "Completed for today 🤍" : `${progress.completed} / ${progress.total} done`}
        </span>
        <button type="button" className="chip" onClick={resetSet}>
          Reset
        </button>
      </div>

      <ol className="adhkar-list">
        {items.map((d, i) => {
          const count = counts[d.id] ?? 0;
          const done = isDhikrComplete(count, d.repeat);
          return (
            <li key={d.id}>
              <button
                type="button"
                className={done ? "adhkar-card adhkar-card--done" : "adhkar-card"}
                onClick={() => tap(d)}
                aria-label={`${d.transliteration} — tap to count, ${count} of ${d.repeat}`}
              >
                <div className="adhkar-card-head">
                  <span className="adhkar-num">{i + 1}</span>
                  <span className="adhkar-counter">
                    {ready ? `${count} / ${d.repeat}` : `${d.repeatLabel}`}
                    {done && <span className="adhkar-check"> ✓</span>}
                  </span>
                </div>
                <p className="adhkar-arabic" dir="rtl" lang="ar">
                  {d.arabic}
                </p>
                <p className="adhkar-translit">{d.transliteration}</p>
                <p className="adhkar-translation">{d.translation}</p>
              </button>
              {(d.virtue || d.source) && (
                <details className="adhkar-meta">
                  <summary>Virtue &amp; source</summary>
                  {d.virtue && <p className="adhkar-virtue">{d.virtue}</p>}
                  {d.source && <p className="adhkar-source">{d.source}</p>}
                </details>
              )}
            </li>
          );
        })}
      </ol>

      <p className="foot">
        Tap a dhikr to count it · progress is kept on your device and resets each day · adhkar from
        Ḥiṣn al-Muslim.
      </p>
    </div>
  );
}
