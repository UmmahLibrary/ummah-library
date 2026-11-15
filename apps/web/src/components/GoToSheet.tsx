"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type GoToSurahName,
  type GoToTarget,
  AYAH_COUNTS,
  HIZB_STARTS,
  JUZ_STARTS,
  PAGE_STARTS,
  TOTAL_PAGES_MADANI,
  matchSurahNames,
  parseGoTo,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { useIntl } from "../i18n/I18nProvider";

type Tab = "surah" | "juz" | "hizb" | "page";

/**
 * "Go to" — one box that understands `2:255`, `255`, `baqarah 255`, `juz 15`,
 * `page 300`, Arabic digits and Arabic names (parser in core), with pickers
 * underneath for people who'd rather tap than type. A bottom sheet on phones,
 * a centred panel on wider screens.
 */
export function GoToSheet({
  open,
  onClose,
  names,
  currentSurah,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  names: readonly GoToSurahName[];
  currentSurah?: number;
  onGo: (target: GoToTarget) => void;
}) {
  const [query, setQuery] = useState("");
  const { t: tr, tf, num, dir } = useIntl();
  const [tab, setTab] = useState<Tab>("surah");
  const [tried, setTried] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setTried(false);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const target = useMemo(
    () => parseGoTo(query, names, { currentSurah }),
    [query, names, currentSurah],
  );
  const surahList = useMemo(() => {
    const q = query.replace(/[\d٠-٩۰-۹:.\s]+$/, "").trim();
    return q ? matchSurahNames(q, names) : names;
  }, [query, names]);

  if (!open) return null;

  function go(t: GoToTarget) {
    onGo(t);
    onClose();
  }

  function submit() {
    setTried(true);
    if (target) go(target);
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => setTab(t)}
      className="goto-tab"
      data-on={tab === t ? "true" : undefined}
    >
      {label}
    </button>
  );

  const cell = (label: string, sub: string, t: GoToTarget, key: string) => (
    <button key={key} type="button" className="goto-cell" onClick={() => go(t)}>
      <b>{label}</b>
      <span>{sub}</span>
    </button>
  );

  return (
    <div className="goto-root" role="presentation">
      <div className="goto-scrim" onClick={onClose} aria-hidden="true" />
      <div className="goto-sheet" role="dialog" aria-modal="true" aria-labelledby="goto-title">
        <div className="goto-grab" aria-hidden="true" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h2
            id="goto-title"
            style={{ margin: 0, fontFamily: N.ui, fontSize: 20, fontWeight: 800, color: N.fg }}
          >
            {tr("goto.title")}
          </h2>
          <button type="button" className="goto-close" onClick={onClose}>
            <Icon name="close" size={18} />
            <span>{tr("goto.close")}</span>
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <label htmlFor="goto-input" className="sr-only">
            {tr("goto.inputLabel")}
          </label>
          <input
            id="goto-input"
            ref={inputRef}
            className="goto-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              currentSurah
                ? tf("goto.placeholderInSurah", { examples: "2:255, kahf, juz 15…" })
                : "2:255, kahf, juz 15, page 300…"
            }
            value={query}
            aria-invalid={tried && !target}
            aria-describedby="goto-hint"
            onChange={(e) => {
              setQuery(e.target.value);
              setTried(false);
            }}
          />
          <button type="submit" className="goto-go" disabled={!target}>
            {tr("goto.go")}
          </button>
        </form>
        <div id="goto-hint" aria-live="polite" className="goto-preview">
          {target ? (
            <button type="button" className="goto-match" onClick={() => go(target)}>
              <Icon name={dir === "rtl" ? "arrowL" : "arrowR"} size={16} />
              <span>{describeTarget(tf, target, names)}</span>
            </button>
          ) : tried && query ? (
            <span style={{ color: N.gold }}>
              {tf("goto.notFound", { examples: "“2:255”, “kahf 10”, “juz 15”, “page 300”" })}
            </span>
          ) : (
            <span>
              {tf("goto.alsoUnderstands", {
                examples: "baqarah 255 · ٢:٢٥٥ · para 15 · page 300 · hizb 30",
              })}
            </span>
          )}
        </div>

        <div role="tablist" aria-label={tr("goto.chooseBy")} className="goto-tabs">
          {tabBtn("surah", tr("goto.tabSurah"))}
          {tabBtn("juz", tr("goto.tabJuz"))}
          {tabBtn("hizb", tr("goto.tabHizb"))}
          {tabBtn("page", tr("goto.tabPage"))}
        </div>

        <div className="goto-list" role="tabpanel">
          {tab === "surah" &&
            surahList.map((s) => (
              <button
                key={s.number}
                type="button"
                className="goto-row"
                data-current={s.number === currentSurah ? "true" : undefined}
                onClick={() => go({ kind: "surah", sura: s.number, aya: 1 })}
              >
                <span className="goto-num">{num(s.number)}</span>
                <span style={{ flex: 1, minWidth: 0, textAlign: "start" }}>
                  <b>{s.transliteration}</b>
                  <small>
                    {s.englishName} ·{" "}
                    {tf("reader.ayatCount", { n: AYAH_COUNTS[s.number - 1] ?? 0 })}
                  </small>
                </span>
                <span className="goto-ar" lang="ar" dir="rtl">
                  {s.name}
                </span>
              </button>
            ))}
          {tab === "juz" && (
            <div className="goto-grid">
              {JUZ_STARTS.map((v, i) =>
                cell(
                  tf("goto.juzN", { n: i + 1 }),
                  `${v.sura}:${v.aya}`,
                  { kind: "juz", sura: v.sura, aya: v.aya, n: i + 1 },
                  `j${i}`,
                ),
              )}
            </div>
          )}
          {tab === "hizb" && (
            <div className="goto-grid">
              {HIZB_STARTS.map((v, i) =>
                cell(
                  tf("goto.hizbN", { n: i + 1 }),
                  `${v.sura}:${v.aya}`,
                  { kind: "hizb", sura: v.sura, aya: v.aya, n: i + 1 },
                  `h${i}`,
                ),
              )}
            </div>
          )}
          {tab === "page" && (
            <div className="goto-grid goto-grid--pages">
              {Array.from({ length: TOTAL_PAGES_MADANI }, (_, i) => {
                const v = PAGE_STARTS[i]!;
                return cell(
                  num(i + 1),
                  `${v.sura}:${v.aya}`,
                  { kind: "page", sura: v.sura, aya: v.aya, n: i + 1 },
                  `p${i}`,
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The Go-to preview in the interface language (core's describeGoTo is English). */
function describeTarget(
  tf: (
    key: "goto.ayah" | "goto.juz" | "goto.hizb" | "goto.page",
    vars: Record<string, string | number>,
  ) => string,
  t: GoToTarget,
  names: readonly GoToSurahName[],
): string {
  const surah = names.find((s) => s.number === t.sura)?.transliteration ?? String(t.sura);
  const key = `${t.sura}:${t.aya}`;
  switch (t.kind) {
    case "surah":
      return surah;
    case "ayah":
      return tf("goto.ayah", { surah, aya: t.aya });
    case "juz":
      return tf("goto.juz", { n: t.n ?? 0, surah, key });
    case "hizb":
      return tf("goto.hizb", { n: t.n ?? 0, surah, key });
    case "page":
      return tf("goto.page", { n: t.n ?? 0, surah, key });
  }
}
