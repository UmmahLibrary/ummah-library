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
import { Icon, N } from "./noor";
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
    <div>
      {/* Morning / Evening segmented toggle */}
      <div
        role="tablist"
        aria-label="Adhkar set"
        style={{
          display: "flex",
          width: "fit-content",
          border: `1px solid ${N.border}`,
          borderRadius: 10,
          overflow: "hidden",
          background: N.card,
          marginBottom: 16,
        }}
      >
        {ADHKAR_OCCASIONS.map((o) => {
          const active = o.id === occasion;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setOccasion(o.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                fontFamily: N.ui,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? N.ink : N.muted,
                background: active ? N.gold : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {o.label}
              <span className="noor-ar" style={{ fontSize: 13, opacity: 0.85 }}>
                {o.arabic}
              </span>
            </button>
          );
        })}
      </div>

      {/* Session progress + reset */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          style={{ flex: 1, height: 6, borderRadius: 3, background: N.border, overflow: "hidden" }}
        >
          <div
            style={{
              width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`,
              height: "100%",
              background: N.goldGrad,
              transition: "width .2s",
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: allDone ? N.gold : N.faint, whiteSpace: "nowrap" }}>
          {allDone ? "Completed for today 🤍" : `${progress.completed} / ${progress.total} done`}
        </span>
        <button
          type="button"
          onClick={resetSet}
          style={{
            fontFamily: N.ui,
            fontSize: 13,
            color: N.muted,
            background: N.card,
            border: `1px solid ${N.border}`,
            borderRadius: 999,
            padding: "5px 14px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {/* Dhikr cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((d) => {
          const count = counts[d.id] ?? 0;
          const done = isDhikrComplete(count, d.repeat);
          const pct = d.repeat ? Math.min(1, count / d.repeat) * 100 : 0;
          return (
            <div key={d.id}>
              <button
                type="button"
                onClick={() => tap(d)}
                aria-label={`${d.transliteration} — tap to count, ${count} of ${d.repeat}`}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: 22,
                  borderRadius: 16,
                  border: `1px solid ${done ? N.gold : N.border}`,
                  background: done ? N.goldSoft : N.card,
                  cursor: "pointer",
                  fontFamily: N.ui,
                }}
              >
                <div
                  className="noor-ar"
                  dir="rtl"
                  lang="ar"
                  style={{
                    fontSize: 26,
                    lineHeight: 2,
                    color: N.fg,
                    textAlign: "right",
                    marginBottom: 12,
                  }}
                >
                  {d.arabic}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontStyle: "italic",
                    color: N.gold,
                    marginBottom: 6,
                    opacity: 0.9,
                  }}
                >
                  {d.transliteration}
                </div>
                <div style={{ fontSize: 15, color: N.muted, lineHeight: 1.6 }}>{d.translation}</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 110,
                        height: 6,
                        borderRadius: 3,
                        background: N.border,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${ready ? pct : 0}%`,
                          height: "100%",
                          background: N.goldGrad,
                          transition: "width .2s",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: N.faint }}>
                      {ready ? `${count} / ${d.repeat}` : d.repeatLabel}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: done ? N.gold : N.faint,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {done ? (
                      <>
                        <Icon name="check" size={15} /> Done
                      </>
                    ) : (
                      "Tap to count"
                    )}
                  </span>
                </div>
              </button>
              {(d.virtue || d.source) && (
                <details style={{ margin: "8px 4px 0", fontSize: 14 }}>
                  <summary style={{ cursor: "pointer", color: N.muted }}>
                    Virtue &amp; source
                  </summary>
                  {d.virtue && (
                    <p style={{ margin: "8px 0 0", color: N.muted, lineHeight: 1.55 }}>
                      {d.virtue}
                    </p>
                  )}
                  {d.source && (
                    <p
                      style={{ margin: "8px 0 0", color: N.muted, fontSize: 13, lineHeight: 1.55 }}
                    >
                      {d.source}
                    </p>
                  )}
                </details>
              )}
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: 24,
          color: N.faint,
          fontSize: 13,
          textAlign: "center",
          fontFamily: N.ui,
        }}
      >
        Tap a dhikr to count it · progress is kept on your device and resets each day · adhkar from
        Ḥiṣn al-Muslim.
      </p>
    </div>
  );
}
