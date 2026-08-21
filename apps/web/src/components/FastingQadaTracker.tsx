"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import {
  type FastingQadaLog,
  type HaidLog,
  adjustFastingMadeUp,
  fastingMadeUp,
  fastingQadaOwed,
  fastingQadaRemaining,
} from "@ummahlibrary/core";
import { N } from "@ummahlibrary/ui";
import { HAID_EVENT, readHaid } from "../lib/haid";
import { FASTING_QADA_EVENT, readFastingQada, writeFastingQada } from "../lib/fasting-qada";
import { HIJRI_ADJUST_KEY, readHijriAdjust } from "../lib/hijri";
import { today } from "../lib/prayer-tracker";

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

/**
 * Make-up fasts (ṣawm qaḍāʾ, #155). The number owed is derived from the ḥayḍ
 * pauses that fall in Ramaḍān (not entered by hand); the reader ticks them off as
 * they fast them back. Re-reads on either the ḥayḍ or the fasting-qaḍāʾ event.
 */
export function FastingQadaTracker() {
  const [ready, setReady] = useState(false);
  const [haid, setHaid] = useState<HaidLog>([]);
  const [log, setLog] = useState<FastingQadaLog>({ madeUp: 0 });
  const [todayStr, setTodayStr] = useState("");
  const [adjust, setAdjust] = useState(0);

  useEffect(() => {
    setTodayStr(today());
    void readHaid().then(setHaid);
    void readFastingQada().then(setLog);
    setReady(true);
    const onHaid = () => void readHaid().then(setHaid);
    const onQada = () => void readFastingQada().then(setLog);
    const onAdjust = () => setAdjust(readHijriAdjust());
    onAdjust();
    window.addEventListener(HAID_EVENT, onHaid);
    window.addEventListener(FASTING_QADA_EVENT, onQada);
    window.addEventListener(HIJRI_ADJUST_KEY, onAdjust);
    return () => {
      window.removeEventListener(HAID_EVENT, onHaid);
      window.removeEventListener(FASTING_QADA_EVENT, onQada);
      window.removeEventListener(HIJRI_ADJUST_KEY, onAdjust);
    };
  }, []);

  if (!ready) return null;

  const owed = todayStr ? fastingQadaOwed(haid, todayStr, adjust) : 0;
  const remaining = fastingQadaRemaining(log, owed);
  const madeUp = fastingMadeUp(log, owed);

  function adjustMadeUp(delta: number) {
    setLog((prev) => {
      const next = adjustFastingMadeUp(prev, delta, owed);
      void writeFastingQada(next);
      return next;
    });
  }

  return (
    <div style={{ ...card, padding: 24, marginTop: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: owed > 0 ? 16 : 8,
        }}
      >
        <div style={sectionLabel}>Make-up fasts · ṣawm qaḍāʾ</div>
        <div style={{ fontSize: 13, color: N.faint }}>
          <span style={{ color: N.gold, fontWeight: 800, fontSize: 18 }}>{remaining}</span> to make up
        </div>
      </div>

      {owed === 0 ? (
        <p style={{ fontSize: 13, color: N.faint, margin: 0 }}>
          No fasts to make up. Days missed during a ḥayḍ pause in Ramaḍān appear here automatically.
        </p>
      ) : (
        <>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: N.fg }}>Ramaḍān fasts to make up</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Step
                label="Mark one fast made up"
                symbol="−"
                disabled={remaining === 0}
                onClick={() => adjustMadeUp(1)}
              />
              <span
                aria-live="polite"
                style={{
                  minWidth: 28,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: remaining ? N.gold : N.faint,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {remaining}
              </span>
              <Step
                label="Undo one made-up fast"
                symbol="+"
                disabled={madeUp === 0}
                onClick={() => adjustMadeUp(-1)}
              />
            </div>
          </div>
          <p style={{ fontSize: 12, color: N.faint, marginTop: 14, marginBottom: 0 }}>
            {madeUp} of {owed} made up. Tap − as you fast each one back. Stored on your device.
          </p>
        </>
      )}
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
