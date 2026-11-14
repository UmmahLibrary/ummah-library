"use client";

import { useEffect, useState } from "react";
import { N } from "@ummahlibrary/ui";
import {
  COMFORT_EVENT,
  type Comfort,
  DEFAULT_COMFORT,
  readComfort,
  writeComfort,
} from "../lib/comfort-store";
import { readTransliteration, writeTransliteration } from "../lib/transliteration";
import { SizeControls } from "./SizeControls";
import { useT } from "../i18n/I18nProvider";

function Switch({
  id,
  on,
  onChange,
  title,
  note,
}: {
  id: string;
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  note: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      className="nf-switch"
      onClick={() => onChange(!on)}
    >
      <span>
        {title}
        <small>{note}</small>
      </span>
      <span className="knob" aria-hidden="true" />
    </button>
  );
}

/**
 * Settings → Reading comfort (ADR 0041): separate Arabic and translation sizes,
 * translation emphasis, dyslexia-friendly spacing, reduced motion, larger
 * buttons, transliteration, Easy and Kids mode, and gentle habit tracking.
 */
export function ComfortSettings() {
  const [c, setC] = useState<Comfort>(DEFAULT_COMFORT);
  const [translit, setTranslit] = useState(false);
  const t = useT();

  useEffect(() => {
    const refresh = () => setC(readComfort());
    refresh();
    void readTransliteration().then(setTranslit);
    window.addEventListener(COMFORT_EVENT, refresh);
    return () => window.removeEventListener(COMFORT_EVENT, refresh);
  }, []);

  const set = (patch: Partial<Comfort>) => setC(writeComfort(patch));
  const h = { margin: 0, fontFamily: N.ui, fontSize: 18, fontWeight: 800, color: N.fg } as const;

  return (
    <section
      id="comfort"
      aria-labelledby="comfort-title"
      style={{ display: "grid", gap: 14, scrollMarginTop: 80 }}
    >
      <h2 id="comfort-title" style={h}>
        {t("comfort.title")}
      </h2>
      <SizeControls />

      <div style={{ display: "grid", gap: 8 }}>
        <Switch
          id="comfort-tr-soft"
          on={c.trEmphasis === "soft"}
          onChange={(v) => set({ trEmphasis: v ? "soft" : "equal" })}
          title={t("comfort.softTitle")}
          note={t("comfort.softNote")}
        />
        <Switch
          id="comfort-translit"
          on={translit}
          onChange={(v) => {
            setTranslit(v);
            void writeTransliteration(v);
          }}
          title={t("comfort.translitTitle")}
          note={t("comfort.translitNote")}
        />
        <Switch
          id="comfort-dyslexia"
          on={c.dyslexia}
          onChange={(v) => set({ dyslexia: v })}
          title={t("comfort.dyslexiaTitle")}
          note={t("comfort.dyslexiaNote")}
        />
        <Switch
          id="comfort-large"
          on={c.largeButtons}
          onChange={(v) => set({ largeButtons: v })}
          title={t("comfort.largeTitle")}
          note={t("comfort.largeNote")}
        />
        <Switch
          id="comfort-motion"
          on={c.reduceMotion}
          onChange={(v) => set({ reduceMotion: v })}
          title={t("comfort.motionTitle")}
          note={t("comfort.motionNote")}
        />
      </div>

      <h2 style={{ ...h, marginTop: 8 }}>{t("comfort.modes")}</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <Switch
          id="comfort-easy"
          on={c.mode === "easy"}
          onChange={(v) => set({ mode: v ? "easy" : "standard" })}
          title={t("comfort.easyTitle")}
          note={t("comfort.easyNote")}
        />
        <Switch
          id="comfort-kids"
          on={c.mode === "kids"}
          onChange={(v) => set({ mode: v ? "kids" : "standard" })}
          title={t("comfort.kidsTitle")}
          note={t("comfort.kidsNote")}
        />
      </div>

      <h2 style={{ ...h, marginTop: 8 }}>{t("comfort.habit")}</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <Switch
          id="comfort-streaks"
          on={c.showStreaks}
          onChange={(v) => set({ showStreaks: v })}
          title={t("comfort.streakTitle")}
          note={t("comfort.streakNote")}
        />
        <Switch
          id="comfort-pause"
          on={c.trackingPaused}
          onChange={(v) => set({ trackingPaused: v })}
          title={t("comfort.pauseTitle")}
          note={t("comfort.pauseNote")}
        />
      </div>
    </section>
  );
}
