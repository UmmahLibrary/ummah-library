"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Khatam, N } from "@ummahlibrary/ui";
import { markOnboarded } from "../lib/onboarding-store";
import { useI18n, useIntl, useT } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import { LOCALES, type Locale } from "../i18n/config";
import { SCRIPT_INDOPAK_CLASS, fetchSurahIndopak, readScript, writeScript } from "../lib/script";
import type { QuranScript } from "@ummahlibrary/core";
import { applyTheme } from "../lib/themes";
import { type ReadingPath, writeComfort } from "../lib/comfort-store";
import { writeTransliteration } from "../lib/transliteration";
import { SAMPLE_FATIHA_2 } from "../lib/quran-samples";
import { SizeControls } from "./SizeControls";
import { SpeakButton } from "./SpeakButton";

/**
 * First-run comfort setup (ADR 0041): language, script, text size, light or
 * dark, and how the reader takes in the Quran. Every step previews its effect
 * live and can be skipped ("Skip, use these").
 *
 * Flash-free: the inline script in `layout.tsx` sets `data-onboard="1"` on
 * <html> before first paint when the `ul.onboarded` flag is unset, and a
 * server-rendered veil covers the app until this overlay hydrates on top.
 */

const STEPS = ["language", "script", "size", "theme", "path"] as const;
type Step = (typeof STEPS)[number];

const TITLES: Record<Step, MessageKey> = {
  language: "onb.titleLanguage",
  script: "onb.titleScript",
  size: "onb.titleSize",
  theme: "onb.titleTheme",
  path: "onb.titlePath",
};

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const { t, tf, dir } = useIntl();

  useEffect(() => {
    if (document.documentElement.dataset.onboard === "1") setShow(true);
  }, []);

  const finish = useCallback(() => {
    markOnboarded();
    writeComfort({ setupDone: true });
    document.documentElement.removeAttribute("data-onboard");
    setShow(false);
  }, []);

  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;
  const next = useCallback(() => (last ? finish() : setI((n) => n + 1)), [last, finish]);

  useEffect(() => {
    if (show) primaryRef.current?.focus();
  }, [show, i]);

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

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ul-setup-title"
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: N.bg,
        color: N.fg,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        fontFamily: N.ui,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          padding:
            "max(20px, env(safe-area-inset-top, 0px)) 20px max(20px, env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Khatam size={34} color={N.gold} sw={1.4} />
            <span style={{ fontSize: 14, color: N.muted, fontWeight: 600 }}>
              {tf("onb.stepOf", { n: i + 1, total: STEPS.length })}
            </span>
          </div>
          <SpeakButton text={t(TITLES[step])} label={t("onb.readQuestion")} />
        </div>

        <div style={{ display: "flex", gap: 6 }} aria-hidden="true">
          {STEPS.map((s, n) => (
            <span
              key={s}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 5,
                background: n <= i ? N.gold : N.border,
              }}
            />
          ))}
        </div>

        <h1
          id="ul-setup-title"
          style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}
        >
          {t(TITLES[step])}
        </h1>

        <div style={{ display: "grid", gap: 10 }}>
          {step === "language" && <LanguageStep onPick={next} />}
          {step === "script" && <ScriptStep onPick={next} />}
          {step === "size" && <SizeControls />}
          {step === "theme" && <ThemeStep onPick={next} />}
          {step === "path" && <PathStep />}
        </div>

        <div style={{ marginTop: "auto", display: "grid", gap: 10, paddingTop: 12 }}>
          <button ref={primaryRef} type="button" className="nf-btn nf-btn--gold" onClick={next}>
            {last ? t("onb.startReading") : t("onb.next")}
          </button>
          <button type="button" className="nf-btn" onClick={finish}>
            {t("onb.skip")}
          </button>
          {i > 0 && (
            <button
              type="button"
              className="nf-btn"
              style={{ border: "none", color: N.muted, minHeight: 44 }}
              onClick={() => setI((n) => n - 1)}
            >
              {dir === "rtl" ? "→" : "←"} {t("onb.back")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Choice({
  on,
  onClick,
  children,
  label,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className="nf-switch"
      style={{
        minHeight: 60,
        borderColor: on ? N.gold : N.border,
        background: on ? N.goldSoft : N.card,
        borderWidth: on ? 2 : 1,
      }}
    >
      {children}
      {on && <span style={{ color: N.gold, fontWeight: 800 }}>✓</span>}
    </button>
  );
}

function LanguageStep({ onPick }: { onPick: () => void }) {
  const { locale, setLocale } = useI18n();
  return (
    <>
      {LOCALES.map((l) => (
        <Choice
          key={l.code}
          on={locale === l.code}
          onClick={() => {
            setLocale(l.code as Locale);
            onPick();
          }}
        >
          <span lang={l.code} dir={l.dir} style={{ fontSize: 18, fontWeight: 700 }}>
            {l.label}
          </span>
        </Choice>
      ))}
    </>
  );
}

function ScriptStep({ onPick }: { onPick: () => void }) {
  const [script, setScript] = useState<QuranScript | null>(null);
  const [indopak, setIndopak] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    void readScript().then(setScript);
    // The IndoPak text is fetched (not bundled — ADR 0035) and shown only in
    // its own font; if it can't load we show the name alone, never a fallback.
    void fetchSurahIndopak(1).then((m) => {
      const words = m.get(2);
      if (words?.length) setIndopak(words.join(" "));
    });
  }, []);

  const choose = (s: QuranScript) => {
    setScript(s);
    document.body.classList.toggle(SCRIPT_INDOPAK_CLASS, s === "indopak");
    void writeScript(s);
    onPick();
  };

  return (
    <>
      <Choice
        on={script === "indopak"}
        onClick={() => choose("indopak")}
        label={t("onb.indopakScript")}
      >
        <span style={{ display: "grid", gap: 4, width: "100%" }}>
          {indopak ? (
            <span
              lang="ar"
              dir="rtl"
              data-quran-text
              style={{ fontFamily: "IndoPak", fontSize: 26, lineHeight: 2.4, textAlign: "center" }}
            >
              {indopak}
            </span>
          ) : null}
          <span style={{ fontSize: 15 }}>{t("onb.indopakNote")}</span>
        </span>
      </Choice>
      <Choice
        on={script === "uthmani"}
        onClick={() => choose("uthmani")}
        label={t("onb.uthmaniScript")}
      >
        <span style={{ display: "grid", gap: 4, width: "100%" }}>
          <span
            className="arabic"
            lang="ar"
            dir="rtl"
            data-quran-text
            style={{ fontSize: 26, lineHeight: 2.1, textAlign: "center" }}
          >
            {SAMPLE_FATIHA_2.arabic}
          </span>
          <span style={{ fontSize: 15 }}>{t("onb.uthmaniNote")}</span>
        </span>
      </Choice>
    </>
  );
}

function ThemeStep({ onPick }: { onPick: () => void }) {
  const [mode, setMode] = useState<string>("");
  const t = useT();
  useEffect(() => setMode(document.documentElement.dataset.mode ?? ""), []);
  const pick = (key: "ivory" | "obsidian") => {
    applyTheme(key);
    setMode(key === "ivory" ? "light" : "dark");
    onPick();
  };
  return (
    <>
      <Choice on={mode === "light"} onClick={() => pick("ivory")}>
        <span style={{ display: "grid", gap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{t("onb.light")}</span>
          <small>{t("onb.lightNote")}</small>
        </span>
      </Choice>
      <Choice on={mode === "dark"} onClick={() => pick("obsidian")}>
        <span style={{ display: "grid", gap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{t("onb.dark")}</span>
          <small>{t("onb.darkNote")}</small>
        </span>
      </Choice>
      <p style={{ margin: 0, fontSize: 14, color: N.muted }}>{t("onb.moreThemes")}</p>
    </>
  );
}

function PathStep() {
  const [path, setPath] = useState<ReadingPath>("arabic");
  const [easy, setEasy] = useState(false);
  const t = useT();
  const choose = (p: ReadingPath) => {
    setPath(p);
    writeComfort({ readingPath: p });
    void writeTransliteration(p === "translit");
  };
  return (
    <>
      <Choice on={path === "arabic"} onClick={() => choose("arabic")}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{t("onb.pathArabic")}</span>
      </Choice>
      <Choice on={path === "translit"} onClick={() => choose("translit")}>
        <span style={{ display: "grid", gap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{t("onb.pathTranslit")}</span>
          <small>{t("onb.pathTranslitNote")}</small>
        </span>
      </Choice>
      <Choice on={path === "listen"} onClick={() => choose("listen")}>
        <span style={{ display: "grid", gap: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{t("onb.pathListen")}</span>
          <small>{t("onb.pathListenNote")}</small>
        </span>
      </Choice>
      <button
        type="button"
        role="switch"
        aria-checked={easy}
        className="nf-switch"
        onClick={() => {
          const v = !easy;
          setEasy(v);
          writeComfort({ mode: v ? "easy" : "standard" });
        }}
      >
        <span>
          {t("comfort.easyTitle")}
          <small>{t("onb.easyNote")}</small>
        </span>
        <span className="knob" aria-hidden="true" />
      </button>
    </>
  );
}
