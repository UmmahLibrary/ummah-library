"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Khatam, N } from "@ummahlibrary/ui";
import { markOnboarded } from "../lib/onboarding-store";

/**
 * First-run intro overlay — the web counterpart of the mobile OnboardingScreen
 * (same three slides). Shown once, gated by the `ul.onboarded` flag.
 *
 * Flash-free: the inline script in `layout.tsx` sets `data-onboard="1"` on
 * <html> before first paint when the flag is unset, and a server-rendered veil
 * (`#ul-onboard-veil`, styled in globals.css) covers the app until this React
 * overlay hydrates on top. Finishing clears the attribute and the flag.
 */

const SLIDES = [
  {
    title: "The Qur’ān, beautifully open",
    body: "Read, listen and reflect — with translation, tafsīr and word-by-word recitation, free and ad-free forever.",
  },
  {
    title: "Memorize with confidence",
    body: "Spaced-repetition Hifz, a daily reading goal and a khatma planner keep your journey on track.",
  },
  {
    title: "Your faith companion",
    body: "Prayer times, qibla, adhkār, the 99 Names and more — all local-first, with no account needed.",
  },
];

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Read the pre-paint flag set by the inline script, so SSR and the first
  // client render agree (both render nothing) — no hydration mismatch.
  useEffect(() => {
    if (document.documentElement.dataset.onboard === "1") setShow(true);
  }, []);

  const finish = useCallback(() => {
    markOnboarded();
    document.documentElement.removeAttribute("data-onboard");
    setShow(false);
  }, []);

  const last = i === SLIDES.length - 1;
  const advance = useCallback(() => (last ? finish() : setI((n) => n + 1)), [last, finish]);

  // Move keyboard focus onto the primary action as each slide appears.
  useEffect(() => {
    if (show) nextRef.current?.focus();
  }, [show, i]);

  // Escape skips; Tab is trapped within the dialog's focusable controls.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("button");
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0]!;
      const lastEl = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    },
    [finish],
  );

  if (!show) return null;

  const slide = SLIDES[i]!;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Ummah Library"
      ref={dialogRef}
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: N.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 30px 32px",
        fontFamily: N.ui,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: 440,
        }}
      >
        <div style={{ position: "relative", display: "grid", placeItems: "center", marginBottom: 40 }}>
          <Khatam size={184} color={N.gold} sw={1.1} opacity={0.9} />
          <div style={{ position: "absolute" }}>
            <Khatam size={104} color={N.goldHi} sw={1.4} opacity={0.5} />
          </div>
        </div>
        <h1
          style={{
            color: N.fg,
            fontSize: "clamp(1.7rem, 6vw, 2rem)",
            fontWeight: 800,
            letterSpacing: -0.6,
            lineHeight: 1.2,
            margin: "0 0 14px",
          }}
        >
          {slide.title}
        </h1>
        <p style={{ color: N.muted, fontSize: "1.02rem", lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
          {slide.body}
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 7 }} aria-hidden="true">
          {SLIDES.map((_, d) => (
            <span
              key={d}
              style={{
                width: d === i ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: d === i ? N.gold : N.border,
                transition: "width .2s ease",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          ref={nextRef}
          onClick={advance}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 14,
            border: "1px solid transparent",
            background: N.goldGrad,
            color: N.ink,
            fontSize: "1.05rem",
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: N.ui,
          }}
        >
          {last ? "Get started" : "Continue"}
        </button>
        <button
          type="button"
          onClick={finish}
          style={{
            background: "none",
            border: "none",
            color: N.muted,
            fontSize: "0.92rem",
            padding: "4px 8px",
            cursor: "pointer",
            fontFamily: N.ui,
            visibility: last ? "hidden" : "visible",
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
