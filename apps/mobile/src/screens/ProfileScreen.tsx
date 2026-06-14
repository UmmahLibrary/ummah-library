import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "../Type";
import {
  type PrayerTrackerLog,
  computeStreak,
  longestStreak,
  prayerStreak,
  totalSavedAyahs,
} from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useLibrary } from "../state/LibraryContext";
import { surahProgressMap } from "../hifz";
import { KEYS, getJSON } from "../storage";
import { localISODate } from "../utils";

/**
 * "Your journey" — a progress dashboard derived entirely from the local-first
 * data the app already keeps (Hifz, prayer log, reading log, names learned,
 * collections). No account: honest for a local-first app (ADR 0006).
 */
export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { allRecords, trackedCount, streak, collections } = useLibrary();

  const [names, setNames] = useState(0);
  const [prayer, setPrayer] = useState({ streak: 0, best: 0 });
  const [reading, setReading] = useState({ pages: 0, streak: 0 });

  useEffect(() => {
    const today = localISODate(new Date());
    void getJSON<Record<number, true>>(KEYS.asmaLearned, {}).then((m) =>
      setNames(Object.keys(m).length),
    );
    void getJSON<PrayerTrackerLog>(KEYS.prayerLog, {}).then((log) =>
      setPrayer({ streak: prayerStreak(log, today), best: longestStreak(log) }),
    );
    void Promise.all([
      getJSON<Record<string, number>>(KEYS.readingLog, {}),
      getJSON<string[]>(KEYS.readingActive, []),
    ]).then(([log, active]) => {
      const pages = Object.values(log).reduce((a, b) => a + b, 0);
      setReading({ pages, streak: computeStreak(active, today) });
    });
  }, []);

  const surahsStarted = surahProgressMap(allRecords(), new Date()).size;
  const saved = totalSavedAyahs(collections);
  const bestStreak = Math.max(streak.count, prayer.streak, prayer.best, reading.streak);

  const stats: [string, string][] = [
    [`${streak.count} 🔥`, "Hifz streak"],
    [String(trackedCount), "Āyāt memorized"],
    [String(surahsStarted), "Surahs started"],
    [`${prayer.streak}`, "Prayer streak"],
    [`${names}/99`, "Names learned"],
    [String(saved), "Saved verses"],
  ];

  const achievements: [string, string, boolean][] = [
    ["✦", "First āyah", trackedCount > 0],
    ["📖", "Memorizer", surahsStarted >= 1],
    ["🔥", "7-day streak", bestStreak >= 7],
    ["🌙", "30-day streak", bestStreak >= 30],
    ["✨", "Ten Names", names >= 10],
    ["🔖", "Collector", saved >= 5],
  ];

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerWatermark} pointerEvents="none">
          <Khatam size={140} color={colors.accent} sw={1.1} opacity={0.08} />
        </View>
        <View style={styles.avatar}>
          <Khatam size={34} color={colors.ink} sw={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name}>Your journey</Text>
          <Text style={styles.sub}>Local-first · saved on this device</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map(([v, l]) => (
          <View key={l} style={styles.stat}>
            <Text style={styles.statValue}>{v}</Text>
            <Text style={styles.statLabel}>{l}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Achievements</Text>
      <View style={styles.badgeGrid}>
        {achievements.map(([g, name, got]) => (
          <View key={name} style={[styles.badge, !got && styles.badgeLocked]}>
            <View style={[styles.badgeIcon, got ? styles.badgeIconOn : styles.badgeIconOff]}>
              <Text style={styles.badgeGlyph}>{g}</Text>
            </View>
            <Text style={styles.badgeName}>{name}</Text>
            <Text style={[styles.badgeStatus, got && styles.badgeStatusOn]}>
              {got ? "Unlocked" : "Locked"}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    screen: { padding: 18, backgroundColor: c.bg, paddingBottom: 32 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      padding: 20,
      overflow: "hidden",
      marginBottom: 16,
    },
    headerWatermark: { position: "absolute", right: -34, bottom: -38 },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { color: c.fg, fontSize: 21, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    sub: { color: c.muted, fontSize: 13, marginTop: 2 },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
      marginBottom: 22,
    },
    stat: {
      width: "31.5%",
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
    },
    statValue: { color: c.accent, fontSize: 20, fontFamily: FONT.extrabold, letterSpacing: -0.5 },
    statLabel: { color: c.faint, fontSize: 11.5, marginTop: 3 },
    sectionLabel: {
      color: c.faint,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontFamily: FONT.bold,
      marginBottom: 11,
    },
    badgeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
    badge: {
      width: "31.5%",
      backgroundColor: c.bgElev,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    badgeLocked: { opacity: 0.55 },
    badgeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 9,
    },
    badgeIconOn: { backgroundColor: c.accentSoft, borderColor: c.accent },
    badgeIconOff: { borderColor: c.border },
    badgeGlyph: { fontSize: 22 },
    badgeName: { color: c.fg, fontSize: 12.5, fontFamily: FONT.bold, textAlign: "center", lineHeight: 16 },
    badgeStatus: { color: c.faint, fontSize: 10.5, fontFamily: FONT.semibold, marginTop: 3 },
    badgeStatusOn: { color: c.accent },
  });
}
