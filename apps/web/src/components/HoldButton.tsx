"use client";

import { useRef, useState } from "react";
import { useIntl } from "../i18n/I18nProvider";

/**
 * A deliberate "press and hold" button (about 2 seconds) for leaving Easy or
 * Kids mode, so a child or an unsure user can't switch it off by accident.
 * Keyboard: hold Enter or Space.
 */
export function HoldButton({
  label,
  onHold,
  ms = 2000,
}: {
  label: string;
  onHold: () => void;
  ms?: number;
}) {
  const [progress, setProgress] = useState(0);
  const { t, dir } = useIntl();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);

  const start = () => {
    if (timer.current) return;
    started.current = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - started.current) / ms);
      setProgress(p);
      if (p >= 1) {
        stop();
        onHold();
      }
    }, 50);
  };
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress(0);
  };

  return (
    <button
      type="button"
      className="nf-btn"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={stop}
      style={{
        position: "relative",
        overflow: "hidden",
        fontSize: 14,
        background: `linear-gradient(${dir === "rtl" ? "270deg" : "90deg"}, var(--noor-gold-soft) ${progress * 100}%, transparent ${progress * 100}%)`,
      }}
    >
      {progress > 0 ? t("hold.keepHolding") : label}
    </button>
  );
}
