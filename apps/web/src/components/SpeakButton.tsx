"use client";

import { useEffect, useState } from "react";
import { Icon } from "@ummahlibrary/ui";
import { useLocale } from "../i18n/I18nProvider";

/**
 * "Read this aloud" for interface text, for people who don't read well
 * (ADR 0041). Uses the device's own speech voice in the interface language.
 * Interface text only — Quranic Arabic is never synthesised: recitation always
 * comes from recorded reciters.
 */
export function SpeakButton({ text, label = "Read aloud" }: { text: string; label?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* unsupported */
      }
    };
  }, []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  return (
    <button
      type="button"
      className="nf-speak"
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? "Stop reading aloud" : label}
      title={speaking ? "Stop" : label}
    >
      <Icon name={speaking ? "close" : "headphones"} size={18} />
    </button>
  );
}
