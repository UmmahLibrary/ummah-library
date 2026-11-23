"use client";

import { useEffect, useState } from "react";
import { N, Stepper, target } from "@ummahlibrary/ui";
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
import { useIntl } from "../i18n/I18nProvider";

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
  const [size, setSize] = useState<number>(target.default);
  const { t, tf } = useIntl();

  useEffect(() => {
    const syncAr = () =>
      void readScale().then((s) => {
        setAr(s);
        document.documentElement.style.setProperty("--reading-scale", String(s));
      });
    const syncTr = () => {
      const c = readComfort();
      setTr(c.trScale);
      // Same touch-target rule as mobile: easy mode and large buttons grow.
      setSize(c.mode === "easy" ? target.easy : c.largeButtons ? target.large : target.default);
    };
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

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Stepper
        label={t("size.arabic")}
        value={tf("dock.percent", { n: Math.round(ar * 100) })}
        onDecrease={() => stepAr(-0.1)}
        onIncrease={() => stepAr(0.1)}
        canDecrease={ar > AR_SCALE_MIN}
        canIncrease={ar < AR_SCALE_MAX}
        decreaseLabel={t("size.smallerArabic")}
        increaseLabel={t("size.biggerArabic")}
        size={size}
      />
      <Stepper
        label={t("size.translation")}
        value={tf("dock.percent", { n: Math.round(tr * 100) })}
        onDecrease={() => stepTr(-0.1)}
        onIncrease={() => stepTr(0.1)}
        canDecrease={tr > TR_SCALE_MIN}
        canIncrease={tr < TR_SCALE_MAX}
        decreaseLabel={t("size.smallerTranslation")}
        increaseLabel={t("size.biggerTranslation")}
        size={size}
      />
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
