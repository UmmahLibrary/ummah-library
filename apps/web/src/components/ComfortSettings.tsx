"use client";

import { useEffect, useState } from "react";
import {
  COMFORT_EVENT,
  type Comfort,
  DEFAULT_COMFORT,
  readComfort,
  writeComfort,
} from "../lib/comfort-store";
import { readTransliteration, writeTransliteration } from "../lib/transliteration";
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
export type ComfortPart = "reading" | "modes" | "access" | "habit";

export function ComfortSettings({ part }: { part: ComfortPart }) {
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

  const list = (children: React.ReactNode) => (
    <div style={{ display: "grid", gap: 8 }}>{children}</div>
  );

  if (part === "reading")
    return list(
      <>
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
          id="comfort-tr-soft"
          on={c.trEmphasis === "soft"}
          onChange={(v) => set({ trEmphasis: v ? "soft" : "equal" })}
          title={t("comfort.softTitle")}
          note={t("comfort.softNote")}
        />
      </>,
    );

  if (part === "modes")
    return list(
      <>
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
      </>,
    );

  if (part === "access")
    return list(
      <>
        <Switch
          id="comfort-large"
          on={c.largeButtons}
          onChange={(v) => set({ largeButtons: v })}
          title={t("comfort.largeTitle")}
          note={t("comfort.largeNote")}
        />
        <Switch
          id="comfort-dyslexia"
          on={c.dyslexia}
          onChange={(v) => set({ dyslexia: v })}
          title={t("comfort.dyslexiaTitle")}
          note={t("comfort.dyslexiaNote")}
        />
        <Switch
          id="comfort-motion"
          on={c.reduceMotion}
          onChange={(v) => set({ reduceMotion: v })}
          title={t("comfort.motionTitle")}
          note={t("comfort.motionNote")}
        />
      </>,
    );

  return list(
    <>
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
    </>,
  );
}
