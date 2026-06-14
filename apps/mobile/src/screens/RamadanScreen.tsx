import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "../Type";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  DEFAULT_CALCULATION_METHOD,
  type Coordinates,
  type Madhab,
  type PrayerTimings,
  gregorianToHijri,
  hijriMonth,
} from "@ummahlibrary/core";
import { Khatam, Icon, type IconName } from "@ummahlibrary/ui";
import { api } from "../api";
import { KEYS, getJSON, getString, setJSON } from "../storage";
import { FONT } from "../fonts";
import { useTheme, type Palette } from "../theme";
import { fmtCountdown, fmtTime, localISODate } from "../utils";
import type { ToolsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<ToolsStackParamList, "Ramadan">;

const WORSHIP: { key: string; label: string; icon: IconName }[] = [
  { key: "suhur", label: "Suhūr", icon: "sun" },
  { key: "fajr", label: "Fajr in jamāʿah", icon: "moon" },
  { key: "quran", label: "Qurʾān juzʾ", icon: "book" },
  { key: "tarawih", label: "Tarāwīḥ", icon: "moon" },
];

function todayGreg() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function RamadanScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = localISODate(new Date());

  const [now, setNow] = useState(() => new Date());
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hasCoords, setHasCoords] = useState(false);
  const [fasts, setFasts] = useState<Record<number, true>>({});
  const [worship, setWorship] = useState<Record<string, true>>({});
  const [pagesRead, setPagesRead] = useState(0);

  const hijri = gregorianToHijri(todayGreg(), 0);
  const isRamadan = hijri.month === 9;
  const ramadanDay = isRamadan ? hijri.day : null;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    void getJSON<Record<number, true>>(KEYS.ramadanFasts, {}).then(setFasts);
    void getJSON<Record<string, Record<string, true>>>(KEYS.ramadanWorship, {}).then((m) =>
      setWorship(m[today] ?? {}),
    );
    void getJSON<Record<string, number>>(KEYS.readingLog, {}).then((log) =>
      setPagesRead(Object.values(log).reduce((a, b) => a + b, 0)),
    );
    void (async () => {
      const coords = await getJSON<Coordinates | null>(KEYS.prayerCoords, null);
      if (!coords) return;
      setHasCoords(true);
      const method = (await getString(KEYS.prayerMethod)) ?? DEFAULT_CALCULATION_METHOD;
      const madhab = ((await getString(KEYS.prayerMadhab)) as Madhab) || "shafi";
      try {
        const t = await api.getPrayerTimes({
          lat: coords.latitude,
          lng: coords.longitude,
          date: today,
          method,
          madhab,
        });
        setTimings(t as PrayerTimings);
      } catch {
        /* leave timings null */
      }
    })();
  }, []);

  function toggleFast(day: number) {
    setFasts((prev) => {
      const next = { ...prev };
      if (next[day]) delete next[day];
      else next[day] = true;
      void setJSON(KEYS.ramadanFasts, next);
      return next;
    });
  }

  function toggleWorship(key: string) {
    setWorship((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      void getJSON<Record<string, Record<string, true>>>(KEYS.ramadanWorship, {}).then((m) =>
        setJSON(KEYS.ramadanWorship, { ...m, [today]: next }),
      );
      return next;
    });
  }

  const fastsKept = Object.keys(fasts).length;
  const worshipDone = Object.keys(worship).length;
  const khatmPct = Math.min(100, Math.round((pagesRead / 604) * 100));
  const monthName = hijriMonth(hijri.month).name;

  const iftar = timings ? new Date(timings.maghrib) : null;
  const suhurEnd = timings ? new Date(timings.fajr) : null;
  const beforeIftar = iftar ? now < iftar : false;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.hijri}>
        {isRamadan ? `${ramadanDay} Ramaḍān ${hijri.year} AH` : `${hijri.day} ${monthName} ${hijri.year} AH`}
      </Text>

      {/* Ifṭār countdown */}
      <View style={styles.hero}>
        <View style={styles.heroWatermark} pointerEvents="none">
          <Khatam size={220} color={colors.accent} sw={0.9} opacity={0.06} />
        </View>
        {iftar ? (
          <>
            <Text style={styles.heroLabel}>{beforeIftar ? "Time until Ifṭār" : "Ifṭār has begun"}</Text>
            <Text style={styles.heroCountdown}>
              {beforeIftar ? fmtCountdown(iftar, now) : "🌙 Iftar mubarak"}
            </Text>
            <View style={styles.heroBarRow}>
              <Text style={styles.heroBarLabel}>Suhūr {suhurEnd ? fmtTime(timings!.fajr) : "—"}</Text>
              <Text style={styles.heroBarLabel}>Ifṭār {fmtTime(timings!.maghrib)}</Text>
            </View>
            <View style={styles.heroTrack}>
              <View
                style={[
                  styles.heroFill,
                  {
                    width: `${
                      suhurEnd && iftar
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              ((now.getTime() - suhurEnd.getTime()) /
                                (iftar.getTime() - suhurEnd.getTime())) *
                                100,
                            ),
                          )
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>Ifṭār countdown</Text>
            <Text style={styles.heroMuted}>
              {hasCoords ? "Loading today’s times…" : "Set your location to see suhūr & ifṭār times."}
            </Text>
            {!hasCoords && (
              <Pressable style={styles.heroBtn} onPress={() => navigation.navigate("PrayerTimes")}>
                <Text style={styles.heroBtnText}>Set location</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat value={`${fastsKept}/30`} label="Fasts kept" colors={colors} />
        <Stat value={isRamadan ? `${ramadanDay}/30` : "—"} label="Day of Ramaḍān" colors={colors} />
      </View>
      <View style={styles.statsRow}>
        <Stat value={`${khatmPct}%`} label="Khatm progress" colors={colors} />
        <Stat value={`${worshipDone}/4`} label="Today’s worship" colors={colors} />
      </View>

      {/* Fasting grid */}
      <Text style={styles.sectionLabel}>Fasting · Ramaḍān</Text>
      <View style={styles.fastGrid}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const kept = Boolean(fasts[d]);
          const isToday = ramadanDay === d;
          return (
            <Pressable
              key={d}
              style={[
                styles.fastCell,
                kept && styles.fastCellOn,
                isToday && !kept && styles.fastCellToday,
              ]}
              onPress={() => toggleFast(d)}
            >
              <Text style={[styles.fastNum, kept && styles.fastNumOn, isToday && !kept && styles.fastNumToday]}>
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Today's worship */}
      <View style={styles.worshipHead}>
        <Text style={styles.sectionLabel}>Today’s worship</Text>
        <Text style={styles.worshipCount}>{worshipDone}/4</Text>
      </View>
      <View style={styles.worshipGrid}>
        {WORSHIP.map((w) => {
          const on = Boolean(worship[w.key]);
          return (
            <Pressable
              key={w.key}
              style={[styles.worshipItem, on && styles.worshipItemOn]}
              onPress={() => toggleWorship(w.key)}
            >
              <View style={[styles.worshipDot, on && styles.worshipDotOn]}>
                <Icon
                  name={on ? "check" : w.icon}
                  size={13}
                  color={on ? colors.ink : colors.faint}
                  sw={2}
                />
              </View>
              <Text style={[styles.worshipLabel, on && styles.worshipLabelOn]}>{w.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: Palette }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, gap: 12, paddingBottom: 32 },
    hijri: { color: c.muted, fontSize: 13.5, textAlign: "center" },
    hero: {
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      overflow: "hidden",
    },
    heroWatermark: { position: "absolute", top: "50%", marginTop: -110 },
    heroLabel: {
      color: c.accent,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
    },
    heroCountdown: { color: c.fg, fontSize: 46, fontFamily: FONT.extrabold, letterSpacing: -1.5, marginVertical: 6 },
    heroMuted: { color: c.muted, fontSize: 14, textAlign: "center", marginTop: 8 },
    heroBtn: {
      marginTop: 14,
      backgroundColor: c.accent,
      borderRadius: 11,
      paddingVertical: 11,
      paddingHorizontal: 22,
    },
    heroBtnText: { color: c.ink, fontSize: 14.5, fontFamily: FONT.bold },
    heroBarRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 14 },
    heroBarLabel: { color: c.muted, fontSize: 12 },
    heroTrack: { height: 7, borderRadius: 4, backgroundColor: c.border, overflow: "hidden", width: "100%", marginTop: 6 },
    heroFill: { height: 7, borderRadius: 4, backgroundColor: c.accent },
    statsRow: { flexDirection: "row", gap: 12 },
    stat: {
      flex: 1,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 15,
    },
    statValue: { color: c.accent, fontSize: 22, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    statLabel: { color: c.faint, fontSize: 12.5, marginTop: 3 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginTop: 8,
    },
    fastGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 12,
    },
    fastCell: {
      width: "8.7%",
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    fastCellOn: { backgroundColor: c.accent, borderColor: "transparent" },
    fastCellToday: { borderColor: c.accent },
    fastNum: { color: c.faint, fontSize: 11.5, fontFamily: FONT.bold },
    fastNumOn: { color: c.ink },
    fastNumToday: { color: c.accent },
    worshipHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    worshipCount: { color: c.accent, fontSize: 12.5, fontFamily: FONT.bold },
    worshipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    worshipItem: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    worshipItemOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    worshipDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    worshipDotOn: { backgroundColor: c.accent, borderColor: "transparent" },
    worshipLabel: { color: c.muted, fontSize: 12.5, fontFamily: FONT.semibold, flex: 1 },
    worshipLabelOn: { color: c.fg },
  });
}
