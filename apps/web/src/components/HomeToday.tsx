"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type Coordinates,
  PRAYER_LABELS,
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
      ? `${action.welcomeBack ? "Welcome back." : ""} Continue reading ${resumeSurah?.transliteration ?? ""}, āyah ${action.at.aya}. Press Continue to read, or Listen to hear the recitation.`
      : action.kind === "done"
        ? "Today's portion is done. You can stop here, or read a little more."
        : "Welcome. Start with Al-Fātiḥah, or listen to a short surah.";

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
            <b>{PRAYER_LABELS[near.name]}</b> in{" "}
            {Math.max(1, Math.round((near.at.getTime() - now.getTime()) / 60000))} minutes
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
                ? "Welcome back"
                : "Continue reading"
              : action.kind === "done"
                ? "Today's portion is done"
                : "Begin here"}
          </h2>
          <SpeakButton text={speech} label="Read this card aloud" />
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
                  fontSize: "clamp(22px, 3.4vw, 28px)",
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
                style={{ fontSize: 34, color: N.goldHi, lineHeight: 1.6 }}
              >
                {resumeSurah.name}
              </div>
            </div>
            <div style={{ fontFamily: N.ui, fontSize: 15, color: N.muted }}>
              Āyah {action.at.aya} of {resumeSurah.ayahCount} · Juz{" "}
              {safeJuz(action.at.sura, action.at.aya)} · {resumeSurah.englishName}
            </div>
            <div
              style={{ height: 8, borderRadius: 8, background: N.bg, overflow: "hidden" }}
              role="progressbar"
              aria-label="Progress through the surah"
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
                Continue
              </Link>
              <Link
                href={`/listen/${action.at.sura}#${action.at.aya}`}
                className="nf-btn"
                style={{ flex: "1 1 160px" }}
              >
                <Icon name="headphones" size={20} />
                Listen instead
              </Link>
            </div>
          </>
        )}

        {action.kind === "done" && (
          <>
            <p style={{ margin: 0, fontFamily: N.ui, fontSize: 16, color: N.fg }}>
              You read {reading.pages} {reading.pages === 1 ? "page" : "pages"} today. You can stop
              here.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {action.at && (
                <Link
                  href={hrefFor(action.at.sura, action.at.aya)}
                  className="nf-btn"
                  style={{ flex: "1 1 160px" }}
                >
                  Read a little more
                </Link>
              )}
              <Link href="/goals" className="nf-btn" style={{ flex: "1 1 160px" }}>
                Change my daily portion
              </Link>
            </div>
          </>
        )}

        {action.kind === "start" && (
          <>
            <p style={{ margin: 0, fontFamily: N.ui, fontSize: 16, color: N.fg }}>
              Start with the opening surah, or listen to a short one.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/surah/1" className="nf-btn nf-btn--gold" style={{ flex: "1 1 160px" }}>
                <Icon name="book" size={20} />
                Read Al-Fātiḥah
              </Link>
              <Link href="/listen/112" className="nf-btn" style={{ flex: "1 1 160px" }}>
                <Icon name="headphones" size={20} />
                Listen to Al-Ikhlāṣ
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
            Today: {Math.min(reading.pages, reading.goal)} of {reading.goal}{" "}
            {reading.goal === 1 ? "page" : "pages"}
          </b>
          <span style={{ fontSize: 14, color: N.muted }}>
            {paused
              ? "Tracking paused — your progress is kept."
              : `${weekCount} of 7 days this week${
                  showStreak ? ` · ${computeStreak(reading.activeDates, t)} days in a row` : ""
                }`}
          </span>
        </span>
        {!paused && (
          <span className="nf-week" aria-label={`${weekCount} of the last 7 days`}>
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
