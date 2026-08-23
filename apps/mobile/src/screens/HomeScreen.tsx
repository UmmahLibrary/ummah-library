import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  type Coordinates,
  DEFAULT_CALCULATION_METHOD,
  type Madhab,
  PRAYER_LABELS,
  type PrayerName,
  type PrayerTimings,
  type Surah,
  nextPrayer,
} from "@ummahlibrary/core";
import { Icon, Khatam } from "@ummahlibrary/ui";
import { api } from "../api";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { useLibrary } from "../state/LibraryContext";
import { AyahBadge } from "../components/AyahBadge";
import { SaveToCollection } from "../components/SaveToCollection";
import { verseOfToday } from "../verses";
import { readReadingState } from "../reading-goals";
import { KEYS, getJSON, getString } from "../storage";
import { fmtCountdown, fmtPrayerTime, localISODate } from "../utils";
import type { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Today">;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { lastRead } = useLibrary();
  const [surahs, setSurahs] = useState<Surah[] | null>(null);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [now, setNow] = useState(() => new Date());
  // Reading progress (daily pages / goal) for the continue-reading progress bar.
  const [readPct, setReadPct] = useState(0);

  useEffect(() => {
    let active = true;
    void api.listSurahs().then((s) => active && setSurahs(s)).catch(() => undefined);
    void readReadingState().then((s) => {
      if (active) setReadPct(Math.min(1, s.goal > 0 ? s.pagesToday / s.goal : 0));
    });
    return () => {
      active = false;
    };
  }, []);

  // Live next-prayer for the home strip — uses the saved location only (no
  // permission prompt here; that lives on the Prayer Times screen).
  useEffect(() => {
    let active = true;
    void Promise.all([
      getJSON<Coordinates | null>(KEYS.prayerCoords, null),
      getString(KEYS.prayerMethod),
      getString(KEYS.prayerMadhab),
    ]).then(([c, method, madhab]) => {
      if (!active || !c) return;
      setCoords(c);
      void api
        .getPrayerTimes({
          lat: c.latitude,
          lng: c.longitude,
          date: localISODate(new Date()),
          method: method ?? DEFAULT_CALCULATION_METHOD,
          madhab: (madhab as Madhab) || "shafi",
        })
        .then((t) => active && setTimings(t as PrayerTimings))
        .catch(() => undefined);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const upcoming = timings ? nextPrayer(timings, now) : null;
  const nextP: { name: PrayerName; at: Date } | null =
    upcoming ??
    (timings ? { name: "fajr", at: new Date(new Date(timings.fajr).getTime() + 86400000) } : null);

  const last = useMemo(
    () => (lastRead != null ? (surahs ?? []).find((s) => s.number === lastRead) : undefined),
    [surahs, lastRead],
  );
  const vod = verseOfToday();

  // Cross-tab navigation helpers.
  const toRead = (params?: { screen: string; params?: object }) =>
    navigation.getParent()?.navigate("Read", params as never);
  const toTools = (screen: string) =>
    navigation.getParent()?.navigate("Tools", { screen } as never);

  const quick: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onPress: () => void }[] = [
    { icon: "book", label: "Read", onPress: () => toRead() },
    { icon: "headphones", label: "Listen", onPress: () => (last ? toRead({ screen: "SurahReader", params: { surah: last.number } }) : toRead()) },
    { icon: "compass", label: "Qibla", onPress: () => toTools("Qibla") },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Assalāmu ʿalaykum</Text>
          <Text style={styles.title}>Today</Text>
        </View>
        <View style={styles.bell}>
          <Icon name="bell" size={20} color={colors.muted} sw={1.8} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Continue reading */}
        {last && (
          <Pressable
            style={styles.continue}
            onPress={() => toRead({ screen: "SurahReader", params: { surah: last.number } })}
          >
            <View style={styles.continueWatermark} pointerEvents="none">
              <Khatam size={150} color={colors.accent} sw={1.1} opacity={0.07} />
            </View>
            <Text style={styles.kicker}>Continue reading</Text>
            <View style={styles.continueRow}>
              <AyahBadge n={last.number} size={48} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.continueName}>{last.transliteration}</Text>
                <Text style={styles.continueSub}>
                  {last.englishName} · {last.ayahCount} verses
                </Text>
              </View>
              <Text style={styles.continueAr}>{last.name}</Text>
            </View>
            {/* Progress bar (design: h6 · radius3, gold) — daily reading progress */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(readPct * 100)}%` }]} />
            </View>
          </Pressable>
        )}

        {/* Next prayer strip — live countdown if a location is saved */}
        <Pressable style={styles.prayerStrip} onPress={() => toTools("PrayerTimes")}>
          <Icon name="moon" size={22} color={colors.accent} sw={1.8} />
          {nextP ? (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.prayerLabel}>Next prayer · {PRAYER_LABELS[nextP.name]}</Text>
                <Text style={styles.prayerValue}>in {fmtCountdown(nextP.at, now)}</Text>
              </View>
              <Text style={styles.prayerTime}>{fmtPrayerTime(nextP.at, coords)}</Text>
            </>
          ) : (
            <>
              <View style={{ flex: 1 }}>
                <Text style={styles.prayerLabel}>Prayer times</Text>
                <Text style={styles.prayerValue}>View today’s ṣalāh times</Text>
              </View>
              <Icon name="chevR" size={18} color={colors.faint} sw={1.8} />
            </>
          )}
        </Pressable>

        {/* Verse of the day */}
        <View style={styles.vod}>
          <View style={styles.vodHead}>
            <Text style={styles.kicker}>Verse of the day</Text>
            <SaveToCollection sura={vod.sura} aya={vod.aya} asIcon />
          </View>
          <Text style={styles.vodAr}>{vod.ar}</Text>
          <Text style={styles.vodEn}>{vod.en}</Text>
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
    continue: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 18,
      overflow: "hidden",
    },
    continueWatermark: { position: "absolute", right: -36, top: -42 },
    continueRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 },
    continueName: { color: c.fg, fontSize: 17, fontFamily: FONT.bold },
    continueSub: { color: c.muted, fontSize: 13.5, marginTop: 2 },
    continueAr: { color: c.accentHi, fontSize: 24, writingDirection: "rtl", fontFamily: FONT.ar },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.bg,
      marginTop: 16,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3, backgroundColor: c.accent },
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
    prayerLabel: { color: c.muted, fontSize: 12 },
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
    vodAr: { color: c.fg, fontSize: 24, lineHeight: 44, textAlign: "right", writingDirection: "rtl" },
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
    },
    quickLabel: { color: c.fg, fontSize: 13, fontFamily: FONT.semibold },
  });
}
