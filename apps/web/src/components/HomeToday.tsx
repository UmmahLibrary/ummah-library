"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type Coordinates,
  type PrayerName,
  type PrayerTimings,
  computeStreak,
  homeAction,
  juzNumberOf,
  lastSevenDays,
  nextPrayer,
  prayerIsNear,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { type LastRead, LAST_READ_EVENT, readLastReadFull } from "../lib/reader-prefs-store";
import { READING_EVENT, readReadingState, today } from "../lib/reading-goals";
import { webPrayerTimingsProvider } from "../lib/prayer-timings-provider";
import { PRAYER_SETTINGS_EVENT, webPrayerSettingsStore } from "../lib/prayer-settings-store";
import { fmtPrayerTime } from "../lib/prayer-time-format";
import { COMFORT_EVENT, type Comfort, readComfort } from "../lib/comfort-store";
import { SpeakButton } from "./SpeakButton";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

const PRAYER_KEY: Record<PrayerName, MessageKey> = {
  fajr: "prayer.fajr",
  sunrise: "prayer.sunrise",
  dhuhr: "prayer.dhuhr",
  asr: "prayer.asr",
  maghrib: "prayer.maghrib",
  isha: "prayer.isha",
};

/**
 * The top of Home: one card that says what to do now (ADR 0041). A slim prayer
 * banner appears only when a prayer is near; the habit strip shows "days this
 * week", never a broken chain. After a gap the reader is simply welcomed back.
 */
interface SurahLite {
  number: number;
  name: string;
  transliteration: string;
  englishName: string;
  ayahCount: number;
}

export function HomeToday({ surahs }: { surahs: readonly SurahLite[] }) {
  const [ready, setReady] = useState(false);
  const [lr, setLr] = useState<LastRead | null>(null);
  const [reading, setReading] = useState({ pages: 0, goal: 4, activeDates: [] as string[] });
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [comfort, setComfort] = useState<Comfort | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { t: tr, tf } = useIntl();

  useEffect(() => {
    setReady(true);
    const refreshLr = () => setLr(readLastReadFull());
    const refreshReading = () =>
      void readReadingState().then((s) =>
        setReading({ pages: s.pagesToday, goal: s.goal, activeDates: s.activeDates }),
      );
    const refreshPrayer = () => {
      void webPrayerSettingsStore.read().then(({ coords: c }) => setCoords(c));
      void webPrayerTimingsProvider.getTodaysTimings().then((t) => setTimings(t ?? null));
    };
    const refreshComfort = () => setComfort(readComfort());
    refreshLr();
    refreshReading();
    refreshPrayer();
    refreshComfort();
    window.addEventListener(LAST_READ_EVENT, refreshLr);
    window.addEventListener(READING_EVENT, refreshReading);
    window.addEventListener(PRAYER_SETTINGS_EVENT, refreshPrayer);
    window.addEventListener(COMFORT_EVENT, refreshComfort);
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => {
      window.removeEventListener(LAST_READ_EVENT, refreshLr);
      window.removeEventListener(READING_EVENT, refreshReading);
      window.removeEventListener(PRAYER_SETTINGS_EVENT, refreshPrayer);
      window.removeEventListener(COMFORT_EVENT, refreshComfort);
      clearInterval(id);
    };
  }, []);

  // Personal, local data: keep the server markup stable until mounted.
  if (!ready) return <div style={{ minHeight: 280 }} />;

  const t = today();
  const byNumber = new Map(surahs.map((s) => [s.number, s]));
  const resumeSurah = lr ? byNumber.get(lr.surah) : undefined;
  const resume = resumeSurah ? { sura: resumeSurah.number, aya: lr?.aya ?? 1 } : null;
  const portionDone = reading.goal > 0 && reading.pages >= reading.goal;
  const action = homeAction({ resume, activeDates: reading.activeDates, today: t, portionDone });
  const upcoming = timings ? nextPrayer(timings, now) : null;
  const near = upcoming && prayerIsNear(upcoming.at, now) ? upcoming : null;
  const week = lastSevenDays(reading.activeDates, t);
  const weekCount = week.filter((d) => d.active).length;
  const paused = comfort?.trackingPaused ?? false;
  const showStreak = comfort?.showStreaks ?? false;

  const hrefFor = (sura: number, aya: number) =>
    aya > 1 ? `/surah/${sura}#${sura}:${aya}` : `/surah/${sura}`;

  const speech =
    action.kind === "continue"
      ? `${action.welcomeBack ? tr("home.speakWelcomeBack") : ""} ${tf("home.speakContinue", {
          surah: resumeSurah?.transliteration ?? "",
          aya: action.at.aya,
        })}`
      : action.kind === "done"
        ? tr("home.speakDone")
        : tr("home.speakStart");

  return (
    <div style={{ display: "grid", gap: 14, marginBottom: 22 }}>
      {near && (
        <Link
          href="/prayer-times"
          className="nf-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            textDecoration: "none",
            color: N.fg,
            background: N.goldSoft,
            fontFamily: N.ui,
            fontSize: 15.5,
          }}
        >
          <span>
            <b>{tr(PRAYER_KEY[near.name])}</b>{" "}
            {tf("home.prayerIn", {
              min: Math.max(1, Math.round((near.at.getTime() - now.getTime()) / 60000)),
            })}
          </span>
          <span style={{ color: N.muted }}>{fmtPrayerTime(near.at, coords)}</span>
        </Link>
      )}

      <section
        className="nf-card"
        aria-labelledby="home-action-title"
        style={{ borderColor: N.gold, padding: "20px clamp(16px, 3vw, 24px)", gap: 12 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h2
            id="home-action-title"
            style={{ margin: 0, fontFamily: N.ui, fontSize: 15, fontWeight: 700, color: N.gold }}
          >
            {action.kind === "continue"
              ? action.welcomeBack
                ? tr("home.welcomeBack")
                : tr("home.continueReading")
              : action.kind === "done"
                ? tr("home.portionDone")
                : tr("home.beginHere")}
          </h2>
          <SpeakButton text={speech} label={tr("home.readCardAloud")} />
        </div>

        {action.kind === "continue" && resumeSurah && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontFamily: N.ui,
                  fontSize: "clamp(24px, 3.4vw, 28px)",
                  fontWeight: 800,
                  color: N.fg,
                }}
              >
                {resumeSurah.transliteration}
              </div>
              <div
                className="noor-ar"
                lang="ar"
                dir="rtl"
                style={{ fontSize: 32, color: N.goldHi, lineHeight: 1.7 }}
              >
                {resumeSurah.name}
              </div>
            </div>
            <div style={{ fontFamily: N.ui, fontSize: 15, color: N.muted }}>
              {tf("home.ayahOfJuz", {
                aya: action.at.aya,
                total: resumeSurah.ayahCount,
                juz: safeJuz(action.at.sura, action.at.aya),
              })}{" "}
              · {resumeSurah.englishName}
            </div>
            <div
              style={{ height: 8, borderRadius: 8, background: N.bg, overflow: "hidden" }}
              role="progressbar"
              aria-label={tr("home.surahProgress")}
              aria-valuenow={Math.round((action.at.aya / resumeSurah.ayahCount) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{
                  width: `${Math.min(100, (action.at.aya / resumeSurah.ayahCount) * 100)}%`,
                  height: "100%",
                  background: N.goldGrad,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href={hrefFor(action.at.sura, action.at.aya)}
                className="nf-btn nf-btn--gold"
                style={{ flex: "1 1 160px" }}
              >
                <Icon name="book" size={20} />
                {tr("home.continue")}
              </Link>
              <Link
                href={`/listen/${action.at.sura}#${action.at.aya}`}
                className="nf-btn"
                style={{ flex: "1 1 160px" }}
              >
                <Icon name="headphones" size={20} />
                {tr("home.listenInstead")}
              </Link>
            </div>
          </>
        )}

        {action.kind === "done" && (
          <>
            <p style={{ margin: 0, fontFamily: N.ui, fontSize: 16, color: N.fg }}>
              {tf(reading.pages === 1 ? "home.readPagesOne" : "home.readPagesMany", {
                n: reading.pages,
              })}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {action.at && (
                <Link
                  href={hrefFor(action.at.sura, action.at.aya)}
                  className="nf-btn"
                  style={{ flex: "1 1 160px" }}
                >
                  {tr("home.readMore")}
                </Link>
              )}
              <Link href="/goals" className="nf-btn" style={{ flex: "1 1 160px" }}>
                {tr("home.changePortion")}
              </Link>
            </div>
          </>
        )}

        {action.kind === "start" && (
          <>
            <p style={{ margin: 0, fontFamily: N.ui, fontSize: 16, color: N.fg }}>
              {tr("home.startHint")}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/surah/1" className="nf-btn nf-btn--gold" style={{ flex: "1 1 160px" }}>
                <Icon name="book" size={20} />
                {tr("home.readFatiha")}
              </Link>
              <Link href="/listen/112" className="nf-btn" style={{ flex: "1 1 160px" }}>
                <Icon name="headphones" size={20} />
                {tr("home.listenIkhlas")}
              </Link>
            </div>
          </>
        )}
      </section>

      <Link
        href="/goals"
        className="nf-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          padding: "14px 18px",
          textDecoration: "none",
          color: N.fg,
          fontFamily: N.ui,
        }}
      >
        <span style={{ display: "grid", gap: 2 }}>
          <b style={{ fontSize: 15.5 }}>
            {tf(reading.goal === 1 ? "home.todayPagesOne" : "home.todayPagesMany", {
              done: Math.min(reading.pages, reading.goal),
              goal: reading.goal,
            })}
          </b>
          <span style={{ fontSize: 14, color: N.muted }}>
            {paused
              ? tr("home.trackingPaused")
              : `${tf("home.daysThisWeek", { n: weekCount, total: 7 })}${
                  showStreak
                    ? ` · ${tf("home.daysInARow", { n: computeStreak(reading.activeDates, t) })}`
                    : ""
                }`}
          </span>
        </span>
        {!paused && (
          <span
            className="nf-week"
            aria-label={tf("home.lastSevenDays", { n: weekCount, total: 7 })}
          >
            {week.map((d) => (
              <i
                key={d.date}
                data-on={d.active ? "true" : undefined}
                data-today={d.isToday ? "true" : undefined}
                title={d.date}
              />
            ))}
          </span>
        )}
      </Link>
    </div>
  );
}

function safeJuz(sura: number, aya: number): number {
  try {
    return juzNumberOf({ sura, aya });
  } catch {
    return 1;
  }
}
