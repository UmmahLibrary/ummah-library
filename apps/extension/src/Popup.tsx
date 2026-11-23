import { useEffect, useMemo, useState } from "react";
import { formatHijri, gregorianToHijri, homeAction, verseOfDay } from "@ummahlibrary/core";
import type { ResumePoint, Surah, Translation } from "@ummahlibrary/core";
import { Icon, Logo, N, noorThemes } from "@ummahlibrary/ui";
import type { ThemeKey } from "@ummahlibrary/ui";
import { Dropdown } from "./Dropdown";
import { fetchVerse, getEditions, getSurahs } from "./lib/api";
import type { VerseData } from "./lib/api";
import { DEFAULT_EDITION } from "./lib/config";
import { todayGregorian, todayISO } from "./lib/date";
import { getLastRead, setLastRead } from "./lib/last-read";
import { homeUrl, listenUrl, openUrl, settingsUrl, surahUrl } from "./lib/links";
import { getPref, setPref } from "./lib/storage";
import { filterSurahs } from "./lib/surah-filter";
import { applyTheme, getStoredTheme, readThemeSync, setStoredTheme, THEME_KEYS } from "./lib/theme";
import {
  applyLocale,
  getStoredLocale,
  LOCALES,
  readLocaleSync,
  setStoredLocale,
  type Locale,
} from "./lib/locale";
import { MESSAGES, type MessageKey } from "./lib/messages";
import { syncIfEnabled } from "./lib/sync/sync-runtime";
import { SyncPanel } from "./SyncPanel";

type T = (key: MessageKey) => string;

/**
 * The popup leads with one clear next step (ADR 0041, "Noor for everyone"):
 * a Continue card first, then the verse of the day, then search. The extension
 * has no prayer times or reading-portion data of its own, so those lines are
 * not shown here; there is no streak (and no fire emoji) by design.
 */
export function Popup() {
  const [theme, setTheme] = useState<ThemeKey>(readThemeSync());
  const [locale, setLocale] = useState<Locale>(readLocaleSync());
  const [surahs, setSurahs] = useState<readonly Surah[]>([]);
  const [lastRead, setLastReadState] = useState<ResumePoint | null>(null);

  useEffect(() => {
    void getStoredTheme().then((key) => {
      setTheme(key);
      applyTheme(key);
    });
    void getStoredLocale().then((code) => {
      setLocale(code);
      applyLocale(code);
    });
    void getSurahs().then(setSurahs);
    void getLastRead().then(setLastReadState);
    // Cross-device sync (#25), if the user has opted in — a no-op otherwise.
    // Failures (offline, server unprovisioned) are swallowed; local-first carries on.
    void syncIfEnabled()
      .then((outcome) => {
        // A pulled theme is now in storage + the mirror — reflect it without a reopen.
        if (outcome && outcome.applied > 0)
          void getStoredTheme().then((key) => {
            setTheme(key);
            applyTheme(key);
          });
      })
      .catch(() => {});
  }, []);

  function changeTheme(key: ThemeKey) {
    setTheme(key);
    void setStoredTheme(key);
  }

  function changeLocale(code: Locale) {
    setLocale(code);
    void setStoredLocale(code);
  }

  function remember(point: ResumePoint) {
    setLastReadState(point);
    void setLastRead(point);
  }

  const t: T = (key) => MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;

  return (
    <main style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <Header />
      <ContinueCard t={t} surahs={surahs} lastRead={lastRead} />
      <VerseOfDay t={t} onOpen={remember} />
      <SurahJump t={t} surahs={surahs} onOpen={remember} />
      <SyncPanel />
      <Footer theme={theme} onTheme={changeTheme} locale={locale} onLocale={changeLocale} t={t} />
    </main>
  );
}

function Header() {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    void getPref<number>("hijriAdjust", 0).then((adjust) =>
      setLabel(formatHijri(gregorianToHijri(todayGregorian(), adjust))),
    );
  }, []);

  return (
    <header
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
    >
      <a
        href={homeUrl()}
        target="_blank"
        rel="noreferrer"
        className="ul-plain"
        style={{ minHeight: 44, display: "flex", alignItems: "center" }}
        aria-label="Open Ummah Library"
      >
        <Logo scale={0.92} />
      </a>
      {label && (
        <span
          style={{
            fontSize: 13,
            color: N.muted,
            fontWeight: 600,
            fontFamily: N.ui,
            border: `1px solid ${N.border}`,
            borderRadius: 999,
            paddingBlock: 4,
            paddingInline: 10,
            whiteSpace: "nowrap",
          }}
          title="Today's Hijri date"
        >
          {label}
        </span>
      )}
    </header>
  );
}

/** Section heading: sentence case, no letter-spacing or uppercase (it may be Urdu). */
const HEADING_STYLE = {
  margin: 0,
  fontSize: 13,
  color: N.muted,
  fontWeight: 700,
  fontFamily: N.ui,
} as const;

const CARD_STYLE = {
  background: N.card,
  border: `1px solid ${N.border}`,
  borderRadius: 14,
  paddingBlock: 14,
  paddingInline: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
} as const;

function ContinueCard({
  t,
  surahs,
  lastRead,
}: {
  t: T;
  surahs: readonly Surah[];
  lastRead: ResumePoint | null;
}) {
  const action = homeAction({
    resume: lastRead,
    activeDates: [],
    today: todayISO(),
    portionDone: false,
  });
  const at: ResumePoint = action.kind === "continue" ? action.at : { sura: 1, aya: 1 };
  const isContinue = action.kind === "continue";
  const surah = surahs.find((s) => s.number === at.sura);
  const name = surah?.transliteration ?? (at.sura === 1 ? "Al-Fātiḥah" : `Sūra ${at.sura}`);

  return (
    <section aria-labelledby="ul-continue-title" style={{ ...CARD_STYLE, borderColor: N.gold }}>
      <h2 id="ul-continue-title" style={HEADING_STYLE}>
        {isContinue ? t("popup.continueReading") : t("popup.startReading")}
      </h2>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: N.fg, fontFamily: N.ui }}>{name}</span>
        <span style={{ fontSize: 14, color: N.muted, fontFamily: N.ui }}>
          {t("popup.ayah")} {at.aya}
        </span>
        {surah && (
          <span
            dir="rtl"
            lang="ar"
            className="ul-ar"
            style={{ marginInlineStart: "auto", fontSize: 18 }}
          >
            {surah.name}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <a
          href={surahUrl(at.sura, at.aya)}
          target="_blank"
          rel="noreferrer"
          className="ul-btn ul-btn--primary"
        >
          <Icon name="book" size={18} />
          <span>{isContinue ? t("popup.continue") : t("popup.start")}</span>
        </a>
        <a href={listenUrl(at.sura, at.aya)} target="_blank" rel="noreferrer" className="ul-btn">
          <Icon name="headphones" size={18} />
          <span>{t("popup.listen")}</span>
        </a>
      </div>
    </section>
  );
}

function VerseOfDay({ t, onOpen }: { t: T; onOpen: (point: ResumePoint) => void }) {
  const [edition, setEdition] = useState<string>(DEFAULT_EDITION);
  const [editions, setEditions] = useState<readonly Translation[]>([]);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    void getPref<string>("edition", DEFAULT_EDITION).then(setEdition);
    void getEditions().then(setEditions);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const ref = verseOfDay(todayISO());
    void fetchVerse(ref.sura, ref.aya, edition).then((v) => {
      if (cancelled) return;
      setVerse(v);
      setState(v ? "ready" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [edition]);

  function onEdition(next: string) {
    setEdition(next);
    void setPref("edition", next);
  }

  const translator = editions.find((e) => e.id === edition)?.name ?? edition;

  return (
    <section aria-labelledby="ul-votd-title" style={CARD_STYLE}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <h2 id="ul-votd-title" style={HEADING_STYLE}>
          {t("popup.verseOfDay")}
        </h2>
        {editions.length > 0 && (
          <Dropdown
            ariaLabel={t("popup.translation")}
            value={edition}
            onChange={onEdition}
            options={editions.map((e) => ({ value: e.id, label: e.name }))}
          />
        )}
      </div>

      {state === "loading" && (
        <>
          <div className="ul-skeleton" style={{ height: 26, width: "92%" }} />
          <div className="ul-skeleton" style={{ height: 16, width: "100%" }} />
          <div className="ul-skeleton" style={{ height: 16, width: "70%" }} />
        </>
      )}

      {state === "error" && (
        <p style={{ margin: 0, color: N.muted, fontSize: 14 }}>
          Couldn’t load today’s verse. Check your connection and reopen.
        </p>
      )}

      {state === "ready" && verse && (
        <>
          {/* Quran text is rendered exactly as the API returns it — never retyped or normalised. */}
          <p dir="rtl" lang="ar" className="ul-ar" style={{ margin: 0, fontSize: 22 }}>
            {verse.arabic}
          </p>
          {verse.translation && (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: N.fg }}>
              {verse.translation}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 13, color: N.muted, fontFamily: N.ui }}>
            {t("popup.translation")}: {translator} · Sūra {verse.sura} : {verse.aya}
          </p>
          <a
            href={surahUrl(verse.sura, verse.aya)}
            target="_blank"
            rel="noreferrer"
            className="ul-btn"
            onClick={() => onOpen({ sura: verse.sura, aya: verse.aya })}
          >
            <Icon name="book" size={18} />
            <span>{t("popup.readVerse")}</span>
          </a>
        </>
      )}
    </section>
  );
}

function SurahJump({
  t,
  surahs,
  onOpen,
}: {
  t: T;
  surahs: readonly Surah[];
  onOpen: (point: ResumePoint) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterSurahs(surahs, query), [surahs, query]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label htmlFor="ul-surah-search" style={HEADING_STYLE}>
        {t("popup.jumpToSurah")}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            insetInlineStart: 12,
            color: N.muted,
            pointerEvents: "none",
          }}
        >
          <Icon name="search" size={18} />
        </span>
        <input
          id="ul-surah-search"
          type="search"
          value={query}
          placeholder="Name or number — e.g. Yāsīn, 36"
          aria-label="Search for a sūra"
          autoFocus
          className="ul-input"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              onOpen({ sura: results[0].number, aya: 1 });
              openUrl(surahUrl(results[0].number));
            }
          }}
        />
      </div>
      {results.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {results.map((s) => (
            <li key={s.number}>
              <a
                href={surahUrl(s.number)}
                target="_blank"
                rel="noreferrer"
                className="ul-row"
                onClick={() => onOpen({ sura: s.number, aya: 1 })}
              >
                <span style={{ color: N.muted, fontSize: 13, minWidth: 24, fontFamily: N.ui }}>
                  {s.number}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s.transliteration}</span>
                <span style={{ color: N.muted, fontSize: 13 }}>{s.englishName}</span>
                <span
                  dir="rtl"
                  lang="ar"
                  className="ul-ar"
                  style={{ marginInlineStart: "auto", color: N.muted }}
                >
                  {s.name}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Footer({
  theme,
  onTheme,
  locale,
  onLocale,
  t,
}: {
  theme: ThemeKey;
  onTheme: (key: ThemeKey) => void;
  locale: Locale;
  onLocale: (code: Locale) => void;
  t: T;
}) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${N.borderSoft}`,
        paddingTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span id="ul-theme-label" style={HEADING_STYLE}>
          {t("popup.theme")}
        </span>
        <ThemePicker value={theme} onChange={onTheme} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span id="ul-language-label" style={HEADING_STYLE}>
          {t("common.language")}
        </span>
        <LanguagePicker value={locale} onChange={onLocale} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <a href={homeUrl()} target="_blank" rel="noreferrer" className="ul-btn">
          <Icon name="home" size={18} />
          <span>{t("popup.openApp")}</span>
        </a>
        <a href={settingsUrl()} target="_blank" rel="noreferrer" className="ul-btn">
          <Icon name="settings" size={18} />
          <span>{t("common.settings")}</span>
        </a>
      </div>
    </footer>
  );
}

function LanguagePicker({ value, onChange }: { value: Locale; onChange: (code: Locale) => void }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby="ul-language-label"
      style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
    >
      {LOCALES.map((l) => {
        const active = l.code === value;
        return (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={active}
            lang={l.code}
            onClick={() => onChange(l.code)}
            className={active ? "ul-btn ul-btn--active" : "ul-btn"}
            style={{ flex: "1 1 0" }}
          >
            <Icon name={active ? "check" : "globe"} size={18} />
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ThemePicker({ value, onChange }: { value: ThemeKey; onChange: (key: ThemeKey) => void }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby="ul-theme-label"
      style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}
    >
      {THEME_KEYS.map((key) => {
        const palette = noorThemes[key];
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={key}
            onClick={() => onChange(key)}
            className={active ? "ul-btn ul-btn--active" : "ul-btn"}
            style={{ justifyContent: "flex-start" }}
          >
            {/* The swatch previews the theme; colours come from the shared Noor palette. */}
            <span
              aria-hidden
              style={{
                width: 18,
                height: 18,
                flex: "none",
                borderRadius: "50%",
                background: palette.bg,
                boxShadow: `inset 0 0 0 4px ${palette.accent}`,
                border: `1px solid ${N.border}`,
              }}
            />
            <span style={{ textTransform: "capitalize" }}>{key}</span>
          </button>
        );
      })}
    </div>
  );
}
