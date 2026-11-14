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
        Reading comfort
      </h2>
      <SizeControls />

      <div style={{ display: "grid", gap: 8 }}>
        <Switch
          id="comfort-tr-soft"
          on={c.trEmphasis === "soft"}
          onChange={(v) => set({ trEmphasis: v ? "soft" : "equal" })}
          title="Softer translation colour"
          note="Make the translation quieter than the Arabic"
        />
        <Switch
          id="comfort-translit"
          on={translit}
          onChange={(v) => {
            setTranslit(v);
            void writeTransliteration(v);
          }}
          title="Show transliteration"
          note="The Arabic sounds in Latin letters under each āyah"
        />
        <Switch
          id="comfort-dyslexia"
          on={c.dyslexia}
          onChange={(v) => set({ dyslexia: v })}
          title="Dyslexia-friendly spacing"
          note="Wider letter and line spacing for Latin-script translations (never the Arabic)"
        />
        <Switch
          id="comfort-large"
          on={c.largeButtons}
          onChange={(v) => set({ largeButtons: v })}
          title="Larger buttons"
          note="Bigger targets everywhere, easier for shaky hands"
        />
        <Switch
          id="comfort-motion"
          on={c.reduceMotion}
          onChange={(v) => set({ reduceMotion: v })}
          title="Reduce motion"
          note="No sliding or animated scrolling"
        />
      </div>

      <h2 style={{ ...h, marginTop: 8 }}>Modes</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <Switch
          id="comfort-easy"
          on={c.mode === "easy"}
          onChange={(v) => set({ mode: v ? "easy" : "standard" })}
          title="Easy mode"
          note="Three big buttons — Continue, Listen, Choose a surah — and a big Back on every page"
        />
        <Switch
          id="comfort-kids"
          on={c.mode === "kids"}
          onChange={(v) => set({ mode: v ? "kids" : "standard" })}
          title="Kids mode"
          note="Short surahs, word audio, no streaks or notifications"
        />
      </div>

      <h2 style={{ ...h, marginTop: 8 }}>Daily habit</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <Switch
          id="comfort-streaks"
          on={c.showStreaks}
          onChange={(v) => set({ showStreaks: v })}
          title="Show “days in a row”"
          note="Off by default. Home shows how many days you read this week instead."
        />
        <Switch
          id="comfort-pause"
          on={c.trackingPaused}
          onChange={(v) => set({ trackingPaused: v })}
          title="Pause tracking"
          note="Take a break from habit tracking for any reason. Your progress is kept."
        />
      </div>
    </section>
  );
}
