"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type Coordinates,
  type PrayerName,
  type PrayerTimings,
  nextPrayer,
} from "@ummahlibrary/core";
import { N, Icon } from "@ummahlibrary/ui";
import { type LastRead, readLastReadFull } from "../lib/reader-prefs-store";
import { webPrayerTimingsProvider } from "../lib/prayer-timings-provider";
import { webPrayerSettingsStore } from "../lib/prayer-settings-store";
import { fmtPrayerTime } from "../lib/prayer-time-format";
import { writeComfort } from "../lib/comfort-store";
import { HoldButton } from "./HoldButton";
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

interface SurahLite {
  number: number;
  transliteration: string;
}

/**
 * Easy mode Home (ADR 0041), modelled on Apple's Assistive Access: three large,
 * labelled tiles and nothing else to decide. For first phones, older eyes and
 * anyone who finds the full app too much. Leaving it is a deliberate hold.
 */
export function EasyHome({ surahs }: { surahs: readonly SurahLite[] }) {
  const [lr, setLr] = useState<LastRead | null>(null);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const { t, tf } = useIntl();

  useEffect(() => {
    setLr(readLastReadFull());
    void webPrayerSettingsStore.read().then(({ coords: c }) => setCoords(c));
    void webPrayerTimingsProvider.getTodaysTimings().then((t) => setTimings(t ?? null));
  }, []);

  const surah = lr ? surahs.find((s) => s.number === lr.surah) : undefined;
  const aya = lr?.aya ?? 1;
  const upcoming = timings ? nextPrayer(timings, new Date()) : null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 16, paddingBottom: 24 }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <h1 style={{ margin: 0, fontFamily: N.ui, fontSize: 28, fontWeight: 800 }}>
          {t("home.greeting")}
        </h1>
        <SpeakButton text={t("easy.speakChoices")} label={t("easy.readChoices")} />
      </div>
      {upcoming && (
        <p style={{ margin: 0, fontFamily: N.ui, fontSize: 20, color: N.fg }}>
          {t("easy.nextPrayer")} <b>{t(PRAYER_KEY[upcoming.name])}</b> ·{" "}
          {fmtPrayerTime(upcoming.at, coords)}
        </p>
      )}

      <Link
        href={
          surah ? `/surah/${surah.number}${aya > 1 ? `#${surah.number}:${aya}` : ""}` : "/surah/1"
        }
        className="nf-tile"
      >
        <span className="ic" aria-hidden="true">
          <Icon name="book" size={30} />
        </span>
        <span>
          {surah ? t("home.continue") : t("easy.read")}
          <small>
            {surah ? `${surah.transliteration} · ${tf("easy.ayahN", { aya })}` : t("easy.fatiha")}
          </small>
        </span>
      </Link>
      <Link href={surah ? `/listen/${surah.number}#${aya}` : "/listen/1"} className="nf-tile">
        <span className="ic" aria-hidden="true">
          <Icon name="headphones" size={30} />
        </span>
        <span>
          {t("nav.listen")}
          <small>{t("note.listen")}</small>
        </span>
      </Link>
      <Link href="/quran" className="nf-tile">
        <span className="ic" aria-hidden="true">
          <Icon name="grid" size={30} />
        </span>
        <span>
          {t("easy.chooseSurah")}
          <small>{tf("easy.chooseSurahNote", { n: 114 })}</small>
        </span>
      </Link>

      <div style={{ marginTop: 12, display: "grid", justifyItems: "start", gap: 6 }}>
        <HoldButton
          label={t("easy.holdToLeave")}
          onHold={() => {
            writeComfort({ mode: "standard" });
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
