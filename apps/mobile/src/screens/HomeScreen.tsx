import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LTR_TEXT } from "../text-direction";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  type Madhab,
  type PrayerName,
  type PrayerTimings,
  type Surah,
  nextPrayer,
} from "@ummahlibrary/core";
import { Icon } from "@ummahlibrary/ui";
import { api } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { useLibrary } from "../state/LibraryContext";
import { SaveToCollection } from "../components/SaveToCollection";
import { HomeToday, type HomeReading } from "../components/HomeToday";
import { EasyHome } from "../components/EasyHome";
import { useSettings } from "../state/SettingsContext";
import { verseOfToday } from "../verses";
import { readReadingState, todayStr } from "../reading-goals";
import { KEYS, getJSON, getString } from "../storage";
import { fmtPrayerTime, localISODate } from "../utils";
import { useIntl } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";
import type { HomeStackParamList } from "../navigation/types";
import { onSyncApplied } from "../lib/sync/sync-events";

type Props = NativeStackScreenProps<HomeStackParamList, "Today">;

/** Interface name of each prayer, in the reader's language. */
const PRAYER_KEYS: Record<PrayerName, MessageKey> = {
  fajr: "home.prayer.fajr",
  sunrise: "home.prayer.sunrise",
  dhuhr: "home.prayer.dhuhr",
  asr: "home.prayer.asr",
  maghrib: "home.prayer.maghrib",
  isha: "home.prayer.isha",
};

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { t, tf, dir } = useIntl();
  const { lastRead, lastReadAya } = useLibrary();
  const { comfort, editions } = useSettings();
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [now, setNow] = useState(() => new Date());
  // Reading state for the Today card and the "days this week" strip.
  const [reading, setReading] = useState<HomeReading>({ pagesToday: 0, goal: 4, activeDates: [] });

  useEffect(() => {
    let active = true;
    void api
      .listSurahs()
      .then((s) => active && setSurahs(s))
      .catch(() => undefined);
    const loadReading = () =>
      void readReadingState().then((s) => {
        if (active) setReading({ pagesToday: s.pagesToday, goal: s.goal, activeDates: s.active });
      });
    loadReading();
    // Re-read when Home regains focus (a reading session just ended) and on sync.
    const unfocus = navigation.addListener("focus", loadReading);
    const unsubscribe = onSyncApplied(loadReading);
    return () => {
      active = false;
      unfocus();
      unsubscribe();
    };
  }, [navigation]);

  // The local date `timings` was fetched for. Nothing else re-triggers the
  // fetch below — an app left open (or backgrounded/foregrounded) across
  // local midnight on this, the screen most likely to stay mounted for long
  // stretches, would keep showing yesterday's timings, silently stuck once
  // `nextPrayer`'s single-day rollover fallback is exhausted (see the
  // identical fix and full explanation in PrayerTimesScreen.tsx).
  const timingsDateRef = useRef<string | null>(null);

  // Live next-prayer for the home strip — uses the saved location only (no
  // permission prompt here; that lives on the Prayer Times screen).
  const loadTimings = useCallback(() => {
    void Promise.all([
      getJSON<Coordinates | null>(KEYS.prayerCoords, null),
      getString(KEYS.prayerMethod),
      getString(KEYS.prayerMadhab),
    ]).then(([c, method, madhab]) => {
      if (!c) return;
      setCoords(c);
      const today = localISODate(new Date());
      void api
        .getPrayerTimes({
          lat: c.latitude,
          lng: c.longitude,
          date: today,
          method: method ?? DEFAULT_CALCULATION_METHOD,
          madhab: (madhab as Madhab) || "shafi",
        })
        .then((t) => {
          timingsDateRef.current = today;
          setTimings(t as PrayerTimings);
        })
        .catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    loadTimings();
    return onSyncApplied(loadTimings);
  }, [loadTimings]);

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNow(n);
      const today = localISODate(n);
      if (timingsDateRef.current && timingsDateRef.current !== today) loadTimings();
    }, 30000);
    return () => clearInterval(id);
  }, [loadTimings]);

  const upcoming = timings ? nextPrayer(timings, now) : null;
  const nextP: { name: PrayerName; at: Date } | null =
    upcoming ??
    (timings ? { name: "fajr", at: new Date(new Date(timings.fajr).getTime() + 86400000) } : null);

  const vod = verseOfToday();

  // "2h 15m" / "8m" in the reader's language and digits.
  const countdown = (target: Date): string => {
    if (Number.isNaN(target.getTime())) return "—";
    const secs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs - h * 3600) / 60);
    return h > 0 ? tf("home.cdHM", { h, m }) : tf("home.cdM", { m });
  };
  const chevronFlip = dir === "rtl" ? { transform: [{ scaleX: -1 }] } : null;

  // Cross-tab navigation helpers.
  const toRead = (params?: { screen: string; params?: object }) =>
    navigation.getParent()?.navigate("Read", params as never);
  const toTools = (screen: string) =>
    navigation.getParent()?.navigate("Tools", { screen } as never);
  const openSurah = (surah: number, aya?: number, listen = false) =>
    toRead({
      screen: "SurahReader",
      params: { surah, ...(aya && aya > 1 ? { aya } : {}), ...(listen ? { listen: true } : {}) },
    });
  const toGoals = () =>
    navigation.getParent()?.navigate("More", { screen: "ReadingGoals" } as never);

  const quick: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onPress: () => void }[] =
    [
      { icon: "book", label: t("tab.read"), onPress: () => toRead() },
      {
        icon: "headphones",
        label: t("home.listen"),
        onPress: () => openSurah(lastRead ?? 1, lastReadAya ?? undefined, true),
      },
      { icon: "compass", label: t("home.qibla"), onPress: () => toTools("Qibla") },
    ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t("home.greeting")}</Text>
          <Text style={styles.title}>{t("home.today")}</Text>
        </View>
        <View style={styles.bell}>
          <Icon name="bell" size={20} color={colors.muted} sw={1.8} />
        </View>
      </View>

      {comfort.mode === "easy" ? (
        <EasyHome
          surahs={surahs}
          lastRead={lastRead}
          lastReadAya={lastReadAya}
          nextPrayer={
            nextP
              ? tf("home.prayerAt", {
                  name: t(PRAYER_KEYS[nextP.name]),
                  time: fmtPrayerTime(nextP.at, coords),
                })
              : null
          }
          onRead={(s, a) => openSurah(s, a)}
          onListen={(s, a) => openSurah(s, a, true)}
          onChoose={() => toRead({ screen: "SurahList" })}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {/* One card that says what to do now, then days this week (ADR 0041). */}
          <HomeToday
            surahs={surahs}
            lastRead={lastRead}
            lastReadAya={lastReadAya}
            reading={reading}
            today={todayStr()}
            onRead={(s, a) => openSurah(s, a)}
            onListen={(s, a) => openSurah(s, a, true)}
            onGoals={toGoals}
          />

          {/* Next prayer strip — live countdown if a location is saved */}
          <Pressable style={styles.prayerStrip} onPress={() => toTools("PrayerTimes")}>
            <Icon name="moon" size={22} color={colors.accent} sw={1.8} />
            {nextP ? (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prayerLabel}>
                    {tf("home.nextPrayer", { name: t(PRAYER_KEYS[nextP.name]) })}
                  </Text>
                  <Text style={styles.prayerValue}>
                    {tf("home.inTime", { time: countdown(nextP.at) })}
                  </Text>
                </View>
                <Text style={styles.prayerTime}>{fmtPrayerTime(nextP.at, coords)}</Text>
              </>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prayerLabel}>{t("home.prayerTimes")}</Text>
                  <Text style={styles.prayerValue}>{t("home.prayerTimesSub")}</Text>
                </View>
                <View style={chevronFlip}>
                  <Icon name="chevR" size={18} color={colors.faint} sw={1.8} />
                </View>
              </>
            )}
          </Pressable>

          {/* Verse of the day */}
          <View style={styles.vod}>
            <View style={styles.vodHead}>
              <Text style={styles.kicker}>{t("home.vod")}</Text>
              <SaveToCollection sura={vod.sura} aya={vod.aya} asIcon />
            </View>
            <Text style={styles.vodAr}>{vod.ar}</Text>
            {/* The curated English excerpt shows only when English is the
                reader's translation (ADR 0041); otherwise Arabic + reference. */}
            {editions[0]?.startsWith("eng-") ? (
              <Text style={[styles.vodEn, LTR_TEXT]}>{vod.en}</Text>
            ) : null}
            <Text style={styles.vodRef}>{vod.ref}</Text>
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            {quick.map((a) => (
              <Pressable key={a.label} style={styles.quickCard} onPress={a.onPress}>
                <Icon name={a.icon} size={22} color={colors.accent} sw={1.8} />
                <Text style={styles.quickLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    greeting: { color: c.muted, fontSize: 13, marginBottom: 2 },
    title: { color: c.fg, fontSize: 26, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    // Not a button — there's no notification center to open yet, so this is
    // deliberately unstyled as one (no badge/border) rather than looking
    // tappable and doing nothing.
    bell: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
    kicker: {
      color: c.accent,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    prayerStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 15,
    },
    prayerLabel: { color: c.muted, fontSize: 13 },
    prayerValue: { color: c.fg, fontSize: 16, fontFamily: FONT.bold, marginTop: 1 },
    prayerTime: { color: c.accent, fontSize: 18, fontFamily: FONT.extrabold },
    vod: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    vodHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    vodAr: {
      color: c.fg,
      fontSize: 24,
      lineHeight: 54,
      textAlign: "right",
      writingDirection: "rtl",
      fontFamily: FONT.arQuran,
      direction: "ltr",
    },
    vodEn: { color: c.muted, fontSize: 14.5, lineHeight: 23 },
    vodRef: { color: c.accent, fontSize: 13, fontFamily: FONT.semibold },
    quickRow: { flexDirection: "row", gap: 12 },
    quickCard: {
      flex: 1,
      alignItems: "center",
      gap: 9,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingVertical: 16,
      minHeight: 72,
    },
    quickLabel: { color: c.fg, fontSize: 14, fontFamily: FONT.semibold },
  });
}
