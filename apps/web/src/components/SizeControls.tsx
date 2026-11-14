"use client";

import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import { SCALE_EVENT, readScale, writeScale } from "../lib/reader-prefs";
import {
  AR_SCALE_MAX,
  AR_SCALE_MIN,
  COMFORT_EVENT,
  TR_SCALE_MAX,
  TR_SCALE_MIN,
  readComfort,
  writeComfort,
} from "../lib/comfort-store";
import { SAMPLE_FATIHA_2 } from "../lib/quran-samples";

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Separate Arabic and translation size steppers with a live sample. Arabic size
 * is the existing synced `scale` (a pure font-size multiplier — shaping is never
 * touched); translation size is the local comfort `trScale`. A saved size is
 * never shrunk by an update: the ranges only ever grow.
 */
export function SizeControls({ sample = true }: { sample?: boolean }) {
  const [ar, setAr] = useState(1);
  const [tr, setTr] = useState(1);

  useEffect(() => {
    const syncAr = () =>
      void readScale().then((s) => {
        setAr(s);
        document.documentElement.style.setProperty("--reading-scale", String(s));
      });
    const syncTr = () => setTr(readComfort().trScale);
    syncAr();
    syncTr();
    window.addEventListener(SCALE_EVENT, syncAr);
    window.addEventListener(COMFORT_EVENT, syncTr);
    return () => {
      window.removeEventListener(SCALE_EVENT, syncAr);
      window.removeEventListener(COMFORT_EVENT, syncTr);
    };
  }, []);

  function stepAr(delta: number) {
    const next = round(Math.min(AR_SCALE_MAX, Math.max(AR_SCALE_MIN, ar + delta)));
    setAr(next);
    document.documentElement.style.setProperty("--reading-scale", String(next));
    void writeScale(next);
  }
  function stepTr(delta: number) {
    const next = round(Math.min(TR_SCALE_MAX, Math.max(TR_SCALE_MIN, tr + delta)));
    setTr(next);
    writeComfort({ trScale: next });
  }

  const label = { fontFamily: N.ui, fontSize: 14.5, fontWeight: 700, color: N.fg } as const;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={label} id="size-ar-label">
          Arabic size
        </span>
        <div className="nf-stepper" role="group" aria-labelledby="size-ar-label">
          <button
            type="button"
            onClick={() => stepAr(-0.1)}
            disabled={ar <= AR_SCALE_MIN}
            aria-label="Smaller Arabic"
          >
            −
          </button>
          <output aria-live="polite">{Math.round(ar * 100)}%</output>
          <button
            type="button"
            onClick={() => stepAr(0.1)}
            disabled={ar >= AR_SCALE_MAX}
            aria-label="Bigger Arabic"
          >
            +
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={label} id="size-tr-label">
          Translation size
        </span>
        <div className="nf-stepper" role="group" aria-labelledby="size-tr-label">
          <button
            type="button"
            onClick={() => stepTr(-0.1)}
            disabled={tr <= TR_SCALE_MIN}
            aria-label="Smaller translation"
          >
            −
          </button>
          <output aria-live="polite">{Math.round(tr * 100)}%</output>
          <button
            type="button"
            onClick={() => stepTr(0.1)}
            disabled={tr >= TR_SCALE_MAX}
            aria-label="Bigger translation"
          >
            +
          </button>
        </div>
      </div>
      {sample && (
        <div
          style={{
            border: `1px solid ${N.border}`,
            borderRadius: 14,
            padding: "10px 14px",
            display: "grid",
            gap: 4,
            background: N.bg,
          }}
        >
          <p className="ayah-ar arabic" lang="ar" dir="rtl" data-quran-text style={{ margin: 0 }}>
            {SAMPLE_FATIHA_2.arabic}
          </p>
          <p className="ayah-tr" style={{ margin: 0 }}>
            {SAMPLE_FATIHA_2.english}
          </p>
          <span style={{ fontFamily: N.ui, fontSize: 12.5, color: N.muted }}>
            Al-Fātiḥah 1:2 · The Clear Quran, Mustafa Khattab
          </span>
        </div>
      )}
    </div>
  );
}
