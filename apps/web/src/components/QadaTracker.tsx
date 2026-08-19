"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import {
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type PrayerName,
  type QadaLog,
  adjustQada,
  owedFor,
  totalOwed,
} from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { QADA_EVENT, readQada, writeQada } from "../lib/qada";

const card: CSSProperties = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 16,
};
const sectionLabel: CSSProperties = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: N.faint,
  fontWeight: 700,
};

export function QadaTracker() {
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<QadaLog>({});

  useEffect(() => {
    void readQada().then(setLog);
    setReady(true);
    const onChange = () => void readQada().then(setLog);
    window.addEventListener(QADA_EVENT, onChange);
    return () => window.removeEventListener(QADA_EVENT, onChange);
  }, []);

  function adjust(prayer: PrayerName, delta: number) {
    setLog((prev) => {
      const next = adjustQada(prev, prayer, delta);
      void writeQada(next);
      return next;
    });
  }

  if (!ready) return null;

  const total = totalOwed(log);

  return (
    <div style={{ ...card, padding: 24, marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={sectionLabel}>Make-up prayers · qaḍāʾ</div>
        <div style={{ fontSize: 13, color: N.faint }}>
          <span style={{ color: N.gold, fontWeight: 800, fontSize: 18 }}>{total}</span> owed
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {OBLIGATORY_PRAYERS.map((p) => {
          const owed = owedFor(log, p);
          return (
            <div
              key={p}
              style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: N.fg }}>{PRAYER_LABELS[p]}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Step
                  label={`Make up one ${PRAYER_LABELS[p]}`}
                  symbol="−"
                  disabled={owed === 0}
                  onClick={() => adjust(p, -1)}
                />
                <span
                  aria-live="polite"
                  style={{
                    minWidth: 28,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 800,
                    color: owed ? N.gold : N.faint,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {owed}
                </span>
                <Step
                  label={`Record a missed ${PRAYER_LABELS[p]}`}
                  symbol="+"
                  onClick={() => adjust(p, 1)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: N.faint, marginTop: 14, marginBottom: 0 }}>
        Tap + when you miss a prayer, − as you make it up. Stored on your device.
      </p>
    </div>
  );
}

function Step({
  label,
  symbol,
  onClick,
  disabled,
}: {
  label: string;
  symbol: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${N.border}`,
        background: disabled ? "transparent" : N.goldSoft,
        color: disabled ? N.faint : N.gold,
        cursor: disabled ? "default" : "pointer",
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: N.ui,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {symbol}
    </button>
  );
}
