import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "../Type";
import {
  type BadgeStats,
  type PrayerTrackerLog,
  computeStreak,
  evaluateBadges,
  longestStreak,
  newlyUnlocked,
  prayerStreak,
  totalSavedAyahs,
  unlockedIds,
} from "@ummahlibrary/core";
import { Khatam } from "@ummahlibrary/ui";
import { useTheme, type Palette } from "../theme";
import { FONT } from "../fonts";
import { useLibrary } from "../state/LibraryContext";
import { surahProgressMap } from "../hifz";
import { KEYS, getJSON, isObjectRecord } from "../storage";
import { mobileAchievementsStore as achievementsStore } from "../achievements-store";
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
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const today = localISODate(new Date());
    void getJSON<Record<number, true>>(KEYS.asmaLearned, {}, isObjectRecord).then((m) =>
      setNames(Object.keys(m).length),
    );
    void getJSON<PrayerTrackerLog>(KEYS.prayerLog, {}, isObjectRecord).then((log) =>
      setPrayer({ streak: prayerStreak(log, today), best: longestStreak(log) }),
    );
    void Promise.all([
      getJSON<Record<string, number>>(KEYS.readingLog, {}, isObjectRecord),
      getJSON<string[]>(KEYS.readingActive, [], Array.isArray),
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

  const badgeStats: BadgeStats = {
    memorized: trackedCount,
    surahsStarted,
    prayerStreak: prayer.streak,
    bestStreak,
    namesLearned: names,
    savedVerses: saved,
  };
  const badges = evaluateBadges(badgeStats);
  const earned = badges.filter((b) => b.unlocked).length;

  // Celebrate newly-unlocked badges once (persist the acknowledged ids).
  useEffect(() => {
    let cancelled = false;
    void achievementsStore.read().then((ack) => {
      if (cancelled) return;
      const fresh = newlyUnlocked(badgeStats, ack);
      if (fresh.length > 0) {
        const first = fresh[0];
        setToast(
          fresh.length === 1 && first
            ? `🎉 Unlocked: ${first.name}`
            : `🎉 ${fresh.length} new badges unlocked!`,
        );
        void achievementsStore.write(unlockedIds(badgeStats));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [trackedCount, surahsStarted, prayer.streak, bestStreak, names, saved]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <View style={styles.root}>
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

      <Text style={styles.sectionLabel}>
        Achievements · {earned}/{badges.length}
      </Text>
      <View style={styles.badgeGrid}>
        {badges.map(({ badge, unlocked }) => (
          <View key={badge.id} style={[styles.badge, !unlocked && styles.badgeLocked]}>
            <View style={[styles.badgeIcon, unlocked ? styles.badgeIconOn : styles.badgeIconOff]}>
              <Text style={styles.badgeGlyph}>{badge.glyph}</Text>
            </View>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={[styles.badgeStatus, unlocked && styles.badgeStatusOn]}>
              {unlocked ? "Unlocked" : "Locked"}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <View style={styles.toastPill}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    screen: { padding: 18, backgroundColor: c.bg, paddingBottom: 32 },
    toast: { position: "absolute", left: 16, right: 16, bottom: 24, alignItems: "center" },
    toastPill: {
      backgroundColor: c.accent,
      borderRadius: 999,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    toastText: { color: c.ink, fontFamily: FONT.extrabold, fontSize: 14 },
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
